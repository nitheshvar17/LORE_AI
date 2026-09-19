import re
from typing import Tuple, List, Dict, Any

# Regular expressions for detecting and redacting sensitive credentials
SECRET_PATTERNS = [
    (r"(?i)(api[_-]?key|apikey|secret[_-]?key|access[_-]?key)\s*[:=]\s*['\"]([a-zA-Z0-9_\-\.]{8,})['\"]", "API_KEY"),
    (r"(?i)(bearer\s+)([a-zA-Z0-9_\-\.]{20,})", "BEARER_TOKEN"),
    (r"sk-[a-zA-Z0-9]{20,}", "OPENAI_SECRET_KEY"),
    (r"glpat-[a-zA-Z0-9_\-]{20,}", "GITLAB_TOKEN"),
    (r"ghp_[a-zA-Z0-9]{30,}", "GITHUB_TOKEN"),
    (r"AKIA[0-9A-Z]{16}", "AWS_ACCESS_KEY"),
    (r"(?i)(password|passwd|pwd)\s*[:=]\s*['\"]([^'\"]{4,})['\"]", "PASSWORD"),
    (r"(postgres|postgresql|mysql|mongodb|redis):\/\/[a-zA-Z0-9_\-\.]+:[^@]+@[a-zA-Z0-9_\-\.]+", "DB_CONNECTION_STRING"),
    (r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", "PRIVATE_KEY"),
]

# High-risk security patterns in code diffs
CODE_SECURITY_PATTERNS = [
    {
        "pattern": r"(localStorage|sessionStorage)\.setItem\(\s*['\"](?:token|jwt|auth|accessToken|refreshToken)['\"]",
        "severity": "HIGH",
        "category": "Insecure Token Storage",
        "message": "Potential security finding: Token saved to browser localStorage/sessionStorage is vulnerable to XSS exfiltration.",
        "prevention": "Store auth tokens in secure HTTP-only cookies per Decision #17."
    },
    {
        "pattern": r"(?i)(SELECT\s+.*?\s+FROM\s+.*?\s+WHERE\s+.*?%s|\+.*?(?:request|input|params))",
        "severity": "HIGH",
        "category": "Potential SQL Injection",
        "message": "Potential security finding: Dynamic string formatting in SQL query detected.",
        "prevention": "Use parameterized queries or SQLAlchemy ORM model queries."
    },
    {
        "pattern": r"(?i)verify\s*=\s*False|rejectUnauthorized\s*:\s*false",
        "severity": "MEDIUM",
        "category": "Disabled TLS/SSL Verification",
        "message": "Potential security finding: TLS/SSL certificate verification is disabled.",
        "prevention": "Ensure SSL certificates are properly verified in all production environments."
    },
    {
        "pattern": r"(?i)eval\s*\(|exec\s*\(",
        "severity": "CRITICAL",
        "category": "Dangerous Dynamic Execution",
        "message": "Potential security finding: eval/exec arbitrary code execution detected.",
        "prevention": "Avoid dynamic code execution; use safe parsing or mapping dicts."
    }
]

class SecurityScanner:
    """Pre-LLM redactor and code security checker."""

    @staticmethod
    def redact_secrets(text: str) -> Tuple[str, int, List[str]]:
        """
        Redacts API keys, tokens, passwords, and private keys before sending text to AI models.
        Returns: (sanitized_text, count_of_redactions, list_of_redacted_types)
        """
        if not text:
            return text, 0, []

        redacted_text = text
        findings_count = 0
        finding_types = []

        for pattern, secret_type in SECRET_PATTERNS:
            matches = list(re.finditer(pattern, redacted_text))
            if matches:
                findings_count += len(matches)
                finding_types.append(secret_type)
                
                # Replace with [REDACTED:SECRET_TYPE]
                if secret_type in ("OPENAI_SECRET_KEY", "GITLAB_TOKEN", "GITHUB_TOKEN", "AWS_ACCESS_KEY", "DB_CONNECTION_STRING", "PRIVATE_KEY"):
                    redacted_text = re.sub(pattern, f"[REDACTED:{secret_type}]", redacted_text)
                elif secret_type == "BEARER_TOKEN":
                    redacted_text = re.sub(pattern, r"\1[REDACTED:BEARER_TOKEN]", redacted_text)
                else:
                    # Key=Value pattern
                    redacted_text = re.sub(pattern, r"\1=[REDACTED]", redacted_text)

        return redacted_text, findings_count, list(set(finding_types))

    @staticmethod
    def scan_diff_security(diff: str, changed_files: List[str] = None) -> List[Dict[str, Any]]:
        """
        Scans code diff for obvious insecure patterns, secrets, and dangerous APIs.
        Labels results clearly as 'Potential security finding'.
        """
        findings = []
        if not diff:
            return findings

        # Check for hardcoded secrets in diff
        for pattern, secret_type in SECRET_PATTERNS:
            matches = re.finditer(pattern, diff)
            for m in matches:
                # Find approximate line
                line_no = diff[:m.start()].count("\n") + 1
                findings.append({
                    "severity": "CRITICAL",
                    "category": f"Exposed Secret ({secret_type})",
                    "message": f"Potential security finding: Possible hardcoded {secret_type} in changed code.",
                    "file": changed_files[0] if changed_files else "diff",
                    "line": line_no,
                    "evidence": m.group(0)[:30] + "..." if len(m.group(0)) > 30 else m.group(0),
                    "prevention": "Remove secret from source code and load via environment variables (Decision #8)."
                })

        # Check for dangerous code patterns
        for rule in CODE_SECURITY_PATTERNS:
            matches = re.finditer(rule["pattern"], diff)
            for m in matches:
                line_no = diff[:m.start()].count("\n") + 1
                # Check which file this might belong to
                target_file = changed_files[0] if changed_files else "code"
                if "localStorage" in rule["pattern"]:
                    for f in (changed_files or []):
                        if f.endswith((".ts", ".js", ".tsx", ".jsx")):
                            target_file = f
                            break

                findings.append({
                    "severity": rule["severity"],
                    "category": rule["category"],
                    "message": rule["message"],
                    "file": target_file,
                    "line": line_no,
                    "evidence": m.group(0),
                    "prevention": rule["prevention"]
                })

        return findings
