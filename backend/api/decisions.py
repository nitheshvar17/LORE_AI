import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.agents.memory_agent import MemoryAgent

router = APIRouter(prefix="/decisions", tags=["Decisions"])

class DecisionCreatePayload(BaseModel):
    title: str
    decision: str
    reason: str
    author: str = "Alex Rivera"
    status: str = "ACTIVE"
    source_type: str = "MANUAL"
    source_ref: str = "Manual Entry"
    related_files: List[str] = []
    risk_level: str = "MEDIUM"
    evidence_type: str = "SOURCE_VERIFIED"
    tags: str = ""
    domain: str = "General"

class DecisionOverridePayload(BaseModel):
    override_reason: str
    new_title: Optional[str] = None
    new_decision: str
    actor: str = "Alex Rivera"
    source_mr_ref: str = "MR #52"
    domain: Optional[str] = None

class DecisionTransitionPayload(BaseModel):
    new_status: str
    actor: str = "Alex Rivera"
    reason: str = "Manual status update"

@router.get("")
def list_decisions(
    q: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    evidence_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    decisions = MemoryAgent.search_decisions(
        db=db,
        query=q,
        domain=domain,
        status=status,
        evidence_type=evidence_type
    )
    result = []
    for d in decisions:
        files = []
        try:
            files = json.loads(d.related_files) if d.related_files else []
        except Exception:
            files = []

        result.append({
            "id": d.id,
            "title": d.title,
            "decision": d.decision,
            "reason": d.reason,
            "author": d.author,
            "status": d.status,
            "source_type": d.source_type,
            "source_ref": d.source_ref,
            "related_files": files,
            "risk_level": d.risk_level,
            "evidence_type": d.evidence_type,
            "tags": d.tags,
            "domain": d.domain,
            "supersedes_id": d.supersedes_id,
            "superseded_by_id": d.superseded_by_id,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "updated_at": d.updated_at.isoformat() if d.updated_at else None
        })
    return result

@router.get("/{decision_id}")
def get_decision(decision_id: int, db: Session = Depends(get_db)):
    d = MemoryAgent.get_decision_by_id(db, decision_id)
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")

    files = []
    try:
        files = json.loads(d.related_files) if d.related_files else []
    except Exception:
        files = []

    audit_logs = []
    for log in d.audit_logs:
        audit_logs.append({
            "id": log.id,
            "action": log.action,
            "actor": log.actor,
            "reason": log.reason,
            "old_status": log.old_status,
            "new_status": log.new_status,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None
        })

    return {
        "id": d.id,
        "title": d.title,
        "decision": d.decision,
        "reason": d.reason,
        "author": d.author,
        "status": d.status,
        "source_type": d.source_type,
        "source_ref": d.source_ref,
        "related_files": files,
        "risk_level": d.risk_level,
        "evidence_type": d.evidence_type,
        "tags": d.tags,
        "domain": d.domain,
        "supersedes_id": d.supersedes_id,
        "superseded_by_id": d.superseded_by_id,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "audit_logs": audit_logs
    }

@router.post("")
def create_decision(payload: DecisionCreatePayload, db: Session = Depends(get_db)):
    dec = MemoryAgent.create_decision(
        db=db,
        title=payload.title,
        decision_text=payload.decision,
        reason=payload.reason,
        author=payload.author,
        status=payload.status,
        source_type=payload.source_type,
        source_ref=payload.source_ref,
        related_files=payload.related_files,
        risk_level=payload.risk_level,
        evidence_type=payload.evidence_type,
        tags=payload.tags,
        domain=payload.domain
    )
    return {"success": True, "decision_id": dec.id, "title": dec.title}

@router.post("/{decision_id}/override")
def override_decision(decision_id: int, payload: DecisionOverridePayload, db: Session = Depends(get_db)):
    try:
        res = MemoryAgent.override_decision(
            db=db,
            old_decision_id=decision_id,
            new_title=payload.new_title or "",
            new_decision_text=payload.new_decision,
            override_reason=payload.override_reason,
            actor=payload.actor,
            source_mr_ref=payload.source_mr_ref,
            domain=payload.domain or "General"
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{decision_id}/transition")
def transition_decision(decision_id: int, payload: DecisionTransitionPayload, db: Session = Depends(get_db)):
    try:
        dec = MemoryAgent.transition_status(
            db=db,
            decision_id=decision_id,
            new_status=payload.new_status,
            actor=payload.actor,
            reason=payload.reason
        )
        return {"success": True, "id": dec.id, "status": dec.status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
