import json
import asyncio
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

from bs4 import BeautifulSoup


bot_endpoint_router = APIRouter()


@bot_endpoint_router.post("/bot/request")
async def bot_request(query: str, model: str):
    llm = None
    if model == "gpt-4o-mini":
        llm = ChatOpenAI(model="gpt-4o-mini", max_tokens=128)
    elif model == "ollama-mistral":
        llm = ChatOllama(model="ksamirk/mistral-ins-lora:latest", base_url=OLLAMA_HOST)
    elif model == "mistral-large-latest":
        llm = ChatMistralAI(
            model="mistral-large-latest",
            temperature=0,
            max_retries=2,
            max_tokens=128
        )

    if model == "ollama-mistral":
        async def ollama_stream() -> AsyncGenerator[str, None]:
            async for chunk in llm.astream(query):
                formatted_event = {
                    "event": "message",
                    "answer": chunk.content
                }
                yield f"data: {json.dumps(formatted_event)}\n\n"

            completed_event = {
                "event": "message_end",
                "metadata": {}
            }
            yield f"data: {json.dumps(completed_event)}\n\n"

        return StreamingResponse(ollama_stream(), media_type="text/event-stream")


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
            if isinstance(text_chunk, list):
                # Extract text from dictionaries
                text_chunk = ' '.join(
                    item['text'] for item in text_chunk if isinstance(item, dict) and 'text' in item
                )

            for word in text_chunk.split():
                formatted_event = {
                    "event": "message",
                    "answer": f"{word} "
                }
                yield f"data: {json.dumps(formatted_event)}\n\n"
                await asyncio.sleep(0)

        artifacts = []
        if last_event:
            for message in last_event["messages"]:
                if message.type == "tool" and hasattr(message, "artifact"):
                    for artifact in message.artifact:
                        tree = BeautifulSoup(artifact.page_content)
                        plain_text = tree.get_text()
                        artifact_data = {
                            "id": artifact.id,
                            "metadata": artifact.metadata,
                            "page_content": plain_text
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
        await asyncio.sleep(0)

    return StreamingResponse(token_stream(), media_type="text/event-stream")


@tool(response_format="content_and_artifact")
def retrieve(query: str):
    """Retrieve information related to a query."""
    vector_store: FAISS = get_vector_store()
    retrieved_docs = vector_store.similarity_search(query, k=10)
    serialized = "\n\n".join(
        (f"Source: {doc.metadata}\n" f"Content: {doc.page_content}")
        for doc in retrieved_docs
    )
    return serialized, retrieved_docs
