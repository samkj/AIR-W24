from http.client import HTTPException
from typing import Dict, Any
from langchain_core.tools import tool

import aiofiles
import requests
from fastapi import APIRouter, Depends, UploadFile, File
from langchain_community.document_loaders import PyPDFLoader
from langchain_mistralai import ChatMistralAI
from langchain_ollama import OllamaLLM, ChatOllama
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.checkpoint.memory import MemorySaver
from sqlalchemy import func

from endpoints import *
from models import KBChunk
from uuid import uuid4

from langchain_core.documents import Document
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI

bot_endpoint_router = APIRouter()


def retrieve_relevant_chunks(query: str) -> List[Dict[str, Any]]:
    try:
        chunks = [""]
        return chunks
    except requests.RequestException as e:
        print(f"Error retrieving relevant chunks: {e}")
        return []


@bot_endpoint_router.post("/bot/request")
def bot_request(query: str, model: str):
    llm = None
    if model == "gpt-4o-mini":
        llm = ChatOpenAI(model="gpt-4o-mini")
    elif model == "ollama-mistral":
        llm = ChatOllama(model="mistral")
    elif model == "mistral-large-latest":
        llm = llm = ChatMistralAI(
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


@bot_endpoint_router.post("/bot/upload")
async def upload_document(file: UploadFile = File(...)):
    vector_store: FAISS = get_vector_store()
    file_path = os.path.join(KNOWLEDGEBASE_DIRECTORY, file.filename)

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    loader = PyPDFLoader(file_path)

    document = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunked_documents = text_splitter.split_documents(document)

    for chunk in chunked_documents:
        print(chunk)

    uuids = [str(uuid4()) for _ in range(len(chunked_documents))]

    vector_store.add_documents(documents=chunked_documents, ids=uuids)
    vector_store.save_local(FAISS_INDEX_DIR)

    return {"status": "Success"}


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
