from sqlalchemy import event, create_engine

from models.base import Base
from models import *
from .topic import Topic
from .document import Document

engine = create_engine(
    "sqlite:///./knowledgebase/backend.db",
    connect_args={"check_same_thread": False},
    echo=True
)

Base.metadata.create_all(bind=engine)

print(f"Database tables created: {list(Base.metadata.tables.keys())}")
print("Database generation completed successfully.")
