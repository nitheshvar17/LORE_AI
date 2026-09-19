import json
import datetime
from typing import Dict, Any
from fastapi import APIRouter, Header, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import IssueRecord, MergeRequestRecord, CommitLedgerEntry, Promise, Decision
from backend.services.gitlab_service import gitlab_service
from backend.agents.premortem_agent import PreMortemAgent
from backend.agents.review_agent import ReviewAgent

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/gitlab")
async def handle_gitlab_webhook(
    request: Request,
    x_gitlab_token: str = Header(None),
    db: Session = Depends(get_db)
):
    # 1. Validate Secret Token
    if not gitlab_service.verify_webhook_token(x_gitlab_token):
        raise HTTPException(status_code=401, detail="Invalid GitLab Webhook Token")

    payload: Dict[str, Any] = await request.json()
    object_kind = payload.get("object_kind", "")
    event_type = payload.get("event_type", object_kind)

    # 2. Handle Issue Event
    if object_kind == "issue":
        obj = payload.get("object_attributes", {})
        issue_iid = obj.get("iid") or obj.get("id", 101)
        title = obj.get("title", "New Issue")
        desc = obj.get("description", "")
        author_name = payload.get("user", {}).get("name", "GitLab User")

        issue = db.query(IssueRecord).filter(IssueRecord.gitlab_issue_id == issue_iid).first()
        if not issue:
            issue = IssueRecord(
                gitlab_issue_id=issue_iid,
                title=title,
                description=desc,
                author=author_name,
                status=obj.get("state", "opened").upper(),
                domain="Authentication" if "auth" in title.lower() else "General"
            )
            db.add(issue)
            db.commit()
            db.refresh(issue)

        # Run pre-mortem
        await PreMortemAgent.analyze_issue(db, issue)
        return {"status": "success", "event": "issue_processed", "issue_id": issue_iid}

    # 3. Handle Merge Request Event
    elif object_kind == "merge_request":
        obj = payload.get("object_attributes", {})
        mr_iid = obj.get("iid") or obj.get("id", 50)
        action = obj.get("action", "open")
        title = obj.get("title", "New Merge Request")
        desc = obj.get("description", "")
        author_name = payload.get("user", {}).get("name", "GitLab User")
        state = obj.get("state", "opened")

        mr = db.query(MergeRequestRecord).filter(MergeRequestRecord.gitlab_mr_id == mr_iid).first()
        if not mr:
            mr = MergeRequestRecord(
                gitlab_mr_id=mr_iid,
                title=title,
                description=desc,
                author=author_name,
                source_branch=obj.get("source_branch", "feature/branch"),
                target_branch=obj.get("target_branch", "main"),
                changed_files=json.dumps(["src/auth/oauth.py", "src/auth/session.ts"]),
                diff_content="+ localStorage.setItem('token', token)",
                status="OPEN"
            )
            db.add(mr)
            db.commit()
            db.refresh(mr)

        # Check if merged
        if action == "merge" or state == "merged":
            mr.status = "MERGED"
            # Update decision memory / fulfill promises
            promises = db.query(Promise).filter(Promise.mr_id == mr_iid).all()
            for p in promises:
                if p.status == "PENDING":
                    p.status = "FULFILLED"
            db.commit()
            return {"status": "success", "event": "mr_merged_and_memory_updated", "mr_id": mr_iid}

        # Run 5-layer review
        review_res = ReviewAgent.run_five_layer_review(db, mr)

        # Post review comment to GitLab if enabled
        comment_summary = f"### 🧠 LORE Institutional Memory Review\n**Overall Risk:** {review_res.get('overall_risk')}\n\n"
        if not review_res["layers"]["layer1_memory_conflict"]["passed"]:
            comment_summary += "⚠️ **Memory Conflict Detected:** Changes conflict with active team architectural decisions.\n"
        if not review_res["layers"]["layer2_promise_check"]["passed"]:
            comment_summary += "❌ **Promise Violation Detected:** Implementation conflicts with commitments made in issue pre-mortem.\n"
        if not review_res["layers"]["layer3_security_check"]["passed"]:
            comment_summary += "🔐 **Potential Security Finding:** Insecure token storage or secret detected.\n"

        await gitlab_service.post_mr_comment(mr_iid, comment_summary)
        return {"status": "success", "event": "mr_reviewed", "mr_id": mr_iid, "review": review_res}

    # 4. Handle Push / Commit Event
    elif object_kind == "push":
        commits = payload.get("commits", [])
        user_name = payload.get("user_name", "Developer")
        for c in commits:
            sha = c.get("id", "c0ffee")[:7]
            msg = c.get("message", "Commit message")
            added = c.get("added", [])
            modified = c.get("modified", [])
            all_files = added + modified

            entry = CommitLedgerEntry(
                commit_sha=sha,
                author=user_name,
                message=msg,
                changed_files=json.dumps(all_files),
                affected_domains=json.dumps(["Authentication"] if any("auth" in f.lower() for f in all_files) else ["General"]),
                estimated_risk="HIGH" if any("auth" in f.lower() for f in all_files) else "LOW"
            )
            db.add(entry)
        db.commit()
        return {"status": "success", "event": "push_processed", "commits_recorded": len(commits)}

    return {"status": "ignored", "event": object_kind}
