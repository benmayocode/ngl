# backend/services/chat_service.py
from openai import AzureOpenAI
import os, json
import numpy as np
from utils.embedding import cosine_similarity
from difflib import SequenceMatcher
from utils.supabase import get_supabase
from fastapi import HTTPException


client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

# IMPORTANT: these must be **Azure deployment names**, not base model names
EMBED_DEPLOYMENT = "embedding-ada"
CHAT_DEPLOYMENT  = "gpt-35-turbo"

supabase = get_supabase()

def _list_flows_for_match():
    # Query Supabase instead of localhost HTTP
    res = supabase.table("flows").select("id,name,description").execute()
    return res.data or []

def get_top_chunks(user_email, query_embedding, top_k=3):
    response = supabase.table("documents").select("*").execute()
    chunks = response.data or []
    filtered = [
        c for c in chunks if c.get("doc_type") == "global" or c.get("user_email") == user_email
    ]
    scored = []
    for c in filtered:
        emb = c.get("embedding")
        if not emb:
            continue
        try:
            scored.append({
                "score": cosine_similarity(query_embedding, json.loads(emb)),
                "content": c["content"],
                "parent_id": c.get("parent_id"),
            })
        except Exception:
            continue
    return sorted(scored, key=lambda x: x["score"], reverse=True)[:top_k]

def suggest_matching_flow(message: str, flows: list[dict], threshold=0.6):
    best, best_score = None, 0
    for flow in flows:
        desc = flow.get("description") or ""
        score = SequenceMatcher(None, message.lower(), desc.lower()).ratio()
        if score > best_score:
            best, best_score = flow, score
    return best if best and best_score >= threshold else None

def build_chat_response(query: str, user_email: str):
    # 1) Flow suggestion (from Supabase, not HTTP localhost)
    try:
        flows = _list_flows_for_match()
        match = suggest_matching_flow(query, flows)
        if match:
            return {
                "reply": f"💡 SERVER: I found a saved flow that might help: **{match['name']}**\nWould you like to run it?",
                "suggestedFlowId": match["id"],
                "suggestedFlowName": match["name"],
                "matchConfidence": round(SequenceMatcher(None, query.lower(), (match.get('description') or '').lower()).ratio(), 2),
            }
    except Exception as e:
        # Don’t fail the whole request just because suggestion failed
        print("Flow suggestion failed:", e)

    # 2) Embedding (ensure you're using the **deployment name**)
    try:
        emb_resp = client.embeddings.create(
            model=EMBED_DEPLOYMENT,
            input=[query],
        )
        query_embedding = emb_resp.data[0].embedding
    except Exception as e:
        # Surface a proper 502 upstream (and let the handler convert to 502)
        raise HTTPException(status_code=502, detail=f"Embedding failed: {e}")

    # 3) RAG + Chat
    top_chunks = get_top_chunks(user_email, query_embedding)
    context = "\n\n".join(c["content"] for c in top_chunks)

    messages = [
        {"role": "system", "content": "You are a helpful assistant. Use the following context to answer the user's question."},
        {"role": "system", "content": f"Context:\n{context}"},
        {"role": "user", "content": query},
    ]

    try:
        response = client.chat.completions.create(
            model=CHAT_DEPLOYMENT,
            messages=messages,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Chat failed: {e}")

    return {
        "response": response.choices[0].message.content,
        "sources": [
            {"doc_id": c["parent_id"], "excerpt": c["content"][:300]}
            for c in top_chunks if c.get("parent_id")
        ],
    }
