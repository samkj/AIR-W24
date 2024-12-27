import json
from typing import AsyncGenerator

from fastapi import APIRouter
from langchain_mistralai import ChatMistralAI
from langchain_ollama import ChatOllama
from sqlalchemy.testing.suite.test_reflection import metadata
from starlette.responses import StreamingResponse

from endpoints import *

from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI

bot_endpoint_router = APIRouter()


@bot_endpoint_router.post("/bot/request")
def bot_request(query: str, model: str):
    llm = None
    if model == "gpt-4o-mini":
        llm = ChatOpenAI(model="gpt-4o-mini")
    elif model == "ollama-mistral":
        llm = ChatOllama(model="mistral")
    elif model == "mistral-large-latest":
        llm = ChatMistralAI(
            model="mistral-large-latest",
            temperature=0,
            max_retries=2,
        )

    agent_executor = create_react_agent(llm, [retrieve])
    input_message = query

    async def token_stream() -> AsyncGenerator[str, None]:
        last_event = None

        for event in agent_executor.stream(
                {"messages": [{"role": "user", "content": input_message}]},
                stream_mode="values"
        ):
            last_event = event

            current_event = event["messages"][-1]
            if current_event.type != "ai":
                continue

            text_chunk = current_event.content
            for word in text_chunk.split():
                formatted_event = {
                    "event": "message",
                    "answer": word
                }
                yield f"data: {json.dumps(formatted_event)}\n\n"

        artifacts = []
        if last_event:
            for message in last_event["messages"]:
                if message.type == "tool" and hasattr(message, "artifact"):
                    for artifact in message.artifact:
                        artifact_data = {
                            "id": artifact.id,
                            "metadata": artifact.metadata,
                            "page_content": artifact.page_content
                        }
                        artifacts.append(artifact_data)

        metadata = {
            "artifacts": artifacts
        }
        completed_event = {
            "event": "message_end",
            "metadata": metadata
        }
        yield f"data: {json.dumps(completed_event)}\n\n"

    return StreamingResponse(token_stream(), media_type="text/event-stream")


@tool(response_format="content_and_artifact")
def retrieve(query: str):
    """Retrieve information related to a query."""
    vector_store: FAISS = get_vector_store()
    retrieved_docs = vector_store.similarity_search(query, k=2)
    serialized = "\n\n".join(
        (f"Source: {doc.metadata}\n" f"Content: {doc.page_content}")
        for doc in retrieved_docs
    )
    return serialized, retrieved_docs
