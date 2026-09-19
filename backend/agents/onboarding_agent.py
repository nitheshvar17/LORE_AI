from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.db.models import Decision, Incident, TeamPattern
from backend.services.llm_service import llm_service

class OnboardingAgent:
    """Agent that compiles the comprehensive developer onboarding briefing with source citations."""

    @staticmethod
    def generate_developer_briefing(db: Session, project_name: str = "LORE GitLab Core") -> Dict[str, Any]:
        active_decisions = [
            {
                "id": d.id,
                "title": d.title,
                "decision": d.decision,
                "reason": d.reason,
                "source_ref": d.source_ref,
                "evidence_type": d.evidence_type,
                "status": d.status
            }
            for d in db.query(Decision).filter(Decision.status == "ACTIVE").all()
        ]

        superseded_decisions = [
            {
                "id": sd.id,
                "title": sd.title,
                "decision": sd.decision,
                "status": sd.status,
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
                "root_cause": inc.root_cause,
                "resolution": inc.resolution,
                "lessons_learned": inc.lessons_learned,
                "date": inc.date
            }
            for inc in db.query(Incident).all()
        ]

        team_patterns = [
            {
                "name": tp.name,
                "expected_practice": tp.expected_practice,
                "forbidden_practice": tp.forbidden_practice,
                "severity": tp.severity
            }
            for tp in db.query(TeamPattern).filter(TeamPattern.is_active == True).all()
        ]

        return llm_service.generate_onboarding_briefing(
            project_name=project_name,
            active_decisions=active_decisions,
            superseded_decisions=superseded_decisions,
            incidents=incidents,
            team_patterns=team_patterns,
            risks=[]
        )
