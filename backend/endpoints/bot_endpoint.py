from http.client import HTTPException
from typing import Dict, Any

import requests
from fastapi import APIRouter, Depends
from sqlalchemy import func

from endpoints import *
from models import KBChunk

bot_endpoint_router = APIRouter()


def retrieve_relevant_chunks(query: str) -> List[Dict[str, Any]]:
    try:
        chunks = [""]
        return chunks
    except requests.RequestException as e:
        print(f"Error retrieving relevant chunks: {e}")
        return []


@bot_endpoint_router.post("/bot/request", response_model=Dict)
def bot_request(query: str, model: str, db: Session = Depends(get_db)):
    query_embedding = []

    # relevant_chunks = retrieve_relevant_chunks(query)

    results = db.query(KBChunk).order_by(
        func.cosine_distance(func.json_extract(KBChunk.embedding, "$"), query_embedding)
    ).all()

    print(results)

    return {
        "answer": "",
        "retriever_resources": [],
    }
