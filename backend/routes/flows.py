# backend/routes/flows.py
from fastapi import APIRouter, HTTPException
from uuid import uuid4
from datetime import datetime
from typing import List
from pydantic import BaseModel

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
    return list(FLOW_REGISTRY.values())

@router.get("/{flow_id}", response_model=Flow)
def get_flow(flow_id: str):
    flow = FLOW_REGISTRY.get(flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow

@router.post("/", response_model=Flow)
def create_flow(flow: FlowCreate):
    flow_id = str(uuid4())
    flow_obj = Flow(id=flow_id, created_at=datetime.utcnow(), **flow.dict())
    FLOW_REGISTRY[flow_id] = flow_obj
    return flow_obj

@router.put("/{flow_id}", response_model=Flow)
def update_flow(flow_id: str, update: FlowUpdate):
    existing = FLOW_REGISTRY.get(flow_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Flow not found")
    updated_data = existing.dict()
    for key, value in update.dict(exclude_unset=True).items():
        updated_data[key] = value
    updated_flow = Flow(**updated_data)
    FLOW_REGISTRY[flow_id] = updated_flow
    return updated_flow

@router.delete("/{flow_id}")
def delete_flow(flow_id: str):
    if flow_id not in FLOW_REGISTRY:
        raise HTTPException(status_code=404, detail="Flow not found")
    del FLOW_REGISTRY[flow_id]
    return {"message": "Flow deleted"}