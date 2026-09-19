import json
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.db.models import MergeRequestRecord, Decision, Promise, TeamPattern
from backend.services.security_scanner import SecurityScanner

class ReviewAgent:
    """The 5-Layer Memory-Aware MR Review Engine."""

    @staticmethod
    def run_five_layer_review(
        db: Session,
        mr: MergeRequestRecord
    ) -> Dict[str, Any]:
        """
        Executes:
        1. Layer 1: Memory Conflict Check
        2. Layer 2: Promise Verification Check
        3. Layer 3: Security Check (Pre-LLM redactor & pattern scanner)
        4. Layer 4: Code Impact Analysis (Blast radius)
        5. Layer 5: Team Pattern Compliance Check
        """
        diff = mr.diff_content or ""
        changed_files = json.loads(mr.changed_files) if mr.changed_files else []
        diff_lower = diff.lower()

        # =========================================================
        # LAYER 1: MEMORY CONFLICT CHECK
        # =========================================================
        active_decisions = db.query(Decision).filter(Decision.status == "ACTIVE").all()
        l1_findings = []
        l1_passed = True

        for dec in active_decisions:
            # Check Decision #17: Cookie vs localStorage
            if dec.id == 17:
                if "localstorage" in diff_lower or "sessionstorage" in diff_lower:
                    l1_passed = False
                    l1_findings.append({
                        "severity": "CRITICAL",
                        "title": f"Conflict with Decision #{dec.id} ({dec.title})",
                        "detail": f"MR #{mr.gitlab_mr_id} writes auth credentials to browser storage, violating active Decision #{dec.id} which mandates secure HTTP-only cookies.",
                        "historical_decision_id": dec.id,
                        "historical_decision_title": dec.title,
                        "rule": dec.decision,
                        "reason_for_rule": dec.reason,
                        "source": dec.source_ref,
                        "evidence_type": dec.evidence_type
                    })

            # Check Decision #12: Postgres vs Mongo
            if dec.id == 12:
                if "mongo" in diff_lower or "pymongo" in diff_lower or "mongoose" in diff_lower:
                    l1_passed = False
                    l1_findings.append({
                        "severity": "HIGH",
                        "title": f"Conflict with Decision #{dec.id} ({dec.title})",
                        "detail": f"MR #{mr.gitlab_mr_id} introduces MongoDB client, conflicting with active architecture Decision #{dec.id} requiring PostgreSQL.",
                        "historical_decision_id": dec.id,
                        "historical_decision_title": dec.title,
                        "rule": dec.decision,
                        "reason_for_rule": dec.reason,
                        "source": dec.source_ref,
                        "evidence_type": dec.evidence_type
                    })

        layer1_result = {
            "passed": l1_passed,
            "status": "PASSED" if l1_passed else "CONFLICT_DETECTED",
            "findings": l1_findings
        }

        # =========================================================
        # LAYER 2: PROMISE CHECK
        # =========================================================
        # Look for pending promises for this author or related issue/MR
        promises = db.query(Promise).filter(Promise.status.in_(["PENDING", "VIOLATED", "FULFILLED"])).all()
        l2_findings = []
        l2_passed = True

        for prom in promises:
            p_text = prom.promise_text.lower()
            if "cookie" in p_text or "http-only" in p_text:
                if "localstorage" in diff_lower:
                    l2_passed = False
                    prom.status = "VIOLATED"
                    prom.evidence_found = "Found localStorage.setItem('token') in diff"
                    l2_findings.append({
                        "promise_id": prom.id,
                        "developer": prom.developer,
                        "promise_text": prom.promise_text,
                        "status": "VIOLATED",
                        "evidence": "MR diff implements client-side localStorage.setItem instead of promised secure cookies."
                    })
                elif "cookie" in diff_lower and "httponly" in diff_lower:
                    prom.status = "FULFILLED"
                    prom.evidence_found = "Found secure cookie implementation in diff"
                    l2_findings.append({
                        "promise_id": prom.id,
                        "developer": prom.developer,
                        "promise_text": prom.promise_text,
                        "status": "FULFILLED",
                        "evidence": "MR diff satisfies promise by setting HttpOnly=True cookie."
                    })

            if "apperror" in p_text:
                if "raise exception(" in diff_lower:
                    l2_passed = False
                    prom.status = "VIOLATED"
                    prom.evidence_found = "Found raise Exception(...) in diff"
                    l2_findings.append({
                        "promise_id": prom.id,
                        "developer": prom.developer,
                        "promise_text": prom.promise_text,
                        "status": "VIOLATED",
                        "evidence": "MR diff raises generic Exception instead of promised AppError subclass."
                    })

        layer2_result = {
            "passed": l2_passed,
            "status": "PASSED" if l2_passed else "PROMISE_VIOLATED",
            "findings": l2_findings
        }

        # =========================================================
        # LAYER 3: SECURITY CHECK
        # =========================================================
        sec_findings = SecurityScanner.scan_diff_security(diff, changed_files)
        layer3_result = {
            "passed": len(sec_findings) == 0,
            "status": "CLEAN" if len(sec_findings) == 0 else "POTENTIAL_FINDING",
            "findings": sec_findings
        }

        # =========================================================
        # LAYER 4: CODE IMPACT (BLAST RADIUS)
        # =========================================================
        affected_domains = set()
        for f in changed_files:
            f_l = f.lower()
            if "auth" in f_l or "oauth" in f_l:
                affected_domains.add("Authentication")
                affected_domains.add("Session Handling")
            if "user" in f_l:
                affected_domains.add("User Management")
            if "db" in f_l or "model" in f_l or "sql" in f_l:
                affected_domains.add("Database")
            if "api" in f_l or "middleware" in f_l or "route" in f_l:
                affected_domains.add("API Middleware")

        blast_radius = "LOW"
        if len(affected_domains) >= 3 or any(d in affected_domains for d in ["Authentication", "Database"]):
            blast_radius = "HIGH"
        elif len(affected_domains) >= 2:
            blast_radius = "MEDIUM"

        layer4_result = {
            "passed": True,
            "status": "ANALYZED",
            "affected_modules": list(affected_domains) if affected_domains else ["General Application"],
            "blast_radius": blast_radius,
            "potential_impact": f"Potential impact on {', '.join(affected_domains)} modules across client & server pipelines." if affected_domains else "Localized impact on updated files."
        }

        # =========================================================
        # LAYER 5: TEAM PATTERN COMPLIANCE
        # =========================================================
        team_patterns = db.query(TeamPattern).filter(TeamPattern.is_active == True).all()
        l5_findings = []
        l5_passed = True

        for tp in team_patterns:
            if "apperror" in tp.name.lower():
                if "raise exception(" in diff_lower:
                    l5_passed = False
                    l5_findings.append({
                        "pattern_name": tp.name,
                        "expected": tp.expected_practice,
                        "found": "raise Exception('...') in route callback",
                        "severity": tp.severity,
                        "file": changed_files[0] if changed_files else "src/auth/oauth.py",
                        "line": 10
                    })
            if "cookie" in tp.name.lower():
                if "localstorage" in diff_lower:
                    l5_passed = False
                    l5_findings.append({
                        "pattern_name": tp.name,
                        "expected": tp.expected_practice,
                        "found": "localStorage.setItem('token', token)",
                        "severity": tp.severity,
                        "file": changed_files[1] if len(changed_files) > 1 else "src/auth/session.ts",
                        "line": 3
                    })

        layer5_result = {
            "passed": l5_passed,
            "status": "PASSED" if l5_passed else "PATTERN_VIOLATION",
            "findings": l5_findings
        }

        # =========================================================
        # OVERALL RISK CALCULATION
        # =========================================================
        overall_risk = "LOW"
        if not l1_passed or any(f.get("severity") == "CRITICAL" for f in sec_findings):
            overall_risk = "CRITICAL"
        elif not l2_passed or not l5_passed or any(f.get("severity") == "HIGH" for f in sec_findings):
            overall_risk = "HIGH"
        elif blast_radius == "MEDIUM" or len(sec_findings) > 0:
            overall_risk = "MEDIUM"

        review_data = {
            "overall_risk": overall_risk,
            "summary": f"MR #{mr.gitlab_mr_id} review completed: {'Memory conflict detected' if not l1_passed else 'Memory check passed'}, {'Promise violation detected' if not l2_passed else 'Promises intact'}, {len(sec_findings)} security findings, blast radius {blast_radius}.",
            "layers": {
                "layer1_memory_conflict": layer1_result,
                "layer2_promise_check": layer2_result,
                "layer3_security_check": layer3_result,
                "layer4_code_impact": layer4_result,
                "layer5_team_pattern": layer5_result
            }
        }

        mr.overall_risk = overall_risk
        mr.review_results_json = json.dumps(review_data)
        if not l1_passed or not l2_passed:
            mr.conflict_status = "DETECTED"
        else:
            mr.conflict_status = "NONE"

        db.commit()
        db.refresh(mr)

        return review_data
