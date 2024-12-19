import uuid
from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import relationship

from models.base import Base

class Topic(Base):
    __tablename__ = "topic"
    uuid = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, default="")
    description = Column(Text, default="")
    parent_uuid = Column(String, ForeignKey("topic.uuid"), nullable=True)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    order_index = Column(Integer, nullable=True)
