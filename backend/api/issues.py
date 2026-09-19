import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import IssueRecord
from backend.agents.premortem_agent import PreMortemAgent
from backend.agents.promise_agent import PromiseAgent

router = APIRouter(prefix="/issues", tags=["Issues"])

class IssueCreatePayload(BaseModel):
    gitlab_issue_id: int
    title: str
    description: str
    author: str = "Alex Rivera"
    domain: str = "Authentication"

class AnswerQuestionsPayload(BaseModel):
    developer: str = "Alex Rivera"
    answers: List[Dict[str, str]]

@router.get("")
def list_issues(db: Session = Depends(get_db)):
    issues = db.query(IssueRecord).order_by(IssueRecord.created_at.desc()).all()
    result = []
    for issue in issues:
        pm = {}
        try:
            pm = json.loads(issue.pre_mortem_json) if issue.pre_mortem_json else {}
        except Exception:
            pm = {}

        result.append({
            "id": issue.id,
            "gitlab_issue_id": issue.gitlab_issue_id,
            "title": issue.title,
            "description": issue.description,
            "author": issue.author,
            "status": issue.status,
            "domain": issue.domain,
            "risks_count": len(pm.get("risks", [])),
            "created_at": issue.created_at.isoformat() if issue.created_at else None
        })
    return result

@router.get("/{issue_id}")
def get_issue_detail(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(IssueRecord).filter(
        (IssueRecord.gitlab_issue_id == issue_id) | (IssueRecord.id == issue_id)
    ).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    pre_mortem = {}
    questions = []
    developer_answers = []

    try:
        pre_mortem = json.loads(issue.pre_mortem_json) if issue.pre_mortem_json else {}
    except Exception:
        pass

    try:
        questions = json.loads(issue.questions_json) if issue.questions_json else []
    except Exception:
        pass

    try:
        developer_answers = json.loads(issue.developer_answers_json) if issue.developer_answers_json else []
    except Exception:
        pass

    return {
        "id": issue.id,
        "gitlab_issue_id": issue.gitlab_issue_id,
        "title": issue.title,
        "description": issue.description,
        "author": issue.author,
        "status": issue.status,
        "domain": issue.domain,
        "pre_mortem": pre_mortem,
        "questions": questions,
        "developer_answers": developer_answers,
        "created_at": issue.created_at.isoformat() if issue.created_at else None
    }

@router.post("")
def create_issue(payload: IssueCreatePayload, db: Session = Depends(get_db)):
    existing = db.query(IssueRecord).filter(IssueRecord.gitlab_issue_id == payload.gitlab_issue_id).first()
    if existing:
        return {"id": existing.id, "gitlab_issue_id": existing.gitlab_issue_id, "title": existing.title}

    new_issue = IssueRecord(
        gitlab_issue_id=payload.gitlab_issue_id,
        title=payload.title,
        description=payload.description,
        author=payload.author,
        status="OPEN",
        domain=payload.domain
    )
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    return {"id": new_issue.id, "gitlab_issue_id": new_issue.gitlab_issue_id, "title": new_issue.title}

@router.post("/{issue_id}/analyze")
async def analyze_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(IssueRecord).filter(
        (IssueRecord.gitlab_issue_id == issue_id) | (IssueRecord.id == issue_id)
    ).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    analysis = await PreMortemAgent.analyze_issue(db, issue)
    return analysis

@router.post("/{issue_id}/answer")
def answer_issue_questions(issue_id: int, payload: AnswerQuestionsPayload, db: Session = Depends(get_db)):
    issue = db.query(IssueRecord).filter(
        (IssueRecord.gitlab_issue_id == issue_id) | (IssueRecord.id == issue_id)
    ).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    created_promises = PromiseAgent.capture_promises_from_issue_answers(
        db=db,
        issue_id=issue.gitlab_issue_id,
        developer=payload.developer,
        answers=payload.answers
    )

    return {
        "success": True,
        "promises_count": len(created_promises),
        "promises": [
            {
                "id": p.id,
                "developer": p.developer,
                "promise_text": p.promise_text,
                "status": p.status
            }
            for p in created_promises
        ]
    }
