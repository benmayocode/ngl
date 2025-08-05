# backend/routes/flows.py
from fastapi import APIRouter, HTTPException
from uuid import uuid4
from datetime import datetime
from typing import List
from pydantic import BaseModel
from supabase import create_client, Client
import os
from utils.supabase import get_supabase
supabase= get_supabase()

# In-memory store (replace with database or file-based later)
FLOW_REGISTRY = {}

router = APIRouter()

# === Models ===
class FlowBase(BaseModel):
    name: str
    description: str = ""
    nodes: list
    edges: list
    created_by: str

class FlowCreate(FlowBase):
    pass

class FlowUpdate(BaseModel):
    name: str = None
    description: str = None
    nodes: list = None
    edges: list = None

class Flow(FlowBase):
    id: str
    created_at: datetime

# === Routes ===

@router.get("/", response_model=List[Flow])
def list_flows():
    res = supabase.table("flows").select("*").order("created_at", desc=True).execute()
    return res.data or []

@router.get("/descriptions")
def list_flow_descriptions():
    try:
        res = supabase.table("flows").select("id", "name", "description").execute()
        return res.data or []
    except Exception as e:
        print("Supabase error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{flow_id}", response_model=Flow)
def get_flow(flow_id: str):
    res = supabase.table("flows").select("*").eq("id", flow_id).single().execute()
    if res.data is None:
        raise HTTPException(status_code=404, detail="Flow not found")
    return res.data

@router.post("/", response_model=Flow)
def create_flow(flow: FlowCreate):
    flow_id = str(uuid4())
    flow_obj = {
        "id": flow_id,
        "created_at": datetime.utcnow().isoformat(),
        **flow.dict()
    }
    res = supabase.table("flows").insert(flow_obj).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create flow")
    return res.data[0]

@router.put("/{flow_id}", response_model=Flow)
def update_flow(flow_id: str, update: FlowUpdate):
    res = supabase.table("flows").select("*").eq("id", flow_id).single().execute()
    if res.data is None:
        raise HTTPException(status_code=404, detail="Flow not found")

    update_data = update.dict(exclude_unset=True)
    updated = supabase.table("flows").update(update_data).eq("id", flow_id).execute()
    return updated.data[0]

@router.delete("/{flow_id}")
def delete_flow(flow_id: str):
    res = supabase.table("flows").delete().eq("id", flow_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Flow not found or already deleted")
    return {"message": "Flow deleted"}

