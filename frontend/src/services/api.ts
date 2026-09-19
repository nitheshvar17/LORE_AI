const API_BASE = '/api';

export interface Decision {
  id: number;
  title: string;
  decision: string;
  reason: string;
  author: string;
  status: 'ACTIVE' | 'PROPOSED' | 'SUPERSEDED' | 'REJECTED' | 'ARCHIVED';
  source_type: string;
  source_ref: string;
  related_files: string[];
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  evidence_type: 'SOURCE_VERIFIED' | 'AI_INFERENCE' | 'AI_RECOMMENDATION';
  tags: string;
  domain: string;
  supersedes_id?: number | null;
  superseded_by_id?: number | null;
  created_at?: string;
  updated_at?: string;
  audit_logs?: Array<{
    id: number;
    action: string;
    actor: string;
    reason: string;
    old_status?: string;
    new_status?: string;
    timestamp: string;
  }>;
}

export interface PromiseItem {
  id: number;
  developer: string;
  promise_text: string;
  status: 'PENDING' | 'FULFILLED' | 'VIOLATED' | 'WAIVED' | 'SUPERSEDED';
  issue_id?: number;
  mr_id?: number;
  source_context?: string;
  evidence_found?: string | null;
  created_at?: string;
}

export interface PreMortemRisk {
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  prevention: string;
}

export interface IssueItem {
  id: number;
  gitlab_issue_id: number;
  title: string;
  description: string;
  author: string;
  status: string;
  domain: string;
  risks_count?: number;
  pre_mortem?: {
    risks: PreMortemRisk[];
    questions: string[];
  };
  questions?: string[];
  developer_answers?: Array<{
    question: string;
    answer: string;
    extracted_promise?: string;
  }>;
  created_at?: string;
}

export interface MergeRequestItem {
  id: number;
  gitlab_mr_id: number;
  title: string;
  description: string;
  author: string;
  source_branch: string;
  target_branch: string;
  changed_files: string[];
  diff_content?: string;
  status: 'OPEN' | 'MERGED' | 'CLOSED';
  overall_risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  conflict_status: 'NONE' | 'DETECTED' | 'OVERRIDDEN' | 'REVERTED' | 'DISCUSSING';
  has_review?: boolean;
  review_results?: {
    overall_risk: string;
    summary: string;
    layers: {
      layer1_memory_conflict: {
        passed: boolean;
        status: string;
        findings: Array<{
          severity: string;
          title: string;
          detail: string;
          historical_decision_id: number;
          historical_decision_title: string;
          rule: string;
          source?: string;
        }>;
      };
      layer2_promise_check: {
        passed: boolean;
        status: string;
        findings: Array<{
          promise_id: number;
          developer: string;
          promise_text: string;
          status: string;
          evidence: string;
        }>;
      };
      layer3_security_check: {
        passed: boolean;
        status: string;
        findings: Array<{
          severity: string;
          category: string;
          message: string;
          file?: string;
          line?: number;
          prevention?: string;
        }>;
      };
      layer4_code_impact: {
        passed: boolean;
        status: string;
        affected_modules: string[];
        blast_radius: string;
        potential_impact: string;
      };
      layer5_team_pattern: {
        passed: boolean;
        status: string;
        findings: Array<{
          pattern_name: string;
          expected: string;
          found: string;
          file?: string;
          line?: number;
        }>;
      };
    };
  };
  conflict_resolution?: {
    action: string;
    resolved_by: string;
    resolved_at: string;
    notes: string;
    override_details?: any;
    discussion_id?: number;
  };
  created_at?: string;
}

export interface StatsData {
  metrics: {
    decisions: number;
    active_decisions: number;
    active_risks: number;
    pending_promises: number;
    violated_promises: number;
    security_findings: number;
  };
  recent_activity: Array<{
    id: number;
    type: string;
    title: string;
    status_text: string;
    badge_color: string;
    severity: string;
    timestamp: string;
    link: string;
  }>;
}

export const api = {
  async getStats(): Promise<StatsData> {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },

  async getDecisions(params?: { q?: string; domain?: string; status?: string; evidence_type?: string }): Promise<Decision[]> {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set('q', params.q);
    if (params?.domain) searchParams.set('domain', params.domain);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.evidence_type) searchParams.set('evidence_type', params.evidence_type);
    
    const res = await fetch(`${API_BASE}/decisions?${searchParams.toString()}`);
    return res.json();
  },

  async getDecisionById(id: number): Promise<Decision> {
    const res = await fetch(`${API_BASE}/decisions/${id}`);
    return res.json();
  },

  async createDecision(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async overrideDecision(id: number, payload: {
    override_reason: string;
    new_title?: string;
    new_decision: string;
    actor?: string;
    source_mr_ref?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/decisions/${id}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async transitionDecision(id: number, payload: { new_status: string; actor?: string; reason?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/decisions/${id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getIssues(): Promise<IssueItem[]> {
    const res = await fetch(`${API_BASE}/issues`);
    return res.json();
  },

  async getIssueById(id: number): Promise<IssueItem> {
    const res = await fetch(`${API_BASE}/issues/${id}`);
    return res.json();
  },

  async createIssue(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async analyzeIssue(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/issues/${id}/analyze`, { method: 'POST' });
    return res.json();
  },

  async answerIssueQuestions(id: number, payload: { developer: string; answers: Array<{ question: string; answer: string }> }): Promise<any> {
    const res = await fetch(`${API_BASE}/issues/${id}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getPromises(params?: { status?: string; developer?: string }): Promise<PromiseItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.developer) searchParams.set('developer', params.developer);
    const res = await fetch(`${API_BASE}/promises?${searchParams.toString()}`);
    return res.json();
  },

  async updatePromise(id: number, payload: { status: string; evidence?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/promises/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getMergeRequests(): Promise<MergeRequestItem[]> {
    const res = await fetch(`${API_BASE}/merge-requests`);
    return res.json();
  },

  async getMergeRequestById(id: number): Promise<MergeRequestItem> {
    const res = await fetch(`${API_BASE}/merge-requests/${id}`);
    return res.json();
  },

  async createMergeRequest(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE}/merge-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async reviewMergeRequest(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/merge-requests/${id}/review`, { method: 'POST' });
    return res.json();
  },

  async resolveConflict(id: number, payload: {
    action: 'OVERRIDE' | 'REVERT' | 'DISCUSS';
    actor?: string;
    override_reason?: string;
    new_title?: string;
    new_decision_text?: string;
    target_decision_id?: number;
    discuss_topic?: string;
    discuss_reason?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/merge-requests/${id}/resolve-conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getOnboardingBriefing(): Promise<any> {
    const res = await fetch(`${API_BASE}/onboarding/briefing`);
    return res.json();
  },

  async askLore(query: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    return res.json();
  },

  async runAuthScenario(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulator/run-scenario/auth-conflict`, { method: 'POST' });
    return res.json();
  },

  async runSecretScanScenario(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulator/run-scenario/secret-scan`, { method: 'POST' });
    return res.json();
  },

  async resetSeed(): Promise<any> {
    const res = await fetch(`${API_BASE}/seed/reset`, { method: 'POST' });
    return res.json();
  }
};
