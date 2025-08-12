# backend/routes/sessions.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from uuid import UUID
from supabase import create_client, Client
import os
from services.chat_service import build_chat_response
from utils.supabase import get_supabase
supabase = get_supabase()

router = APIRouter()

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
    if not user_email:
        raise HTTPException(status_code=400, detail="Missing user_email")
    print(f"Listing sessions for user: {user_email}")
    result = supabase.table("chat_sessions").select("*").eq("user_email", user_email).order("created_at", desc=True).execute()

    if result.data is None:
        raise HTTPException(status_code=500, detail="Supabase query failed")
    print("Supabase response:", result.data)

    return result.data

@router.post("/sessions/{session_id}/messages")
def add_message(session_id: UUID, message: ChatMessage):
    print(f"Adding message to session {session_id}: {message}")

    # Store user message
    result = supabase.table("chat_messages").insert({
        "session_id": str(session_id),
        "role": message.role,
        "content": message.content,
        "sources": message.sources if message.sources else None
    }).execute()

    if result.data is None:
        print("Supabase insert failed:", result.error)
        raise HTTPException(status_code=500, detail="Supabase query failed")

    inserted_user_message = result.data[0]

    # Only respond if this is a user message
    if message.role != "user":
        return inserted_user_message

    # Run GPT logic
    print("Generating assistant response...")
    try:
        response = build_chat_response(message.content, user_email="demo@example.com")  # TODO: pass real email
        print("Assistant response:", response)

        assistant_message = {
            "session_id": str(session_id),
            "role": "assistant",
            "content": response.get("reply") or response.get("response"),
            "sources": response.get("sources", []),
            "flow_suggestion": {"flowId": response.get("suggestedFlowId"), "title": response.get("suggestedFlowTitle"), "confidence": response.get("matchConfidence"), "sessionId": str(session_id)}
        }

        supabase.table("chat_messages").insert(assistant_message).execute()
        print(f"Assistant response generated and stored. Content: {assistant_message['content']}")
        print("Assistant message flow suggestion:", assistant_message.get("flow_suggestion"))
        
        return {
            "user": inserted_user_message,
            "assistant": assistant_message
        }

    except Exception as e:
        print("Error generating assistant response:", e)
        return {"user": inserted_user_message, "assistant": {"error": str(e)}}

@router.get("/sessions/{session_id}/messages")
def get_messages(session_id: UUID):
    result = supabase.table("chat_messages").select("*").eq("session_id", str(session_id)).order("created_at").execute()

    if result.data is None:
        raise HTTPException(status_code=500, detail="Supabase query failed")

    return result.data

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    supabase.table("chat_sessions").delete().eq("id", session_id).execute()
    supabase.table("chat_messages").delete().eq("session_id", session_id).execute()
    return {"success": True}
