import json
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from backend.db.models import Decision, DecisionAuditLog

class MemoryAgent:
    """Institutional Memory Agent for querying, indexing, and managing decision lifecycles."""

    @staticmethod
    def search_decisions(
        db: Session,
        query: Optional[str] = None,
        domain: Optional[str] = None,
        status: Optional[str] = None,
        evidence_type: Optional[str] = None,
        limit: int = 50
    ) -> List[Decision]:
        """Searches decisions by keyword across title, decision, reason, tags, and related files."""
        q = db.query(Decision)

        if status:
            q = q.filter(Decision.status == status.upper())
        if domain and domain != "All":
            q = q.filter(Decision.domain == domain)
        if evidence_type and evidence_type != "All":
            q = q.filter(Decision.evidence_type == evidence_type)

        if query and query.strip():
            search_term = f"%{query.strip()}%"
            q = q.filter(
                or_(
                    Decision.title.ilike(search_term),
                    Decision.decision.ilike(search_term),
                    Decision.reason.ilike(search_term),
                    Decision.tags.ilike(search_term),
                    Decision.source_ref.ilike(search_term),
                    Decision.related_files.ilike(search_term),
                    Decision.author.ilike(search_term)
                )
            )

        return q.order_by(Decision.created_at.desc()).limit(limit).all()

    @staticmethod
    def get_decision_by_id(db: Session, decision_id: int) -> Optional[Decision]:
        return db.query(Decision).filter(Decision.id == decision_id).first()

    @staticmethod
    def create_decision(
        db: Session,
        title: str,
        decision_text: str,
        reason: str,
        author: str,
        status: str = "ACTIVE",
        source_type: str = "MR",
        source_ref: str = "Manual",
        related_files: List[str] = None,
        risk_level: str = "MEDIUM",
        evidence_type: str = "SOURCE_VERIFIED",
        tags: str = "",
        domain: str = "General",
        supersedes_id: Optional[int] = None
    ) -> Decision:
        """Creates a new institutional decision and writes an audit log entry."""
        new_dec = Decision(
            title=title,
            decision=decision_text,
            reason=reason,
            author=author,
            status=status,
            source_type=source_type,
            source_ref=source_ref,
            related_files=json.dumps(related_files or []),
            risk_level=risk_level,
            evidence_type=evidence_type,
            tags=tags,
            domain=domain,
            supersedes_id=supersedes_id,
            created_at=datetime.datetime.utcnow()
        )
        db.add(new_dec)
        db.flush()

        # Audit log
        audit = DecisionAuditLog(
            decision_id=new_dec.id,
            action="CREATED",
            actor=author,
            reason=f"Initial decision recorded from {source_ref}.",
            old_status=None,
            new_status=status,
            metadata_json=json.dumps({"source_ref": source_ref, "domain": domain})
        )
        db.add(audit)
        db.commit()
        db.refresh(new_dec)
        return new_dec

    @staticmethod
    def override_decision(
        db: Session,
        old_decision_id: int,
        new_title: str,
        new_decision_text: str,
        override_reason: str,
        actor: str,
        source_mr_ref: str = "MR #52",
        domain: str = "General"
    ) -> Dict[str, Any]:
        """
        Executes the official Override Flow:
        1. Marks old decision as SUPERSEDED.
        2. Creates new ACTIVE decision referencing old decision.
        3. Updates pointers and creates auditable transaction records.
        """
        old_decision = db.query(Decision).filter(Decision.id == old_decision_id).first()
        if not old_decision:
            raise ValueError(f"Decision #{old_decision_id} not found.")

        # 1. Create new decision
        new_decision = Decision(
            title=new_title or f"Updated: {old_decision.title}",
            decision=new_decision_text,
            reason=override_reason,
            author=actor,
            status="ACTIVE",
            source_type="MR",
            source_ref=source_mr_ref,
            related_files=old_decision.related_files,
            risk_level=old_decision.risk_level,
            evidence_type="SOURCE_VERIFIED",
            tags=old_decision.tags,
            domain=domain or old_decision.domain,
            supersedes_id=old_decision.id,
            created_at=datetime.datetime.utcnow()
        )
        db.add(new_decision)
        db.flush()

        # 2. Supersede old decision
        old_status_prev = old_decision.status
        old_decision.status = "SUPERSEDED"
        old_decision.superseded_by_id = new_decision.id
        old_decision.updated_at = datetime.datetime.utcnow()

        # 3. Create Audit Logs
        audit_old = DecisionAuditLog(
            decision_id=old_decision.id,
            action="SUPERSEDED",
            actor=actor,
            reason=f"Superseded by Decision #{new_decision.id} via {source_mr_ref}. Justification: {override_reason}",
            old_status=old_status_prev,
            new_status="SUPERSEDED",
            metadata_json=json.dumps({"superseded_by_id": new_decision.id, "source": source_mr_ref})
        )

        audit_new = DecisionAuditLog(
            decision_id=new_decision.id,
            action="OVERRIDE_CREATED",
            actor=actor,
            reason=f"Created to override Decision #{old_decision.id}. Justification: {override_reason}",
            old_status=None,
            new_status="ACTIVE",
            metadata_json=json.dumps({"supersedes_id": old_decision.id, "source": source_mr_ref})
        )

        db.add(audit_old)
        db.add(audit_new)
        db.commit()
        db.refresh(old_decision)
        db.refresh(new_decision)

        return {
            "success": True,
            "old_decision": {
                "id": old_decision.id,
                "title": old_decision.title,
                "status": old_decision.status,
                "superseded_by_id": new_decision.id
            },
            "new_decision": {
                "id": new_decision.id,
                "title": new_decision.title,
                "decision": new_decision.decision,
                "reason": new_decision.reason,
                "status": new_decision.status,
                "supersedes_id": old_decision.id,
                "source_ref": new_decision.source_ref
            }
        }

    @staticmethod
    def transition_status(
        db: Session,
        decision_id: int,
        new_status: str,
        actor: str,
        reason: str
    ) -> Decision:
        """Transitions a decision status (e.g. PROPOSED -> ACTIVE, ACTIVE -> ARCHIVED, etc.) with audit trail."""
        dec = db.query(Decision).filter(Decision.id == decision_id).first()
        if not dec:
            raise ValueError(f"Decision #{decision_id} not found.")

        old_status = dec.status
        dec.status = new_status.upper()
        dec.updated_at = datetime.datetime.utcnow()

        audit = DecisionAuditLog(
            decision_id=dec.id,
            action="STATUS_CHANGE",
            actor=actor,
            reason=reason,
            old_status=old_status,
            new_status=dec.status,
            metadata_json=json.dumps({"transition": f"{old_status} -> {dec.status}"})
        )
        db.add(audit)
        db.commit()
        db.refresh(dec)
        return dec
