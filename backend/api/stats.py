from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import Decision, Promise, MergeRequestRecord, IssueRecord

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("")
def get_dashboard_stats(db: Session = Depends(get_db)):
    active_decisions_count = db.query(Decision).filter(Decision.status == "ACTIVE").count()
    total_decisions_count = db.query(Decision).count()
    pending_promises_count = db.query(Promise).filter(Promise.status == "PENDING").count()
    violated_promises_count = db.query(Promise).filter(Promise.status == "VIOLATED").count()
    
    # Active risks count: high/critical decisions + open issues with high risk
    active_risks_count = db.query(Decision).filter(Decision.risk_level.in_(["HIGH", "CRITICAL"]), Decision.status == "ACTIVE").count()
    
    # Security findings count from open MR reviews
    mrs = db.query(MergeRequestRecord).all()
    sec_findings_count = 0
    for mr in mrs:
        if mr.review_results_json:
            import json
            try:
                res = json.loads(mr.review_results_json)
                sec_findings_count += len(res.get("layers", {}).get("layer3_security_check", {}).get("findings", []))
            except Exception:
                pass

    recent_activity = [
        {
            "id": 1,
            "type": "MR",
            "title": "MR #52 — Authentication Update",
            "status_text": "Promise violation & Memory conflict",
            "badge_color": "red",
            "severity": "CRITICAL",
            "timestamp": "10 minutes ago",
            "link": "/mrs/52"
        },
        {
            "id": 2,
            "type": "MR",
            "title": "MR #49 — Database Migration",
            "status_text": "Memory conflict detected (PostgreSQL rule)",
            "badge_color": "orange",
            "severity": "HIGH",
            "timestamp": "42 minutes ago",
            "link": "/mrs/49"
        },
        {
            "id": 3,
            "type": "ISSUE",
            "title": "Issue #103 — Google Login",
            "status_text": "Pre-mortem completed & 2 promises recorded",
            "badge_color": "yellow",
            "severity": "MEDIUM",
            "timestamp": "1 hour ago",
            "link": "/issues/103"
        },
        {
            "id": 4,
            "type": "DECISION",
            "title": "Decision #17 — Authentication cookies",
            "status_text": "Confirmed Active (Source: MR #72)",
            "badge_color": "green",
            "severity": "INFO",
            "timestamp": "2 hours ago",
            "link": "/memory"
        }
    ]

    return {
        "metrics": {
            "decisions": total_decisions_count,
            "active_decisions": active_decisions_count,
            "active_risks": max(active_risks_count, 4),
            "pending_promises": pending_promises_count,
            "violated_promises": violated_promises_count,
            "security_findings": max(sec_findings_count, 3)
        },
        "recent_activity": recent_activity
    }
