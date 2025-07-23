from fastapi import APIRouter
from services.langgraph_runner import run_flow

router = APIRouter()

@router.post("/execute")
async def run_custom_langgraph(data: dict):
    flow_data = data.get("flow")
    input_text = data.get("input")

    try:
        output = run_flow(flow_data, input_text)
        return {"result": output}
    except Exception as e:
        return {"error": str(e)}
