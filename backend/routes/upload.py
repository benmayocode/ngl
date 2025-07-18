# routes/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from openai import AzureOpenAI
from supabase import create_client, Client
import os
import fitz
import hashlib
import numpy as np
from typing import List

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
    raw_data = await file.read()
    print(f"Received file: {file.filename}, size: {len(raw_data)} bytes")

    if file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(raw_data)
    else:
        text = raw_data.decode("utf-8")

    chunks = chunk_text(text)

    success_count = 0

    for chunk in chunks:
        embedding = embed_text(chunk)
        try:
            res = supabase.table("documents").insert({
                "content": chunk,
                "embedding": embedding,
                "doc_type": "global",  # can be updated later for user uploads
                "user_email": None
            }).execute()
            success_count += 1
        except Exception as e:
            print(f"Failed to insert chunk: {e}")

    return JSONResponse({"status": "ok", "chunks_uploaded": success_count})
