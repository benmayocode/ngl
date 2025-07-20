# routes/upload.py
from fastapi import APIRouter, UploadFile, File, Query
from fastapi.responses import JSONResponse
from openai import AzureOpenAI
from supabase import create_client, Client
import os
import fitz
import hashlib
import numpy as np
from typing import List
from fastapi.responses import StreamingResponse, Response
import io
import mimetypes

router = APIRouter()

# Setup OpenAI client
client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

embedding_deployment = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")

# Setup Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def embed_text(text: str):
    result = client.embeddings.create(
        model=embedding_deployment,
        input=[text]
    )
    return result.data[0].embedding

def chunk_text(text: str, chunk_size=500):
    words = text.split()
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]

def extract_text_from_pdf(file_data: bytes) -> str:
    with fitz.open(stream=file_data, filetype="pdf") as doc:
        return "\n".join([page.get_text() for page in doc])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    import uuid
    from datetime import datetime

    file_id = str(uuid.uuid4())
    filename = file.filename
    ext = filename.split(".")[-1].lower()
    storage_path = f"global/{file_id}.{ext}"

    raw_data = await file.read()

    # 1. Upload file to Supabase Storage
    supabase.storage.from_("reference-documents").upload(storage_path, raw_data)

    # 2. Extract text from file
    if ext == "pdf":
        parsed_text = extract_text_from_pdf(raw_data)
    else:
        parsed_text = raw_data.decode("utf-8")

    # 3. Summarize
    summary = parsed_text[:500]  # placeholder: consider using GPT for real summary

    # 4. Insert into `documents` table
    doc_insert = {
        "id": file_id,
        "name": filename,
        "path": storage_path,
        "doc_type": "global",
        "user_email": None,
        "content": summary,
        "summary": summary,
        "parsed": parsed_text,
        "uploaded_at": datetime.utcnow().isoformat()
    }
    supabase.table("documents").insert(doc_insert).execute()

    # 5. Optional: Chunk + embed
    chunks = chunk_text(parsed_text)
    success_count = 0

    for chunk in chunks:
        try:
            embedding = embed_text(chunk)
            supabase.table("documents").insert({
                "id": str(uuid.uuid4()),
                "doc_type": "global",
                "user_email": None,
                "content": chunk,
                "is_chunk": True,
                "parent_id": file_id,
                "embedding": embedding,
                "uploaded_at": datetime.utcnow().isoformat()
            }).execute()
            success_count += 1
        except Exception as e:
            print(f"Embedding failed: {e}")

    return JSONResponse({
        "status": "ok",
        "file_id": file_id,
        "chunks_uploaded": success_count
    })

@router.get("/documents")
def list_documents(doc_type: str = Query("global")):
    result = supabase.table("documents") \
        .select("id, name, path, uploaded_at, summary") \
        .eq("doc_type", doc_type) \
        .eq("is_chunk", False) \
        .order("uploaded_at", desc=True) \
        .execute()

    return result.data

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    # Fetch the document by ID to get the storage path
    res = supabase.table("documents").select("path").eq("id", doc_id).single().execute()
    if res.data is None:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file from storage
    supabase.storage.from_("reference-documents").remove([res.data["path"]])

    # Delete metadata from table
    supabase.table("documents").delete().eq("id", doc_id).execute()

    return {"success": True}

@router.get("/documents/{doc_id}/download")
def download_document(doc_id: str):
    res = supabase.table("documents").select("path, name").eq("id", doc_id).single().execute()
    if res.data is None:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = res.data["path"]
    file_name = res.data["name"]

    # Download the file from storage
    file_res = supabase.storage.from_("reference-documents").download(file_path)

    if file_res is None:
        raise HTTPException(status_code=500, detail="Failed to download file")

    file_bytes = file_res  # Already bytes from supabase-py
    mime_type, _ = mimetypes.guess_type(file_name)
    media_type = mime_type or "application/octet-stream"

    return Response(content=file_bytes, media_type=media_type)

@router.get("/documents/{doc_id}")
def get_document_by_id(doc_id: str):
    result = supabase.table("documents") \
        .select("id, name, path, uploaded_at, summary") \
        .eq("id", doc_id) \
        .eq("is_chunk", False) \
        .single() \
        .execute()
    if result.data is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return result.data
