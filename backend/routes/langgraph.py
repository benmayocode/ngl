# backend/routes/langgraph.py
from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect
from services.langgraph_runner_streaming import run_flow_with_updates
from uuid import UUID
from typing import Dict, Any
from services.flow_storage import get_flow_by_id

router = APIRouter()

# In-memory flow state store
active_flow_runs: Dict[UUID, Dict[str, Any]] = {}

@router.websocket("/execute")
async def websocket_run_custom_langgraph(websocket: WebSocket):
    await websocket.accept()
    try:
        # Receive initial flow execution request
        data = await websocket.receive_json()
        flow_data = data.get("flow")
        input_text = data.get("input")
        await run_flow_with_updates(flow_data, input_text, websocket)
    except WebSocketDisconnect:
        print("🔌 WebSocket disconnected.")
    except Exception as e:
        await websocket.send_json({ "type": "error", "message": str(e) })

@router.post("/run/{flow_id}")
async def start_flow(flow_id: str, request: Request):
    """
    Begin running a saved flow for a given chat session.
    """
    payload = await request.json()

    print ('Starting flow:', flow_id, 'with payload:', payload)
    session_id = UUID(payload.get("session_id"))
    input_text = payload.get("input") or ""

    flow_data = get_flow_by_id(flow_id)
    if not flow_data:
        raise HTTPException(status_code=404, detail="Flow not found")

    # Run flow with initial input
    result = run_flow_with_updates(flow_data, input_text)

    # Store the state (you can expand this later)
    active_flow_runs[session_id] = {
        "flow_id": flow_id,
        "last_result": result,
    }

    # Extract response from result
    first_reply = result.get("reply") or result.get("response") or "Flow started."

    return {
        "reply": first_reply,
        "prompt": result.get("prompt"),  # optional, for human-in-the-loop
        "done": result.get("done", False),
    }

@router.post("/step")
def run_flow_step(payload: dict):
    """
    Resume an active flow for a session with user input.
    """
    session_id = UUID(payload.get("session_id"))
    user_input = payload.get("input") or ""

    # Get the flow run context
    flow_run = active_flow_runs.get(session_id)
    if not flow_run:
        raise HTTPException(status_code=400, detail="No active flow for this session")

    from services.flow_storage import get_flow_by_id
    flow_data = get_flow_by_id(flow_run["flow_id"])
    if not flow_data:
        raise HTTPException(status_code=404, detail="Flow not found")

    # Resume flow with new input
    result = run_flow_with_updates(flow_data, user_input)

    # Update flow run state
    flow_run["last_result"] = result

    reply = result.get("reply") or result.get("response") or "Continuing flow..."
    return {
        "reply": reply,
        "prompt": result.get("prompt"),  # optional
        "done": result.get("done", False),
    }
