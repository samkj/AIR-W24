from fastapi import APIRouter
from langchain_mistralai import ChatMistralAI
from langchain_ollama import ChatOllama

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

    input_message = (
        query
    )

    for event in agent_executor.stream(
            {"messages": [{"role": "user", "content": input_message}]},
            stream_mode="values"
    ):
        event["messages"][-1].pretty_print()


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
