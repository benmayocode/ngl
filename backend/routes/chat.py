# backend/routes/chat.py
from fastapi import APIRouter
from pydantic import BaseModel
from openai import AzureOpenAI
from supabase import create_client
import os
import numpy as np
from typing import List
import json

router = APIRouter()

# Setup
client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

embedding_deployment = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
chat_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

class ChatRequest(BaseModel):
    message: str
    user_email: str  # Required for personalized filtering

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    a = np.array(vec1)
    b = np.array(vec2)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

@router.post("/chat")
async def chat(req: ChatRequest):
# async def chat(req: Request):

    query_embedding = client.embeddings.create(
        model=embedding_deployment,
        input=[req.message]
    ).data[0].embedding

    # Pull document chunks: global + user-specific
    response = supabase.table("documents").select("content", "embedding", "doc_type", "user_email", "parent_id").execute()
    chunks = response.data

    # Filter: global + user's own docs
    filtered_chunks = [
        chunk for chunk in chunks
        if chunk["doc_type"] == "global" or chunk.get("user_email") == req.user_email
    ]

    scored = [
        {
            "score": cosine_similarity(query_embedding, json.loads(chunk["embedding"])),
            "content": chunk["content"],
            "parent_id": chunk.get("parent_id")
        }
        for chunk in filtered_chunks
        if chunk.get("embedding") is not None
    ]

    
    top_chunks = sorted(scored, key=lambda x: x["score"], reverse=True)[:3]
    
    context = "\n\n".join(chunk["content"] for chunk in top_chunks)

    messages = [
        {"role": "system", "content": "You are a helpful assistant. Use the following context to answer the user's question."},
        {"role": "system", "content": f"Context:\n{context}"},
        {"role": "user", "content": req.message}
    ]

    response = client.chat.completions.create(
        model=chat_deployment,
        messages=messages
    )

    return {
    "response": response.choices[0].message.content,
    "sources": [
        {
            "doc_id": chunk["parent_id"],
            "excerpt": chunk["content"][:300]
        }
        for chunk in top_chunks if chunk.get("parent_id")
    ]
}
