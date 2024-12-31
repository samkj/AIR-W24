from datetime import datetime

from dotenv import load_dotenv
import os

from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

from sqlalchemy.orm import Session, sessionmaker
from pydantic import BaseModel
from typing import List, Optional
from models import engine
import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
from langchain_mistralai import MistralAIEmbeddings

import getpass
import os

load_dotenv()

# database connection
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Set the OpenAI API key
# if not os.environ.get("OPENAI_API_KEY"):
#     os.environ["OPENAI_API_KEY"] = getpass.getpass("Enter API key for OpenAI: ")

# Initialize embeddings

if os.environ["OPENAI_API_KEY"]:
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
elif os.environ["MISTRAL_API_KEY"]:
    embeddings = MistralAIEmbeddings(model="mistral-embed")


# Directory to store the FAISS index
FAISS_INDEX_DIR = "./knowledgebase/faiss_index"

if os.environ["OLLAMA_HOST"]:
    OLLAMA_HOST = os.environ["OLLAMA_HOST"]
else:
    OLLAMA_HOST = "http://localhost:11434"


def get_vector_store():
    if os.path.exists(FAISS_INDEX_DIR):
        print("Loading existing vector store...")
        vector_store = FAISS.load_local(
            FAISS_INDEX_DIR, embeddings, allow_dangerous_deserialization=True
        )
    else:
        print("Creating a new vector store...")
        index = faiss.IndexFlatL2(len(embeddings.embed_query("hello world")))
        vector_store = FAISS(
            embedding_function=embeddings,
            index=index,
            docstore=InMemoryDocstore(),
            index_to_docstore_id={},
        )
        vector_store.save_local(FAISS_INDEX_DIR)
    return vector_store


KNOWLEDGEBASE_DIRECTORY = "./knowledgebase"

if not os.path.exists(KNOWLEDGEBASE_DIRECTORY):
    os.makedirs(KNOWLEDGEBASE_DIRECTORY)


class TopicModel(BaseModel):
    uuid: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    parent_uuid: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    children: Optional[List["TopicModel"]] = []

    class Config:
        orm_mode = True
        from_attributes = True


class DocumentModel(BaseModel):
    uuid: str
    name: str
    topicUuid: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
