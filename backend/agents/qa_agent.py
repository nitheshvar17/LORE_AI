from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.db.models import Decision, Incident, Promise
from backend.services.llm_service import llm_service

class QAAgent:
    """Agent that powers the 'Ask LORE' conversational institutional memory search."""

    @staticmethod
    def ask(db: Session, query: str) -> Dict[str, Any]:
        active_decisions = [
            {
                "id": d.id,
                "title": d.title,
                "decision": d.decision,
                "reason": d.reason,
                "source_ref": d.source_ref,
                "domain": d.domain,
                "tags": d.tags,
                "evidence_type": d.evidence_type
            }
            for d in db.query(Decision).filter(Decision.status == "ACTIVE").all()
        ]

        superseded_decisions = [
            {
                "id": sd.id,
                "title": sd.title,
                "decision": sd.decision,
                "superseded_by_id": sd.superseded_by_id,
                "source_ref": sd.source_ref
            }
            for sd in db.query(Decision).filter(Decision.status == "SUPERSEDED").all()
        ]

        incidents = [
            {
                "id": inc.id,
                "title": inc.title,
                "description": inc.description,
                "lessons_learned": inc.lessons_learned,
                "date": inc.date
            }
            for inc in db.query(Incident).all()
        ]

        promises = [
            {
                "id": p.id,
                "developer": p.developer,
                "promise_text": p.promise_text,
                "status": p.status
            }
            for p in db.query(Promise).all()
        ]

        return llm_service.answer_memory_query(
            query=query,
            active_decisions=active_decisions,
            superseded_decisions=superseded_decisions,
            incidents=incidents,
            promises=promises
        )
