import hmac
import hashlib
from typing import Dict, Any, Optional, List
import httpx
from backend.core.config import settings

class GitLabService:
    """GitLab integration service layer with mock simulation fallback."""

    def __init__(self):
        self.url = settings.GITLAB_URL.rstrip("/")
        self.token = settings.GITLAB_TOKEN
        self.project_id = settings.GITLAB_PROJECT_ID
        self.webhook_secret = settings.GITLAB_WEBHOOK_SECRET

    def verify_webhook_token(self, token_header: Optional[str]) -> bool:
        """Verifies GitLab X-Gitlab-Token header against configured secret."""
        if not self.webhook_secret:
            return True
        if not token_header:
            return False
        return hmac.compare_digest(token_header, self.webhook_secret)

    async def get_issue(self, issue_id: int) -> Dict[str, Any]:
        """Fetches issue metadata from GitLab or returns simulated payload."""
        if self.token and self.project_id:
            try:
                headers = {"PRIVATE-TOKEN": self.token}
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(f"{self.url}/api/v4/projects/{self.project_id}/issues/{issue_id}", headers=headers)
                    if resp.status_code == 200:
                        return resp.json()
            except Exception as e:
                print(f"[GitLabService] Live fetch failed: {e}. Using simulated data.")

        # Simulated fallback
        return {
            "id": issue_id,
            "iid": issue_id,
            "title": "Add Google Login" if issue_id == 103 else f"Issue #{issue_id}",
            "description": "Implement Google OAuth 2.0 login for web and mobile clients.",
            "author": {"name": "Alex Rivera", "username": "alex"},
            "state": "opened",
            "web_url": f"{self.url}/lore-project/core/-/issues/{issue_id}"
        }

    async def get_merge_request(self, mr_id: int) -> Dict[str, Any]:
        """Fetches MR metadata from GitLab or returns simulated payload."""
        if self.token and self.project_id:
            try:
                headers = {"PRIVATE-TOKEN": self.token}
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(f"{self.url}/api/v4/projects/{self.project_id}/merge_requests/{mr_id}", headers=headers)
                    if resp.status_code == 200:
                        return resp.json()
            except Exception as e:
                print(f"[GitLabService] Live fetch failed: {e}. Using simulated data.")

        # Simulated fallback
        return {
            "id": mr_id,
            "iid": mr_id,
            "title": "Implement Google Login" if mr_id == 52 else f"MR #{mr_id}",
            "description": "Add Google OAuth callback and save token.",
            "author": {"name": "Alex Rivera", "username": "alex"},
            "source_branch": "feature/google-oauth",
            "target_branch": "main",
            "state": "opened",
            "web_url": f"{self.url}/lore-project/core/-/merge_requests/{mr_id}"
        }

    async def post_mr_comment(self, mr_id: int, comment: str) -> Dict[str, Any]:
        """Posts a review comment / note to the GitLab MR."""
        if self.token and self.project_id:
            try:
                headers = {"PRIVATE-TOKEN": self.token}
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(
                        f"{self.url}/api/v4/projects/{self.project_id}/merge_requests/{mr_id}/notes",
                        headers=headers,
                        json={"body": comment}
                    )
                    if resp.status_code in (200, 201):
                        return {"success": True, "note_id": resp.json().get("id")}
            except Exception as e:
                print(f"[GitLabService] Post comment failed: {e}")

        # Simulated response
        print(f"[GitLabService SIMULATION] Posted comment to MR #{mr_id}:\n{comment}")
        return {"success": True, "note_id": 9999, "simulated": True}

gitlab_service = GitLabService()
