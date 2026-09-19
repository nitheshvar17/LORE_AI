import json
import datetime
from sqlalchemy.orm import Session
from backend.db.models import (
    Decision, DecisionAuditLog, Promise, IssueRecord,
    MergeRequestRecord, TeamPattern, Incident, Discussion, CommitLedgerEntry
)

def seed_database(db: Session):
    # Only seed if empty
    if db.query(Decision).count() > 0:
        return

    print("[LORE SEED] Seeding initial institutional memory...")

    # 1. Decisions
    d5 = Decision(
        id=5,
        title="Legacy In-Memory Session Storage",
        decision="Store session tokens in custom in-memory dictionary with local cache.",
        reason="Rapid prototyping for MVP release in early stages.",
        author="Dave Chen",
        status="SUPERSEDED",
        source_type="MR",
        source_ref="MR #15",
        related_files=json.dumps(["src/auth/legacy_session.py"]),
        risk_level="HIGH",
        evidence_type="SOURCE_VERIFIED",
        tags="auth,session,legacy",
        domain="Authentication",
        superseded_by_id=17,
        created_at=datetime.datetime(2025, 3, 10, 10, 0, 0)
    )

    d17 = Decision(
        id=17,
        title="Authentication Token Storage",
        decision="Authentication tokens must be stored using secure HTTP-only cookies with SameSite=Lax and Secure flags. Never store tokens in browser localStorage or sessionStorage.",
        reason="Mitigates XSS token theft and prevents client-side script access to sensitive authentication credentials.",
        author="Alex Rivera",
        status="ACTIVE",
        source_type="MR",
        source_ref="MR #72",
        related_files=json.dumps(["src/auth/session.py", "src/auth/cookies.py", "src/middleware/auth.py"]),
        risk_level="CRITICAL",
        evidence_type="SOURCE_VERIFIED",
        tags="security,auth,cookies,xss-defense",
        domain="Authentication",
        supersedes_id=5,
        created_at=datetime.datetime(2025, 7, 14, 14, 30, 0)
    )

    d22 = Decision(
        id=22,
        title="OAuth State Parameter Validation",
        decision="OAuth authorization flows must validate a cryptographically secure random state nonce stored server-side before exchanging authorization codes.",
        reason="Prevents CSRF attacks during OAuth 2.0 handshake and protects against malicious callback injection.",
        author="Priya Sharma",
        status="ACTIVE",
        source_type="MR",
        source_ref="MR #84",
        related_files=json.dumps(["src/auth/oauth.py", "src/services/oauth_provider.py"]),
        risk_level="HIGH",
        evidence_type="SOURCE_VERIFIED",
        tags="oauth,security,csrf,auth",
        domain="Authentication",
        created_at=datetime.datetime(2025, 9, 2, 11, 15, 0)
    )

    d12 = Decision(
        id=12,
        title="Primary Relational Database Engine",
        decision="Use PostgreSQL as the primary relational database with SQLAlchemy ORM and Alembic migrations. All entities require strict schema validation.",
        reason="Guarantees ACID transactions, strict data integrity across accounts, and native JSONB indexing without running dual databases.",
        author="Sam Vance",
        status="ACTIVE",
        source_type="MR",
        source_ref="MR #31",
        related_files=json.dumps(["src/db/session.py", "src/db/models.py", "alembic.ini"]),
        risk_level="HIGH",
        evidence_type="SOURCE_VERIFIED",
        tags="database,postgresql,architecture,acid",
        domain="Database",
        created_at=datetime.datetime(2025, 5, 20, 9, 45, 0)
    )

    d35 = Decision(
        id=35,
        title="API Error Handling & Response Envelope",
        decision="All application errors must raise subclasses of AppError with standard HTTP status code and error_code string. Raw Python Exception or generic 500 must never be raised directly in controllers.",
        reason="Ensures consistent error payloads for frontend toast/error boundary display and centralized Sentry tracking.",
        author="Alex Rivera",
        status="ACTIVE",
        source_type="MR",
        source_ref="MR #91",
        related_files=json.dumps(["src/core/exceptions.py", "src/middleware/error_handler.py"]),
        risk_level="MEDIUM",
        evidence_type="SOURCE_VERIFIED",
        tags="api,error-handling,conventions",
        domain="API",
        created_at=datetime.datetime(2025, 10, 18, 16, 20, 0)
    )

    d8 = Decision(
        id=8,
        title="Zero Hardcoded Secrets & Environment Config",
        decision="Secrets, API tokens, and credentials must be injected exclusively via environment variables or secret vaults. No fallback mock keys in code.",
        reason="Root cause remediation from historical Incident #12 where an API key was committed into Git.",
        author="Security Team",
        status="ACTIVE",
        source_type="INCIDENT",
        source_ref="Security Incident #12",
        related_files=json.dumps(["src/core/config.py", ".env.example"]),
        risk_level="CRITICAL",
        evidence_type="SOURCE_VERIFIED",
        tags="security,secrets,credentials,compliance",
        domain="Security",
        created_at=datetime.datetime(2025, 8, 12, 18, 0, 0)
    )

    db.add_all([d5, d17, d22, d12, d35, d8])
    db.commit()

    # 2. Decision Audit Logs
    audit1 = DecisionAuditLog(
        decision_id=17,
        action="CREATED",
        actor="Alex Rivera",
        reason="Formalized cookie security policy after architectural review in MR #72.",
        old_status=None,
        new_status="ACTIVE",
        metadata_json=json.dumps({"source": "MR #72", "approvers": ["Priya Sharma", "Sam Vance"]})
    )
    audit2 = DecisionAuditLog(
        decision_id=5,
        action="SUPERSEDED",
        actor="Alex Rivera",
        reason="Superseded by Decision #17 (Secure HTTP-only cookies).",
        old_status="ACTIVE",
        new_status="SUPERSEDED",
        metadata_json=json.dumps({"superseded_by": 17})
    )
    db.add_all([audit1, audit2])

    # 3. Incidents
    inc1 = Incident(
        id=12,
        title="Production API Key Exposure in Commit History",
        description="A developer committed a live third-party service credential in a test helper file during debugging.",
        root_cause="Lack of pre-commit secret detection and hardcoded defaults in test suite.",
        resolution="Rotated credentials immediately, scrubbed git history with BFG Repo-Cleaner, and instituted Decision #8.",
        lessons_learned="Automated secret scanning before sending code to LLMs or repos is mandatory.",
        related_decisions="8",
        date="2025-08-10"
    )
    inc2 = Incident(
        id=18,
        title="OAuth Redirect Hijack Simulation Incident",
        description="Penetration testing identified missing validation on the redirect URI parameter during OAuth login.",
        root_cause="OAuth provider state parameter was generated but never verified on callback.",
        resolution="Instituted Decision #22 requiring strict server-side nonce verification.",
        lessons_learned="Always validate state nonce and whitelist redirect URIs.",
        related_decisions="22",
        date="2025-11-14"
    )
    db.add_all([inc1, inc2])

    # 4. Team Patterns
    tp1 = TeamPattern(
        name="AppError Exception Convention",
        description="All service and API layer exceptions must inherit from AppError. Do not throw generic Exception.",
        rule_type="CODE_CONVENTION",
        expected_practice="raise AppError(status_code=400, message='Invalid credentials', error_code='AUTH_INVALID_CREDENTIALS')",
        forbidden_practice="raise Exception('Invalid credentials')",
        severity="HIGH",
        is_active=True
    )
    tp2 = TeamPattern(
        name="Secure HTTP-Only Cookie Standard",
        description="Authentication tokens must never be written to localStorage or sessionStorage.",
        rule_type="SECURITY",
        expected_practice="response.set_cookie(key='access_token', value=token, httponly=True, secure=True, samesite='lax')",
        forbidden_practice="localStorage.setItem('token', token)",
        severity="CRITICAL",
        is_active=True
    )
    tp3 = TeamPattern(
        name="PostgreSQL Migration Integrity",
        description="All schema changes must be accompanied by an Alembic migration script and test.",
        rule_type="ARCHITECTURE",
        expected_practice="Use Alembic migration with upgrade() and downgrade() functions.",
        forbidden_practice="Direct ALTER TABLE in application startup code.",
        severity="MEDIUM",
        is_active=True
    )
    db.add_all([tp1, tp2, tp3])

    # 5. Issues & Pre-Mortems
    issue103 = IssueRecord(
        gitlab_issue_id=103,
        title="Add Google Login",
        description="Implement Google OAuth 2.0 login for web and mobile clients to simplify user onboarding.",
        author="Alex Rivera",
        status="OPEN",
        domain="Authentication",
        pre_mortem_json=json.dumps({
            "risks": [
                {
                    "title": "Duplicate Account Creation",
                    "description": "If user logs in via Google with an email already registered via password, duplicate user records may be created or accounts orphaned.",
                    "severity": "HIGH",
                    "prevention": "Implement account linking logic based on verified email matching with primary account confirmation."
                },
                {
                    "title": "Token Exposure via Browser Storage",
                    "description": "Storing Google access/refresh tokens in localStorage exposes users to cross-site scripting (XSS) token exfiltration.",
                    "severity": "CRITICAL",
                    "prevention": "Adhere strictly to Decision #17: store auth session tokens in secure HTTP-only cookies."
                },
                {
                    "title": "OAuth State Callback Injection",
                    "description": "Failing to validate the OAuth state parameter allows attackers to bind their Google identity to a victim's session.",
                    "severity": "HIGH",
                    "prevention": "Enforce Decision #22: generate and cryptographically verify random state nonce in cookie/session."
                },
                {
                    "title": "Third-Party Provider Outage",
                    "description": "If Google OAuth APIs experience high latency or downtime, login endpoint could hang or crash without user-friendly feedback.",
                    "severity": "MEDIUM",
                    "prevention": "Wrap Google token exchange in timeout (5s) and catch errors with AppError('AUTH_PROVIDER_UNAVAILABLE')."
                }
            ],
            "questions": [
                "What authentication mechanism and token storage will you use for the session?",
                "How will the OAuth state parameter be generated and verified?",
                "How will existing accounts with matching emails be handled?",
                "What error handling pattern will be used if Google OAuth API is unavailable?"
            ]
        }),
        questions_json=json.dumps([
            "What authentication mechanism and token storage will you use for the session?",
            "How will the OAuth state parameter be generated and verified?",
            "How will existing accounts with matching emails be handled?",
            "What error handling pattern will be used if Google OAuth API is unavailable?"
        ]),
        developer_answers_json=json.dumps([
            {
                "question": "What authentication mechanism and token storage will you use for the session?",
                "answer": "Authentication tokens will be stored using secure HTTP-only cookies with SameSite=Lax per Decision #17.",
                "extracted_promise": "Authentication tokens will use secure HTTP-only cookies."
            },
            {
                "question": "How will the OAuth state parameter be generated and verified?",
                "answer": "We will generate a CSRF state nonce stored in encrypted session and verify it on callback.",
                "extracted_promise": "OAuth state will be verified before token exchange."
            }
        ])
    )

    issue108 = IssueRecord(
        gitlab_issue_id=108,
        title="Migrate User Analytics to Document Store",
        description="Store unstructured user telemetry events in MongoDB for flexible querying.",
        author="Sam Vance",
        status="OPEN",
        domain="Database",
        pre_mortem_json=json.dumps({
            "risks": [
                {
                    "title": "Architecture Split & Dual Database Overhead",
                    "description": "Introducing MongoDB directly conflicts with Decision #12 (PostgreSQL with JSONB).",
                    "severity": "HIGH",
                    "prevention": "Utilize PostgreSQL native JSONB columns before adding a new database engine to the stack."
                }
            ],
            "questions": [
                "Have you benchmarked PostgreSQL JSONB vs MongoDB for this workload?",
                "How will backups and connection pooling be managed for a secondary database?"
            ]
        }),
        questions_json=json.dumps([
            "Have you benchmarked PostgreSQL JSONB vs MongoDB for this workload?",
            "How will backups and connection pooling be managed for a secondary database?"
        ]),
        developer_answers_json="[]"
    )

    db.add_all([issue103, issue108])

    # 6. Promises
    p27 = Promise(
        id=27,
        developer="Alex Rivera",
        promise_text="Authentication tokens will use secure HTTP-only cookies.",
        status="PENDING",
        issue_id=103,
        mr_id=52,
        source_context="Issue #103 Pre-Mortem Q&A",
        evidence_found=None
    )
    p28 = Promise(
        id=28,
        developer="Priya Sharma",
        promise_text="Use AppError for API errors instead of raw Exception.",
        status="FULFILLED",
        issue_id=103,
        mr_id=51,
        source_context="Issue #91 Discussion",
        evidence_found="src/api/auth.py uses AppError(status_code=400, error_code='AUTH_FAILED')"
    )
    p29 = Promise(
        id=29,
        developer="Sam Vance",
        promise_text="Add database migration test for schema changes.",
        status="VIOLATED",
        issue_id=108,
        mr_id=49,
        source_context="MR #49 Code Review",
        evidence_found="No alembic migration test detected in tests/db/ directory."
    )
    db.add_all([p27, p28, p29])

    # 7. Merge Requests
    mr52_diff = """diff --git a/src/auth/oauth.py b/src/auth/oauth.py
index 10a4b2..39c8e1 100644
--- a/src/auth/oauth.py
+++ b/src/auth/oauth.py
@@ -1,5 +1,18 @@
+import requests
+from fastapi import APIRouter
+
+router = APIRouter()
+
+# Simulated Google OAuth Callback
+@router.post("/api/auth/google/callback")
+def google_callback(code: str, state: str):
+    if not code:
+        raise Exception("Google authentication failed: missing authorization code")
+    
+    # Exchange code for token
+    token = "ya29.a0AfH6SM..." # simulated token
+    return {"status": "ok", "token": token}
diff --git a/src/auth/session.ts b/src/auth/session.ts
new file mode 100644
index 000000..88ef12
--- /dev/null
+++ b/src/auth/session.ts
@@ -0,0 +1,9 @@
+export function handleAuthSuccess(token: string) {
+  // Store token for client requests
+  localStorage.setItem("token", token);
+  console.log("User authenticated successfully with token: " + token);
+}
"""

    mr52 = MergeRequestRecord(
        gitlab_mr_id=52,
        title="Implement Google Login",
        description="Add Google OAuth 2.0 authentication flow with client callback handler.",
        author="Alex Rivera",
        source_branch="feature/google-oauth",
        target_branch="main",
        changed_files=json.dumps(["src/auth/oauth.py", "src/auth/session.ts", "src/services/user_service.py"]),
        diff_content=mr52_diff,
        status="OPEN",
        overall_risk="HIGH",
        conflict_status="DETECTED",
        review_results_json=json.dumps({
            "overall_risk": "HIGH",
            "summary": "MR #52 introduces 1 memory conflict, 1 promise violation, 1 potential security finding, and 1 team pattern violation.",
            "layers": {
                "layer1_memory_conflict": {
                    "passed": False,
                    "status": "CONFLICT_DETECTED",
                    "findings": [
                        {
                            "severity": "CRITICAL",
                            "title": "Conflict with Decision #17 (Authentication Token Storage)",
                            "detail": "MR #52 writes auth token to localStorage.setItem('token', token) in src/auth/session.ts, directly violating active Decision #17 which mandates secure HTTP-only cookies.",
                            "historical_decision_id": 17,
                            "historical_decision_title": "Authentication Token Storage",
                            "rule": "Authentication tokens must use secure HTTP-only cookies. Never localStorage."
                        }
                    ]
                },
                "layer2_promise_check": {
                    "passed": False,
                    "status": "PROMISE_VIOLATED",
                    "findings": [
                        {
                            "promise_id": 27,
                            "developer": "Alex Rivera",
                            "promise_text": "Authentication tokens will use secure HTTP-only cookies.",
                            "status": "VIOLATED",
                            "evidence": "src/auth/session.ts: localStorage.setItem('token', token)"
                        }
                    ]
                },
                "layer3_security_check": {
                    "passed": False,
                    "status": "POTENTIAL_FINDING",
                    "findings": [
                        {
                            "severity": "HIGH",
                            "category": "Insecure Token Storage",
                            "message": "Potential security finding: Token saved in client localStorage is accessible by any injected third-party scripts via XSS.",
                            "file": "src/auth/session.ts",
                            "line": 3
                        }
                    ]
                },
                "layer4_code_impact": {
                    "passed": True,
                    "status": "ANALYZED",
                    "affected_modules": ["Authentication", "Session Handling", "User Service"],
                    "blast_radius": "HIGH",
                    "potential_impact": "Changes affect core session and user login flow across all client interfaces."
                },
                "layer5_team_pattern": {
                    "passed": False,
                    "status": "PATTERN_VIOLATION",
                    "findings": [
                        {
                            "pattern_name": "AppError Exception Convention",
                            "expected": "raise AppError(status_code=400, message='...', error_code='AUTH_OAUTH_FAILED')",
                            "found": "raise Exception('Google authentication failed: missing authorization code')",
                            "file": "src/auth/oauth.py",
                            "line": 10
                        }
                    ]
                }
            }
        }),
        conflict_resolution_json="{}"
    )

    mr49 = MergeRequestRecord(
        gitlab_mr_id=49,
        title="Database Migration for User Analytics",
        description="Introduce MongoDB client for flexible event storage.",
        author="Sam Vance",
        source_branch="feature/mongo-analytics",
        target_branch="main",
        changed_files=json.dumps(["src/db/mongo.py"]),
        diff_content="+ import pymongo\n+ client = pymongo.MongoClient('mongodb://localhost:27017')",
        status="OPEN",
        overall_risk="HIGH",
        conflict_status="DETECTED",
        review_results_json=json.dumps({
            "overall_risk": "HIGH",
            "summary": "MR #49 introduces a database engine conflict with Decision #12 (PostgreSQL).",
            "layers": {
                "layer1_memory_conflict": {
                    "passed": False,
                    "status": "CONFLICT_DETECTED",
                    "findings": [
                        {
                            "severity": "HIGH",
                            "title": "Conflict with Decision #12 (Primary Relational Database Engine)",
                            "detail": "MR #49 introduces pymongo client, conflicting with active Decision #12 requiring PostgreSQL.",
                            "historical_decision_id": 12,
                            "historical_decision_title": "Primary Relational Database Engine",
                            "rule": "Use PostgreSQL as the primary database engine."
                        }
                    ]
                },
                "layer2_promise_check": {"passed": True, "status": "NO_PROMISES", "findings": []},
                "layer3_security_check": {"passed": True, "status": "CLEAN", "findings": []},
                "layer4_code_impact": {
                    "passed": True,
                    "status": "ANALYZED",
                    "affected_modules": ["Database", "Telemetry"],
                    "blast_radius": "MEDIUM",
                    "potential_impact": "Requires dual database maintenance and connection pool tuning."
                },
                "layer5_team_pattern": {"passed": True, "status": "PASSED", "findings": []}
            }
        })
    )

    db.add_all([mr52, mr49])

    # 8. Commit Ledger
    c1 = CommitLedgerEntry(
        commit_sha="a83f91c",
        author="Alex Rivera",
        message="feat(auth): initial Google OAuth endpoint and token response",
        changed_files=json.dumps(["src/auth/oauth.py", "src/auth/session.ts"]),
        affected_domains=json.dumps(["Authentication", "Session Handling"]),
        estimated_risk="HIGH",
        mr_id=52
    )
    c2 = CommitLedgerEntry(
        commit_sha="7b91d4e",
        author="Priya Sharma",
        message="refactor(api): standard AppError for authentication router",
        changed_files=json.dumps(["src/api/auth.py"]),
        affected_domains=json.dumps(["Authentication", "API"]),
        estimated_risk="LOW",
        mr_id=51
    )
    db.add_all([c1, c2])

    db.commit()
    print("[LORE SEED] Database seeded successfully with realistic institutional memory.")
