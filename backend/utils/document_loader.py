# utils/document_loader.py

from supabase import Client
from typing import List, Dict

def load_filtered_chunks(supabase: Client, user_email: str) -> List[Dict]:
    """
    Fetch document chunks from Supabase and filter to global and user-specific ones.
    """
    response = supabase.table("documents").select("content", "embedding", "doc_type", "user_email", "parent_id").execute()
    chunks = response.data or []

    filtered_chunks = [
        chunk for chunk in chunks
        if chunk.get("doc_type") == "global" or chunk.get("user_email") == user_email
    ]

    return filtered_chunks
