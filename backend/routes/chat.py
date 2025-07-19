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
    response = supabase.table("documents").select("content", "embedding", "doc_type", "user_email").execute()
    chunks = response.data

    # Filter: global + user's own docs
    filtered_chunks = [
        chunk for chunk in chunks
        if chunk["doc_type"] == "global" or chunk.get("user_email") == req.user_email
    ]

    scored = [
        (
            cosine_similarity(
                query_embedding,
                json.loads(chunk["embedding"])  # <-- convert stringified list to actual list
            ),
            chunk["content"]
        )
        for chunk in filtered_chunks
    ]
    
    top_chunks = [chunk for score, chunk in sorted(scored, reverse=True)[:3]]
    
    print("📚 Top chunks used for context:")
    for i, chunk in enumerate(top_chunks):
        print(f"{i+1}. {chunk[:200]}...")  # Print first 200 chars

    context = "\n\n".join(top_chunks)

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
        "sources": top_chunks
}
