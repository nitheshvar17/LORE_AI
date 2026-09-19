from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.agents.qa_agent import QAAgent

router = APIRouter(prefix="/ask", tags=["Ask LORE"])

class AskQueryPayload(BaseModel):
    query: str

@router.post("")
def ask_lore(payload: AskQueryPayload, db: Session = Depends(get_db)):
    result = QAAgent.ask(db=db, query=payload.query)
    return result
