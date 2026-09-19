from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.agents.promise_agent import PromiseAgent

router = APIRouter(prefix="/promises", tags=["Promises"])

class PromiseUpdatePayload(BaseModel):
    status: str
    evidence: Optional[str] = None

@router.get("")
def list_promises(
    status: Optional[str] = Query(None),
    developer: Optional[str] = Query(None),
    issue_id: Optional[int] = Query(None),
    mr_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    promises = PromiseAgent.list_promises(
        db=db,
        status=status,
        developer=developer,
        issue_id=issue_id,
        mr_id=mr_id
    )
    return [
        {
            "id": p.id,
            "developer": p.developer,
            "promise_text": p.promise_text,
            "status": p.status,
            "issue_id": p.issue_id,
            "mr_id": p.mr_id,
            "source_context": p.source_context,
            "evidence_found": p.evidence_found,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None
        }
        for p in promises
    ]

@router.patch("/{promise_id}")
def update_promise(promise_id: int, payload: PromiseUpdatePayload, db: Session = Depends(get_db)):
    try:
        p = PromiseAgent.update_promise_status(
            db=db,
            promise_id=promise_id,
            status=payload.status,
            evidence=payload.evidence
        )
        return {"success": True, "id": p.id, "status": p.status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
