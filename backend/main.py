import os, logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import numpy as np
from dotenv import load_dotenv

from config_secrets import load_secrets_into_environ
load_secrets_into_environ([
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "AZURE_OPENAI_KEY",
    "AZURE_OPENAI_API_VERSION",
    "AZURE_OPENAI_ENDPOINT",
], force=True)

from routes.documents import router as documents_router
from routes.chat import router as chat_router
from routes.sessions import router as sessions_router
from routes.langgraph import router as langgraph_router
from routes.flows import router as flows_router

load_dotenv() 
app = FastAPI()

ALLOW_ORIGIN_REGEX = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://ngl-kappa-ten.vercel.app"],
    allow_origin_regex=ALLOW_ORIGIN_REGEX,    # optional
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)



@app.get("/api/health")
def health():
    return {"ok": True}

app.include_router(documents_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(langgraph_router, prefix="/api/langgraph")
app.include_router(flows_router, prefix="/api/flows")

# if os.getenv("ENV", "development") == "development":
#     from routes.dev import router as dev_router
#     app.include_router(dev_router, prefix="/api/dev")
