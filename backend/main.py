import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from typing import List
import numpy as np
from routes.documents import router as documents_router
from routes.chat import router as chat_router
from routes.sessions import router as sessions_router
from routes.langgraph import router as langgraph_router
from routes.flows import router as flows_router

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(langgraph_router, prefix="/api/langgraph")
app.include_router(flows_router, prefix="/api/flows")
