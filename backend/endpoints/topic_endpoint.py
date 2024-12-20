from http.client import HTTPException
from urllib.parse import quote

import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File

from endpoints import *
from fastapi.responses import FileResponse
from models import *
import mimetypes

topic_endpoint_router = APIRouter()

@topic_endpoint_router.get("/topic/tree", response_model=List[TopicModel])
async def get_topic_tree(db: Session = Depends(get_db)):
    root_topics = db.query(Topic).filter(Topic.parent_uuid == None).all()

    def get_children(topic_uuid):
        children = db.query(Topic).filter(Topic.parent_uuid == topic_uuid).all()
        return [
            {
                **TopicModel.from_orm(child).dict(),
                "children": get_children(child.uuid)
            }
            for child in children
        ]

    response = [
        {
            **TopicModel.from_orm(topic).dict(),
            "children": get_children(topic.uuid)
        }
        for topic in root_topics
    ]

    return response


@topic_endpoint_router.get("/topic/{uuid}/children", response_model=List[TopicModel])
async def get_topic_children(uuid: str, db: Session = Depends(get_db)):
    topics = db.query(Topic).filter(Topic.parent_uuid == uuid)
    return topics


@topic_endpoint_router.get("/topic/{uuid}")
async def get_topic(uuid: str, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.uuid == uuid).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    linked_documents = db.query(Document).filter(Document.linked_to == uuid).all()

    all_documents = linked_documents

    response = {
        **TopicModel.from_orm(topic).dict(),
        "documents": [DocumentModel.from_orm(doc).dict() for doc in all_documents],
    }

    return response


@topic_endpoint_router.post("/topic")
async def add_topic(topic: TopicModel, db: Session = Depends(get_db)):
    topic.parent_uuid = None
    topic.created_at = datetime.utcnow()
    topic.updated_at = datetime.utcnow()
    db_topic = Topic(**topic.dict(exclude={"children"}))
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)

    return TopicModel.from_orm(db_topic)


@topic_endpoint_router.post("/topic/{uuid}")
async def add_topic(uuid: str, topic: TopicModel, db: Session = Depends(get_db)):
    topic.parent_uuid = uuid
    topic.created_at = datetime.utcnow()
    topic.updated_at = datetime.utcnow()
    db_topic = Topic(**topic.dict(exclude={"children"}))
    db.add(db_topic)
    db.commit()

    return TopicModel.from_orm(db_topic)


@topic_endpoint_router.put("/topic/{uuid}")
async def update_topic(updated_topic: TopicModel, uuid: str, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.uuid == uuid).first()
    topic.title = updated_topic.title
    topic.description = updated_topic.description
    topic.parent_uuid = updated_topic.parent_uuid

    topic.updated_at = datetime.utcnow()

    db.commit()

    return {"status": "Success"}

@topic_endpoint_router.get("/documents")
async def get_all_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).all()
    return [DocumentModel.from_orm(doc) for doc in documents]

@topic_endpoint_router.get("/topic/{topic_uuid}/document")
async def get_documents_by_topic(topic_uuid: str, db: Session = Depends(get_db)):
    topic_exists = db.query(Topic).filter(Topic.uuid == topic_uuid).first()

    if not topic_exists:
        raise HTTPException(status_code=404)

    topic_uuid_str = str(topic_uuid)

    linked_documents = db.query(Document).filter(Document.linked_to == topic_uuid_str).all()

    all_documents = linked_documents

    return [DocumentModel.from_orm(doc) for doc in all_documents]



@topic_endpoint_router.post("/document/topic/{topic_uuid}/upload")
async def upload_document(topic_uuid: str, db: Session = Depends(get_db), file: UploadFile = File(...)):
    document = Document(linked_to=topic_uuid, name=file.filename, created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow())
    db.add(document)
    db.commit()
    db.refresh(document)

    file_path = os.path.join(KNOWLEDGEBASE_DIRECTORY, document.uuid)

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return {"status": "Success"}

@topic_endpoint_router.get("/document/{document_uuid}/download")
async def download_document(document_uuid: str, db: Session = Depends(get_db)):
    file_path = os.path.join(KNOWLEDGEBASE_DIRECTORY, document_uuid)

    document = db.query(Document).filter(Document.uuid == document_uuid).first()

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    encoded_filename = quote(document.name)

    mime_type, _ = mimetypes.guess_type(document.name)

    return FileResponse(file_path, media_type=mime_type,
                        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"})

@topic_endpoint_router.delete("/topic/{topic_uuid}")
async def delete_topic(topic_uuid: str, db: Session = Depends(get_db)):
    def get_subtopics(topic_uuid: str):
        subtopics = db.query(Topic).filter(Topic.parent_uuid == topic_uuid).all()
        subtopic_uuids = [subtopic.uuid for subtopic in subtopics]
        for subtopic in subtopics:
            subtopic_uuids.extend(get_subtopics(subtopic.uuid))
        return subtopic_uuids

    all_related_topic_uuids = get_subtopics(topic_uuid)
    all_related_topic_uuids.append(topic_uuid)

    for related_topic_uuid in all_related_topic_uuids:
        documents = db.query(Document).filter(Document.linked_to == related_topic_uuid).all()

        for document in documents:
            kb_path = os.path.join(KNOWLEDGEBASE_DIRECTORY, document.uuid)
            if os.path.exists(kb_path):
                os.remove(kb_path)

        db.query(Document).filter(Document.linked_to == related_topic_uuid).delete()

    db.query(Topic).filter(Topic.uuid.in_(all_related_topic_uuids)).delete()

    db.commit()
    return {"status": "Success"}


@topic_endpoint_router.delete("/topic/{topic_uuid}/document/{document_uuid}")
async def delete_document(topic_uuid: str, document_uuid: str, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.uuid == document_uuid).first()

    db.delete(document)
    db.commit()

    kb_path = os.path.join(KNOWLEDGEBASE_DIRECTORY, document.uuid)
    if os.path.exists(kb_path):
        os.remove(kb_path)

    return {"status": "Success"}

