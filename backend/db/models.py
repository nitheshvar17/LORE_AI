import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.db.database import Base

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    decision = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    author = Column(String(100), nullable=False)
    status = Column(String(50), default="ACTIVE", index=True)  # ACTIVE, PROPOSED, SUPERSEDED, REJECTED, ARCHIVED
    source_type = Column(String(50), default="MR")  # MR, ISSUE, INCIDENT, MANUAL, RULE
    source_ref = Column(String(100), default="MR #1")
    related_files = Column(Text, default="[]")  # JSON list string
    risk_level = Column(String(50), default="MEDIUM")  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    evidence_type = Column(String(50), default="SOURCE_VERIFIED")  # SOURCE_VERIFIED, AI_INFERENCE, AI_RECOMMENDATION
    tags = Column(String(255), default="")
    domain = Column(String(100), default="General", index=True)
    supersedes_id = Column(Integer, nullable=True)
    superseded_by_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    audit_logs = relationship("DecisionAuditLog", back_populates="decision", cascade="all, delete-orphan")


class DecisionAuditLog(Base):
    __tablename__ = "decision_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # CREATED, UPDATED, SUPERSEDED, REVERTED, DISCUSS_REQUESTED, STATUS_CHANGE
    actor = Column(String(100), nullable=False)
    reason = Column(Text, nullable=True)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    metadata_json = Column(Text, default="{}")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    decision = relationship("Decision", back_populates="audit_logs")


class Promise(Base):
    __tablename__ = "promises"

    id = Column(Integer, primary_key=True, index=True)
    developer = Column(String(100), nullable=False, index=True)
    promise_text = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", index=True)  # PENDING, FULFILLED, VIOLATED, WAIVED, SUPERSEDED
    issue_id = Column(Integer, nullable=True, index=True)
    mr_id = Column(Integer, nullable=True, index=True)
    source_context = Column(String(255), default="Issue Discussion")
    evidence_found = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class IssueRecord(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    gitlab_issue_id = Column(Integer, unique=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    author = Column(String(100), nullable=False)
    status = Column(String(50), default="OPEN", index=True)
    domain = Column(String(100), default="Authentication")
    pre_mortem_json = Column(Text, default="{}")  # Risks, prevention, failure scenarios
    questions_json = Column(Text, default="[]")   # Generated questions
    developer_answers_json = Column(Text, default="[]") # Answers submitted
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class MergeRequestRecord(Base):
    __tablename__ = "merge_requests"

    id = Column(Integer, primary_key=True, index=True)
    gitlab_mr_id = Column(Integer, unique=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    author = Column(String(100), nullable=False)
    source_branch = Column(String(100), default="feature/branch")
    target_branch = Column(String(100), default="main")
    changed_files = Column(Text, default="[]")  # JSON list
    diff_content = Column(Text, default="")
    status = Column(String(50), default="OPEN", index=True) # OPEN, MERGED, CLOSED
    overall_risk = Column(String(50), default="MEDIUM")  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    review_results_json = Column(Text, default="{}") # 5-layer review outputs
    conflict_status = Column(String(50), default="NONE") # NONE, DETECTED, OVERRIDDEN, REVERTED, DISCUSSING
    conflict_resolution_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class TeamPattern(Base):
    __tablename__ = "team_patterns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    rule_type = Column(String(100), default="CODE_CONVENTION")
    expected_practice = Column(Text, nullable=False)
    forbidden_practice = Column(Text, nullable=False)
    severity = Column(String(50), default="HIGH")
    is_active = Column(Boolean, default=True)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=False)
    resolution = Column(Text, nullable=False)
    lessons_learned = Column(Text, nullable=False)
    related_decisions = Column(Text, default="")
    date = Column(String(50), default="2025-11-14")


class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, nullable=True)
    mr_id = Column(Integer, nullable=True)
    topic = Column(String(255), nullable=False)
    requested_by = Column(String(100), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN") # OPEN, RESOLVED
    comments_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CommitLedgerEntry(Base):
    __tablename__ = "commit_ledger"

    id = Column(Integer, primary_key=True, index=True)
    commit_sha = Column(String(50), nullable=False, index=True)
    author = Column(String(100), nullable=False)
    message = Column(String(255), nullable=False)
    changed_files = Column(Text, default="[]")
    affected_domains = Column(Text, default="[]")
    estimated_risk = Column(String(50), default="LOW")
    mr_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
