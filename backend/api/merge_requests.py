import json
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import MergeRequestRecord, Discussion, Decision
from backend.agents.review_agent import ReviewAgent
from backend.agents.memory_agent import MemoryAgent

router = APIRouter(prefix="/merge-requests", tags=["Merge Requests"])

class MRCreatePayload(BaseModel):
    gitlab_mr_id: int
    title: str
    description: str
    author: str = "Alex Rivera"
    source_branch: str = "feature/branch"
    target_branch: str = "main"
    changed_files: List[str] = []
    diff_content: str = ""

class MRConflictResolutionPayload(BaseModel):
    action: str  # OVERRIDE, REVERT, DISCUSS
    actor: str = "Alex Rivera"
    override_reason: Optional[str] = None
    new_title: Optional[str] = None
    new_decision_text: Optional[str] = None
    target_decision_id: Optional[int] = None
    discuss_topic: Optional[str] = None
    discuss_reason: Optional[str] = None

@router.get("")
def list_merge_requests(db: Session = Depends(get_db)):
    mrs = db.query(MergeRequestRecord).order_by(MergeRequestRecord.created_at.desc()).all()
    result = []
    for mr in mrs:
        rev = {}
        try:
            rev = json.loads(mr.review_results_json) if mr.review_results_json else {}
        except Exception:
            rev = {}

        result.append({
            "id": mr.id,
            "gitlab_mr_id": mr.gitlab_mr_id,
            "title": mr.title,
            "description": mr.description,
            "author": mr.author,
            "source_branch": mr.source_branch,
            "target_branch": mr.target_branch,
            "status": mr.status,
            "overall_risk": mr.overall_risk,
            "conflict_status": mr.conflict_status,
            "has_review": bool(rev),
            "created_at": mr.created_at.isoformat() if mr.created_at else None
        })
    return result

@router.get("/{mr_id}")
def get_merge_request_detail(mr_id: int, db: Session = Depends(get_db)):
    mr = db.query(MergeRequestRecord).filter(
        (MergeRequestRecord.gitlab_mr_id == mr_id) | (MergeRequestRecord.id == mr_id)
    ).first()

    if not mr:
        raise HTTPException(status_code=404, detail="Merge Request not found")

    files = []
    try:
        files = json.loads(mr.changed_files) if mr.changed_files else []
    except Exception:
        files = []

    review_results = {}
    try:
        review_results = json.loads(mr.review_results_json) if mr.review_results_json else {}
    except Exception:
        review_results = {}

    conflict_resolution = {}
    try:
        conflict_resolution = json.loads(mr.conflict_resolution_json) if mr.conflict_resolution_json else {}
    except Exception:
        conflict_resolution = {}

    return {
        "id": mr.id,
        "gitlab_mr_id": mr.gitlab_mr_id,
        "title": mr.title,
        "description": mr.description,
        "author": mr.author,
        "source_branch": mr.source_branch,
        "target_branch": mr.target_branch,
        "changed_files": files,
        "diff_content": mr.diff_content,
        "status": mr.status,
        "overall_risk": mr.overall_risk,
        "conflict_status": mr.conflict_status,
        "review_results": review_results,
        "conflict_resolution": conflict_resolution,
        "created_at": mr.created_at.isoformat() if mr.created_at else None,
        "updated_at": mr.updated_at.isoformat() if mr.updated_at else None
    }

@router.post("")
def create_merge_request(payload: MRCreatePayload, db: Session = Depends(get_db)):
    existing = db.query(MergeRequestRecord).filter(MergeRequestRecord.gitlab_mr_id == payload.gitlab_mr_id).first()
    if existing:
        return {"id": existing.id, "gitlab_mr_id": existing.gitlab_mr_id, "title": existing.title}

    new_mr = MergeRequestRecord(
        gitlab_mr_id=payload.gitlab_mr_id,
        title=payload.title,
        description=payload.description,
        author=payload.author,
        source_branch=payload.source_branch,
        target_branch=payload.target_branch,
        changed_files=json.dumps(payload.changed_files),
        diff_content=payload.diff_content,
        status="OPEN"
    )
    db.add(new_mr)
    db.commit()
    db.refresh(new_mr)
    return {"id": new_mr.id, "gitlab_mr_id": new_mr.gitlab_mr_id, "title": new_mr.title}

@router.post("/{mr_id}/review")
def review_merge_request(mr_id: int, db: Session = Depends(get_db)):
    mr = db.query(MergeRequestRecord).filter(
        (MergeRequestRecord.gitlab_mr_id == mr_id) | (MergeRequestRecord.id == mr_id)
    ).first()

    if not mr:
        raise HTTPException(status_code=404, detail="Merge Request not found")

    review_res = ReviewAgent.run_five_layer_review(db, mr)
    return {
        "success": True,
        "mr_id": mr.gitlab_mr_id,
        "overall_risk": mr.overall_risk,
        "conflict_status": mr.conflict_status,
        "review_results": review_res
    }

@router.post("/{mr_id}/resolve-conflict")
def resolve_mr_conflict(mr_id: int, payload: MRConflictResolutionPayload, db: Session = Depends(get_db)):
    mr = db.query(MergeRequestRecord).filter(
        (MergeRequestRecord.gitlab_mr_id == mr_id) | (MergeRequestRecord.id == mr_id)
    ).first()

    if not mr:
        raise HTTPException(status_code=404, detail="Merge Request not found")

    action = payload.action.upper()
    resolution_data = {
        "action": action,
        "resolved_by": payload.actor,
        "resolved_at": datetime.datetime.utcnow().isoformat(),
        "notes": ""
    }

    if action == "OVERRIDE":
        target_id = payload.target_decision_id or 17
        new_dec_text = payload.new_decision_text or "Store authentication token in client localStorage for mobile web client compatibility."
        new_title = payload.new_title or "Client Authentication Token Storage (Updated)"
        reason = payload.override_reason or "Mobile web client architecture requirement."

        override_res = MemoryAgent.override_decision(
            db=db,
            old_decision_id=target_id,
            new_title=new_title,
            new_decision_text=new_dec_text,
            override_reason=reason,
            actor=payload.actor,
            source_mr_ref=f"MR #{mr.gitlab_mr_id}",
            domain="Authentication"
        )
        mr.conflict_status = "OVERRIDDEN"
        resolution_data["notes"] = f"Overrode Decision #{target_id}. Created new active decision #{override_res['new_decision']['id']}."
        resolution_data["override_details"] = override_res

    elif action == "REVERT":
        mr.conflict_status = "REVERTED"
        resolution_data["notes"] = "Developer opted to revert conflicting code changes. Active institutional decision remains enforced."

    elif action == "DISCUSS":
        mr.conflict_status = "DISCUSSING"
        topic = payload.discuss_topic or f"Conflict Review: MR #{mr.gitlab_mr_id} vs Decision #{payload.target_decision_id or 17}"
        reason = payload.discuss_reason or "Developer requested human architectural escalation."

        disc = Discussion(
            decision_id=payload.target_decision_id or 17,
            mr_id=mr.gitlab_mr_id,
            topic=topic,
            requested_by=payload.actor,
            reason=reason,
            status="OPEN",
            comments_json=json.dumps([
                {"author": payload.actor, "message": f"Escalated for review: {reason}", "timestamp": datetime.datetime.utcnow().isoformat()}
            ])
        )
        db.add(disc)
        db.flush()
        resolution_data["discussion_id"] = disc.id
        resolution_data["notes"] = f"Created architectural discussion #{disc.id} for team decision makers."

    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be OVERRIDE, REVERT, or DISCUSS.")

    mr.conflict_resolution_json = json.dumps(resolution_data)
    mr.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(mr)

    return {
        "success": True,
        "mr_id": mr.gitlab_mr_id,
        "conflict_status": mr.conflict_status,
        "resolution": resolution_data
    }
