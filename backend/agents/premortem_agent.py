import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.db.models import IssueRecord, Decision, Incident
from backend.services.llm_service import llm_service

class PreMortemAgent:
    """Agent that analyzes GitLab issues against institutional memory to generate pre-mortems and questions."""

    @staticmethod
    async def analyze_issue(db: Session, issue: IssueRecord) -> Dict[str, Any]:
        """
        1. Searches relevant active decisions and historical incidents.
        2. Generates failure scenarios (risks, severity, prevention).
        3. Generates targeted developer questions.
        4. Updates issue in database with structured JSON.
        """
        # Find relevant decisions
        search_words = issue.title.lower().split() + [issue.domain.lower()]
        active_decisions = db.query(Decision).filter(Decision.status == "ACTIVE").all()
        relevant_memories = []
        for d in active_decisions:
            combined = f"{d.title} {d.decision} {d.domain} {d.tags}".lower()
            if any(w in combined for w in search_words if len(w) > 3):
                relevant_memories.append({
                    "id": d.id,
                    "title": d.title,
                    "decision": d.decision,
                    "reason": d.reason,
                    "source_ref": d.source_ref
                })

        # Run pre-mortem generation via LLM service
        pre_mortem_res = await llm_service.generate_pre_mortem(
            title=issue.title,
            description=issue.description,
            domain=issue.domain,
            relevant_memories=relevant_memories
        )

        # Update Issue Record
        issue.pre_mortem_json = json.dumps(pre_mortem_res)
        issue.questions_json = json.dumps(pre_mortem_res.get("questions", []))
        db.commit()
        db.refresh(issue)

        return {
            "issue_id": issue.gitlab_issue_id,
            "title": issue.title,
            "domain": issue.domain,
            "relevant_memories": relevant_memories,
            "pre_mortem": pre_mortem_res
        }
