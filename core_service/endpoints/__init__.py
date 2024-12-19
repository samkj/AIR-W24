from datetime import datetime

from dotenv import load_dotenv
import os
from sqlalchemy.orm import Session, sessionmaker
from pydantic import BaseModel
from typing import List, Optional
from models import engine

load_dotenv()

# database connection
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
    linked_to: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class DocumentChunkModel(BaseModel):
    uuid: str
    content: str
    embedding: str
    type: str
    document_uuid: Optional[str]
    topic_uuid: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True