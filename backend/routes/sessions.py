# backend/routes/sessions.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from uuid import UUID
from supabase import create_client, Client
import os

router = APIRouter()

# Init Supabase
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Request/response models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    sources: List[dict] = []  # Optional field

class SessionCreate(BaseModel):
    user_email: str
    title: str

@router.post("/sessions")
def create_session(session: SessionCreate):
    result = supabase.table("chat_sessions").insert({
        "user_email": session.user_email,
        "title": session.title
    }).execute()

    if result.data is None:
        raise HTTPException(status_code=500, detail="Supabase query failed")

    return result.data[0]

@router.get("/sessions")
def list_sessions(user_email: str):
    result = supabase.table("chat_sessions").select("*").eq("user_email", user_email).order("created_at", desc=True).execute()

    if result.data is None:
        raise HTTPException(status_code=500, detail="Supabase query failed")

    return result.data

@router.post("/sessions/{session_id}/messages")
def add_message(session_id: UUID, message: ChatMessage):
    print(f"Adding message to session {session_id}: {message}")

    result = supabase.table("chat_messages").insert({
        "session_id": str(session_id),
        "role": message.role,
        "content": message.content,
        "sources": message.sources if message.sources else None  # store as JSON
    }).execute()

    if result.data is None:
        raise HTTPException(status_code=500, detail="Supabase query failed")

    return result.data[0]

@router.get("/sessions/{session_id}/messages")
def get_messages(session_id: UUID):
    result = supabase.table("chat_messages").select("*").eq("session_id", str(session_id)).order("created_at").execute()

    if result.data is None:
        raise HTTPException(status_code=500, detail="Supabase query failed")

    return result.data
