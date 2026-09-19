import json
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import IssueRecord, MergeRequestRecord, Promise, Decision, CommitLedgerEntry
from backend.agents.premortem_agent import PreMortemAgent
from backend.agents.review_agent import ReviewAgent
from backend.services.security_scanner import SecurityScanner

router = APIRouter(prefix="/simulator", tags=["Simulator"])

@router.post("/run-scenario/auth-conflict")
async def run_auth_conflict_scenario(db: Session = Depends(get_db)):
    """Simulates the full end-to-end Issue -> Pre-Mortem -> Promise -> MR -> Review conflict flow."""
    # 1. Ensure Issue #103 exists
    issue = db.query(IssueRecord).filter(IssueRecord.gitlab_issue_id == 103).first()
    if not issue:
        issue = IssueRecord(
            gitlab_issue_id=103,
            title="Add Google Login",
            description="Implement Google OAuth 2.0 login for web and mobile clients.",
            author="Alex Rivera",
            status="OPEN",
            domain="Authentication"
        )
        db.add(issue)
        db.commit()
        db.refresh(issue)

    # 2. Run Pre-Mortem
    pm_res = await PreMortemAgent.analyze_issue(db, issue)

    # 3. Create or Reset Promise #27
    promise = db.query(Promise).filter(Promise.id == 27).first()
    if not promise:
        promise = Promise(
            id=27,
            developer="Alex Rivera",
            promise_text="Authentication tokens will use secure HTTP-only cookies.",
            status="PENDING",
            issue_id=103,
            mr_id=52,
            source_context="Issue #103 Pre-Mortem Q&A"
        )
        db.add(promise)
    else:
        promise.status = "PENDING"
        promise.evidence_found = None
    db.commit()

    # 4. Ensure MR #52 exists with conflicting diff
    mr = db.query(MergeRequestRecord).filter(MergeRequestRecord.gitlab_mr_id == 52).first()
    if mr:
        mr.status = "OPEN"
        mr.conflict_status = "DETECTED"
    db.commit()

    # 5. Run 5-Layer Review
    review_res = ReviewAgent.run_five_layer_review(db, mr)

    return {
        "scenario": "Authentication Storage Conflict (Cookie vs localStorage)",
        "step_results": {
            "issue_analyzed": issue.gitlab_issue_id,
            "pre_mortem_risks_count": len(pm_res["pre_mortem"]["risks"]),
            "promise_registered": promise.promise_text,
            "mr_reviewed": mr.gitlab_mr_id,
            "review_summary": review_res["summary"],
            "layer1_memory_conflict": review_res["layers"]["layer1_memory_conflict"]["status"],
            "layer2_promise_check": review_res["layers"]["layer2_promise_check"]["status"],
            "layer3_security_check": review_res["layers"]["layer3_security_check"]["status"],
            "overall_risk": review_res["overall_risk"]
        }
    }

@router.post("/run-scenario/secret-scan")
def run_secret_scan_scenario():
    """Demonstrates pre-LLM secret scanner and redaction on raw git data."""
    raw_code = """
    # Ingested GitLab Diff
    OPENAI_API_KEY="sk-proj-9921491823912039123012930123"
    DB_URI="postgres://admin:SuperSecretPassword123!@db.internal.corp:5432/production"
    GITLAB_TOKEN="glpat-abcdef1234567890wxyz"
    
    def authenticate_client():
        localStorage.setItem("token", user_jwt)
    """

    redacted_text, count, types = SecurityScanner.redact_secrets(raw_code)
    diff_findings = SecurityScanner.scan_diff_security(raw_code, ["config.py", "auth.ts"])

    return {
        "original_text": raw_code,
        "redacted_text": redacted_text,
        "redactions_count": count,
        "detected_secret_types": types,
        "security_findings": diff_findings
    }
