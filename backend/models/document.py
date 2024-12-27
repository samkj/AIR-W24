import uuid
from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from models.base import Base


class Document(Base):
    __tablename__ = "document"
    uuid = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    topicUuid = Column(String, ForeignKey("topic.uuid"), nullable=True)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
