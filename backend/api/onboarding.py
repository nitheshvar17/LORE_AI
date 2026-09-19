from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.agents.onboarding_agent import OnboardingAgent

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

@router.get("/briefing")
def get_developer_briefing(
    project_name: str = Query("LORE GitLab Core"),
    db: Session = Depends(get_db)
):
    briefing = OnboardingAgent.generate_developer_briefing(db=db, project_name=project_name)
    return briefing
