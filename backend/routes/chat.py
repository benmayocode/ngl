from fastapi import APIRouter
from pydantic import BaseModel
from services.chat_service import build_chat_response

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    user_email: str

@router.post("/chat")
async def chat(req: ChatRequest):
    return build_chat_response(req.message, req.user_email)
