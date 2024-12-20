import uvicorn
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from endpoints import *
from endpoints.bot_endpoint import bot_endpoint_router
from endpoints.topic_endpoint import topic_endpoint_router

app = FastAPI(title="CORE AI Service", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Conversation-ID"]
)
base_path = "/api"
app.include_router(topic_endpoint_router, prefix=base_path)
app.include_router(bot_endpoint_router, prefix=base_path)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8083)