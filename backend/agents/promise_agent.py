import json
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.db.models import Promise, IssueRecord
from backend.services.llm_service import llm_service

class PromiseAgent:
    """Agent responsible for capturing, tracking, and verifying developer promises/commitments."""

    @staticmethod
    def capture_promises_from_issue_answers(
        db: Session,
        issue_id: int,
        developer: str,
        answers: List[Dict[str, str]]
    ) -> List[Promise]:
        """
        Parses developer answers, extracts explicit promises, and persists them as PENDING.
        """
        extracted = llm_service.extract_promises_from_answers(answers)
        created_promises = []

        for item in extracted:
            promise_text = item.get("extracted_promise")
            if not promise_text:
                continue

            # Check if identical promise already exists for this issue
            existing = db.query(Promise).filter(
                Promise.issue_id == issue_id,
                Promise.promise_text == promise_text
            ).first()

            if not existing:
                p = Promise(
                    developer=developer,
                    promise_text=promise_text,
                    status="PENDING",
                    issue_id=issue_id,
                    source_context=f"Issue #{issue_id} Pre-Mortem Q&A",
                    evidence_found=None,
                    created_at=datetime.datetime.utcnow()
                )
                db.add(p)
                created_promises.append(p)

        # Also save answers in issue record
        issue = db.query(IssueRecord).filter(IssueRecord.gitlab_issue_id == issue_id).first()
        if issue:
            issue.developer_answers_json = json.dumps(extracted)

        db.commit()
        for p in created_promises:
            db.refresh(p)

        return created_promises

    @staticmethod
    def list_promises(
        db: Session,
        status: Optional[str] = None,
        developer: Optional[str] = None,
        issue_id: Optional[int] = None,
        mr_id: Optional[int] = None
    ) -> List[Promise]:
        q = db.query(Promise)
        if status and status != "ALL":
            q = q.filter(Promise.status == status.upper())
        if developer:
            q = q.filter(Promise.developer.ilike(f"%{developer}%"))
        if issue_id:
            q = q.filter(Promise.issue_id == issue_id)
        if mr_id:
            q = q.filter(Promise.mr_id == mr_id)
        return q.order_by(Promise.created_at.desc()).all()

    @staticmethod
    def update_promise_status(
        db: Session,
        promise_id: int,
        status: str,
        evidence: Optional[str] = None
    ) -> Promise:
        p = db.query(Promise).filter(Promise.id == promise_id).first()
        if not p:
            raise ValueError(f"Promise #{promise_id} not found.")
        p.status = status.upper()
        if evidence:
            p.evidence_found = evidence
        p.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(p)
        return p
