import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.db.database import Base
from backend.db.models import Decision, Promise, IssueRecord, MergeRequestRecord, TeamPattern
from backend.services.security_scanner import SecurityScanner
from backend.agents.memory_agent import MemoryAgent
from backend.agents.promise_agent import PromiseAgent
from backend.agents.review_agent import ReviewAgent
from backend.agents.onboarding_agent import OnboardingAgent
from backend.agents.qa_agent import QAAgent
from backend.services.gitlab_service import gitlab_service

def get_test_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    # Preload initial test decision #17
    d17 = Decision(
        id=17,
        title="Authentication Token Storage",
        decision="Authentication tokens must use secure HTTP-only cookies. Never localStorage.",
        reason="Mitigate XSS token theft.",
        author="Alex Rivera",
        status="ACTIVE",
        source_ref="MR #72",
        domain="Authentication",
        risk_level="CRITICAL",
        evidence_type="SOURCE_VERIFIED"
    )
    db.add(d17)

    # Preload pattern
    tp = TeamPattern(
        name="AppError Exception Convention",
        description="All API errors must use AppError",
        expected_practice="raise AppError(...)",
        forbidden_practice="raise Exception(...)",
        severity="HIGH",
        is_active=True
    )
    db.add(tp)
    db.commit()

    yield db
    db.close()

def test_security_scanner_redaction():
    raw_text = "API_KEY='sk-1234567890abcdef12345678' and password='supersecretpassword'"
    redacted, count, types = SecurityScanner.redact_secrets(raw_text)
    assert count >= 1
    assert "supersecretpassword" not in redacted
    assert "sk-1234567890" not in redacted

def test_security_scanner_diff_detection():
    diff = "+ localStorage.setItem('token', userToken)\n+ eval('foo')"
    findings = SecurityScanner.scan_diff_security(diff, ["src/auth/session.ts"])
    assert len(findings) >= 2
    categories = [f["category"] for f in findings]
    assert "Insecure Token Storage" in categories
    assert "Dangerous Dynamic Execution" in categories

def test_memory_agent_lifecycle_and_override(test_db):
    # Search
    results = MemoryAgent.search_decisions(test_db, query="Authentication")
    assert len(results) == 1
    assert results[0].id == 17

    # Override flow
    override_res = MemoryAgent.override_decision(
        db=test_db,
        old_decision_id=17,
        new_title="Updated Token Storage",
        new_decision_text="Use mobile-friendly header token with secure storage.",
        override_reason="Required for native mobile client architecture.",
        actor="Alex Rivera",
        source_mr_ref="MR #52"
    )

    assert override_res["success"] is True
    assert override_res["old_decision"]["status"] == "SUPERSEDED"
    assert override_res["new_decision"]["status"] == "ACTIVE"

    # Verify audit logs
    old_dec = test_db.query(Decision).filter(Decision.id == 17).first()
    assert old_dec.status == "SUPERSEDED"
    assert len(old_dec.audit_logs) >= 1

def test_promise_extraction(test_db):
    answers = [
        {
            "question": "How will authentication tokens be stored?",
            "answer": "Authentication tokens will use secure HTTP-only cookies."
        }
    ]
    created = PromiseAgent.capture_promises_from_issue_answers(
        db=test_db,
        issue_id=103,
        developer="Alex Rivera",
        answers=answers
    )
    assert len(created) == 1
    assert created[0].status == "PENDING"
    assert "cookies" in created[0].promise_text.lower()

def test_five_layer_review_detects_conflicts(test_db):
    # Add pending promise #27
    p27 = Promise(
        id=27,
        developer="Alex Rivera",
        promise_text="Authentication tokens will use secure HTTP-only cookies.",
        status="PENDING"
    )
    test_db.add(p27)
    test_db.commit()

    # Create MR with conflicting code
    mr = MergeRequestRecord(
        gitlab_mr_id=52,
        title="Google Login",
        description="Add OAuth",
        author="Alex Rivera",
        changed_files='["src/auth/session.ts", "src/auth/oauth.py"]',
        diff_content='+ localStorage.setItem("token", token)\n+ raise Exception("Auth failed")',
        status="OPEN"
    )
    test_db.add(mr)
    test_db.commit()

    # Run review
    res = ReviewAgent.run_five_layer_review(test_db, mr)

    assert res["overall_risk"] in ("CRITICAL", "HIGH")
    assert res["layers"]["layer1_memory_conflict"]["passed"] is False
    assert res["layers"]["layer2_promise_check"]["passed"] is False
    assert res["layers"]["layer3_security_check"]["passed"] is False
    assert res["layers"]["layer5_team_pattern"]["passed"] is False

def test_onboarding_briefing_generation(test_db):
    briefing = OnboardingAgent.generate_developer_briefing(test_db, "LORE Test")
    assert "title" in briefing
    assert len(briefing["sections"]) >= 5

def test_qa_agent_memory_search(test_db):
    answer = QAAgent.ask(test_db, "What decisions govern authentication?")
    assert len(answer["active_decisions"]) >= 1
    assert answer["active_decisions"][0]["id"] == 17
    assert answer["active_decisions"][0]["evidence_type"] == "SOURCE_VERIFIED"

def test_gitlab_service_webhook_validation():
    token = "lore-webhook-secret-token"
    assert gitlab_service.verify_webhook_token(token) is True
    assert gitlab_service.verify_webhook_token("wrong-secret") is False
