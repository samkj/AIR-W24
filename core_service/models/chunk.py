import uuid
from sqlalchemy import Column, String, TIMESTAMP, ForeignKey
from models.base import Base

class KBChunk(Base):
    __tablename__ = "knowledge_chunk"
    uuid = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    content = Column(String, nullable=False)
    embedding = Column(String, nullable=True)
    type = Column(String, nullable=True)
    document_uuid = Column(String, ForeignKey("document.uuid"), nullable=True)
    topic_uuid = Column(String, ForeignKey("topic.uuid"), nullable=True)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
