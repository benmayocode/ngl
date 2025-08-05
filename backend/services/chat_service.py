# backend/services/chat_service.py
from openai import AzureOpenAI
import os, json
import numpy as np
from utils.embedding import cosine_similarity
from supabase import create_client
import requests
from difflib import SequenceMatcher
from utils.supabase import get_supabase

FLOW_DESCRIPTION_ENDPOINT = "http://localhost:8000/api/flows/descriptions"

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)
embedding_deployment = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
chat_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
supabase = get_supabase()

def get_top_chunks(user_email, query_embedding, top_k=3):
    response = supabase.table("documents").select("*").execute()
    chunks = response.data
    filtered = [
        c for c in chunks
        if c["doc_type"] == "global" or c.get("user_email") == user_email
    ]
    scored = [
        {
            "score": cosine_similarity(query_embedding, json.loads(c["embedding"])),
            "content": c["content"],
            "parent_id": c.get("parent_id")
        }
        for c in filtered if c.get("embedding")
    ]
    return sorted(scored, key=lambda x: x["score"], reverse=True)[:top_k]

def suggest_matching_flow(message: str, flows: list[dict], threshold=0.6):
    best = None
    best_score = 0

    for flow in flows:
        desc = flow.get("description") or ""
        score = SequenceMatcher(None, message.lower(), desc.lower()).ratio()
        if score > best_score:
            best = flow
            best_score = score

    if best and best_score >= threshold:
        return best
    return None


def build_chat_response(query: str, user_email: str):
    # 1. Try to find a matching flow
    try:
        res = requests.get(FLOW_DESCRIPTION_ENDPOINT)
        flows = res.json()
        match = suggest_matching_flow(query, flows)

        if match:
            return {
                "reply": f"💡 I found a saved flow that might help: **{match['name']}**\nWould you like to run it?",
                "suggestedFlowId": match["id"],
                "suggestedFlowName": match["name"],
                "matchConfidence": round(SequenceMatcher(None, query.lower(), match['description'].lower()).ratio(), 2)
            }
    except Exception as e:
        print("Flow suggestion failed:", e)


    query_embedding = client.embeddings.create(
        model=embedding_deployment,
        input=[query]
    ).data[0].embedding

    top_chunks = get_top_chunks(user_email, query_embedding)
    context = "\n\n".join(c["content"] for c in top_chunks)

    messages = [
        {"role": "system", "content": "You are a helpful assistant. Use the following context to answer the user's question."},
        {"role": "system", "content": f"Context:\n{context}"},
        {"role": "user", "content": query}
    ]

    response = client.chat.completions.create(
        model=chat_deployment,
        messages=messages
    )

    return {
        "response": response.choices[0].message.content,
        "sources": [
            {
                "doc_id": c["parent_id"],
                "excerpt": c["content"][:300]
            } for c in top_chunks if c.get("parent_id")
        ]
    }
