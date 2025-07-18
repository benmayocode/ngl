# routes/chat.py
import os
from fastapi import APIRouter
from pydantic import BaseModel
from openai import AzureOpenAI
from typing import List
import numpy as np

router = APIRouter()

# Reuse OpenAI client
client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

embedding_deployment = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
chat_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")

# Shared in-memory vector store (for now)
vector_store = []  # TODO: replace with persistent storage later

# Data model for request
class ChatRequest(BaseModel):
    message: str

# Helpers
def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    a = np.array(vec1)
    b = np.array(vec2)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

@router.post("/chat")
async def chat(req: ChatRequest):
    user_question = req.message

    # Embed user input
    query_embedding = client.embeddings.create(
        model=embedding_deployment,
        input=[user_question]
    ).data[0].embedding

    # Score against all stored chunks
    scored_chunks = [
        (cosine_similarity(query_embedding, entry["embedding"]), entry["chunk"])
        for entry in vector_store
    ]
    scored_chunks.sort(reverse=True)

    # Prepare context
    top_chunks = [chunk for score, chunk in scored_chunks[:3]]
    context = "\n\n".join(top_chunks)

    prompt_messages = [
        {"role": "system", "content": "You are a helpful assistant. Use the following context to answer the user's question."},
        {"role": "system", "content": f"Context:\n{context}"},
        {"role": "user", "content": user_question}
    ]

    # Call GPT
    response = client.chat.completions.create(
        model=chat_deployment,
        messages=prompt_messages
    )

    return {"response": response.choices[0].message.content}
