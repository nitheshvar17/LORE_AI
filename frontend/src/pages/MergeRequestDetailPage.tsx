import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GitPullRequest,
  Brain,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Layers,
  ChevronLeft,
  RotateCcw,
  Undo2,
  MessageSquare,
  FileCode,
  Check,
  X,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertOctagon
} from 'lucide-react';
import { api, MergeRequestItem } from '../services/api';

export const MergeRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mr, setMr] = useState<MergeRequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'review' | 'diff'>('review');

  // Conflict Resolution Modal State
  const [resolutionAction, setResolutionAction] = useState<'OVERRIDE' | 'REVERT' | 'DISCUSS' | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [newDecisionText, setNewDecisionText] = useState('Store authentication tokens in client localStorage with mobile client compatibility.');
  const [discussTopic, setDiscussTopic] = useState('');
  const [discussReason, setDiscussReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolutionSuccess, setResolutionSuccess] = useState<any>(null);

  const loadMR = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getMergeRequestById(parseInt(id));
      setMr(data);
    } catch (err) {
      console.error('Failed to load MR detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMR();
  }, [id]);

  const handleResolveConflict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mr || !resolutionAction) return;
    setIsSubmitting(true);
    try {
      const res = await api.resolveConflict(mr.gitlab_mr_id, {
        action: resolutionAction,
        actor: mr.author || 'Alex Rivera',
        override_reason: overrideReason,
        new_decision_text: newDecisionText,
        target_decision_id: 17,
        discuss_topic: discussTopic || `Conflict Review: MR #${mr.gitlab_mr_id} Authentication Cookies`,
        discuss_reason: discussReason || 'Escalated for team discussion on mobile client compatibility.'
      });

      setResolutionSuccess(res);
      setResolutionAction(null);
      await loadMR();
    } catch (err) {
      console.error('Resolution failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading MR 5-layer review...</div>;
  }

  if (!mr) {
    return <div className="p-8 text-center text-slate-400 text-sm">Merge Request not found.</div>;
  }

  const review = mr.review_results;
  const layers = review?.layers;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/mrs')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to MR Reviews</span>
      </button>

      {/* MR Header Card */}
      <div className="lore-card p-6 space-y-3 border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-blue-400">
              MR #{mr.gitlab_mr_id}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                mr.overall_risk === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : mr.overall_risk === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              OVERALL RISK: {mr.overall_risk}
            </span>

            {mr.conflict_status === 'DETECTED' && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                ⚠️ Memory Conflict Detected
              </span>
            )}

            {mr.conflict_status === 'OVERRIDDEN' && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                ⚡ Memory Decision Overridden
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {mr.source_branch} → {mr.target_branch}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          {mr.title}
        </h1>

        <p className="text-xs text-slate-300">
          {mr.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
          <div>Author: <span className="text-slate-200 font-medium">{mr.author}</span></div>
          <div>Status: <span className="font-mono text-blue-400">{mr.status}</span></div>
          <div>Changed Files: <span className="font-mono text-slate-300">{mr.changed_files.length}</span></div>
        </div>
      </div>

      {/* Resolution Success Banner */}
      {mr.conflict_status === 'OVERRIDDEN' && (
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs space-y-2">
          <div className="font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-purple-400" />
            <span>Conflict Resolved via Decision Override</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Old Decision #17 (Authentication Token Storage) has been transitioned to <span className="line-through text-slate-400 font-mono font-semibold">SUPERSEDED</span> with an immutable audit log. A new active decision has been recorded in the Institutional Memory Ledger.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('review')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'review'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>LORE 5-Layer Review</span>
        </button>

        <button
          onClick={() => setActiveTab('diff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'diff'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Code Diff ({mr.changed_files.length} files)</span>
        </button>
      </div>

      {activeTab === 'review' ? (
        <div className="space-y-6">
          {/* CONFLICT RESOLUTION ACTION BAR (If conflict detected) */}
          {mr.conflict_status === 'DETECTED' && (
            <div className="lore-card p-6 border-rose-500/40 bg-rose-500/5 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <AlertOctagon className="w-5 h-5" />
                    <span>Action Required: Resolve Memory Conflict & Broken Promises</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    This Merge Request introduces changes that contradict confirmed team decisions. Choose how to proceed:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => setResolutionAction('OVERRIDE')}
                  className="p-3 rounded-xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-200 text-xs font-semibold transition-all text-left space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300 font-bold flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4" /> 1. Override Decision
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Provide reason to supersede the old decision and record new active memory.
                  </p>
                </button>

                <button
                  onClick={() => setResolutionAction('REVERT')}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold transition-all text-left space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Undo2 className="w-4 h-4" /> 2. Revert Change
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Resolve conflict by discarding conflicting code in MR. Old decision stays active.
                  </p>
                </button>

                <button
                  onClick={() => setResolutionAction('DISCUSS')}
                  className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 text-blue-200 text-xs font-semibold transition-all text-left space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-blue-300 font-bold flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" /> 3. Discuss With Team
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Escalate to architectural decision makers for team debate.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* 5-LAYER BREAKDOWN CARDS */}
          <div className="space-y-4">
            {/* LAYER 1: MEMORY CONFLICT */}
            <div
              className={`lore-card p-5 border space-y-3 ${
                !layers?.layer1_memory_conflict.passed
                  ? 'border-rose-500/40 bg-rose-500/5'
                  : 'border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">LAYER 1 — MEMORY CONFLICT</h3>
                    <p className="text-[11px] text-slate-400">Cross-checks MR against confirmed historical team decisions</p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                    !layers?.layer1_memory_conflict.passed
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {!layers?.layer1_memory_conflict.passed ? '⚠️ CONFLICT DETECTED' : '✅ PASSED'}
                </span>
              </div>

              {!layers?.layer1_memory_conflict.passed && layers?.layer1_memory_conflict.findings.map((f, i) => (
                <div key={i} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-rose-400">{f.title}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-400 font-semibold block mb-0.5">Previous Team Decision:</span>
                      <span className="text-emerald-400 font-mono">{f.rule}</span>
                      <div className="text-slate-500 text-[10px] mt-1">Source: {f.source}</div>
                    </div>

                    <div className="p-2.5 rounded bg-slate-950 border border-rose-500/30">
                      <span className="text-slate-400 font-semibold block mb-0.5">Current MR Implementation:</span>
                      <span className="text-rose-300 font-mono">{f.detail}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* LAYER 2: PROMISE CHECK */}
            <div
              className={`lore-card p-5 border space-y-3 ${
                !layers?.layer2_promise_check.passed
                  ? 'border-rose-500/40 bg-rose-500/5'
                  : 'border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">LAYER 2 — PROMISE CHECK</h3>
                    <p className="text-[11px] text-slate-400">Verifies developer commitments made during issue pre-mortem</p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                    !layers?.layer2_promise_check.passed
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {!layers?.layer2_promise_check.passed ? '❌ PROMISE VIOLATION' : '✅ FULFILLED'}
                </span>
              </div>

              {!layers?.layer2_promise_check.passed && layers?.layer2_promise_check.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-blue-400 font-bold">Promise #{f.promise_id} ({f.developer})</span>
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                      VIOLATED
                    </span>
                  </div>
                  <div className="text-slate-200 font-medium">"{f.promise_text}"</div>
                  <div className="text-[11px] text-rose-300 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 font-sans">Evidence: </span>{f.evidence}
                  </div>
                </div>
              ))}
            </div>

            {/* LAYER 3: SECURITY CHECK */}
            <div
              className={`lore-card p-5 border space-y-3 ${
                !layers?.layer3_security_check.passed
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">LAYER 3 — SECURITY CHECK</h3>
                    <p className="text-[11px] text-slate-400">Pre-LLM redactor & insecure storage detection</p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                    !layers?.layer3_security_check.passed
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {!layers?.layer3_security_check.passed ? '⚠️ POTENTIAL FINDINGS' : '✅ CLEAN'}
                </span>
              </div>

              {!layers?.layer3_security_check.passed && layers?.layer3_security_check.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">{f.category}</span>
                    <span className="text-[10px] font-mono text-slate-400">{f.file}:{f.line}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{f.message}</p>
                </div>
              ))}
            </div>

            {/* LAYER 4: CODE IMPACT */}
            <div className="lore-card p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">LAYER 4 — CODE IMPACT (BLAST RADIUS)</h3>
                    <p className="text-[11px] text-slate-400">Estimates architectural blast radius and affected domains</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  BLAST RADIUS: {layers?.layer4_code_impact.blast_radius}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400">Potentially Affected Modules:</span>
                  {layers?.layer4_code_impact.affected_modules.map((mod, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono text-[11px]">
                      {mod}
                    </span>
                  ))}
                </div>
                <p className="text-slate-400 text-[11px] italic">
                  {layers?.layer4_code_impact.potential_impact}
                </p>
              </div>
            </div>

            {/* LAYER 5: TEAM PATTERN */}
            <div
              className={`lore-card p-5 border space-y-3 ${
                !layers?.layer5_team_pattern.passed
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">LAYER 5 — TEAM PATTERNS</h3>
                    <p className="text-[11px] text-slate-400">Enforces team conventions (e.g. AppError exceptions)</p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                    !layers?.layer5_team_pattern.passed
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {!layers?.layer5_team_pattern.passed ? '⚠️ PATTERN VIOLATION' : '✅ PASSED'}
                </span>
              </div>

              {!layers?.layer5_team_pattern.passed && layers?.layer5_team_pattern.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-white">{f.pattern_name}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-slate-950 border border-emerald-500/30 text-emerald-300">
                      <span className="text-slate-500 block font-sans">Expected Practice:</span>
                      {f.expected}
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-rose-500/30 text-rose-300">
                      <span className="text-slate-500 block font-sans">Found in Diff:</span>
                      {f.found}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* CODE DIFF TAB */
        <div className="lore-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span>GitLab MR Diff</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Simulated Git Patch</span>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono overflow-x-auto text-slate-300 leading-relaxed">
            {mr.diff_content || 'No diff content available.'}
          </pre>
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {resolutionAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="lore-card max-w-lg w-full p-6 space-y-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {resolutionAction === 'OVERRIDE' && <RotateCcw className="w-4 h-4 text-purple-400" />}
                {resolutionAction === 'REVERT' && <Undo2 className="w-4 h-4 text-slate-400" />}
                {resolutionAction === 'DISCUSS' && <MessageSquare className="w-4 h-4 text-blue-400" />}
                <span>
                  {resolutionAction === 'OVERRIDE' && '1. Override Conflicting Decision'}
                  {resolutionAction === 'REVERT' && '2. Revert Conflicting Changes'}
                  {resolutionAction === 'DISCUSS' && '3. Escalate for Human Review'}
                </span>
              </h2>
              <button
                onClick={() => setResolutionAction(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveConflict} className="space-y-4 text-xs">
              {resolutionAction === 'OVERRIDE' && (
                <>
                  <p className="text-slate-300 text-xs">
                    You are overriding <span className="text-purple-400 font-bold font-mono">Decision #17 (Authentication Token Storage)</span>.
                    This will mark the old decision as <span className="text-slate-400 line-through">SUPERSEDED</span> and write your new decision to the ledger.
                  </p>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      New Decision Specification *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={newDecisionText}
                      onChange={(e) => setNewDecisionText(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Why are you overriding this decision? (Auditable Justification) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Mobile web client architecture requires authorization header support..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              {resolutionAction === 'REVERT' && (
                <p className="text-slate-300 text-xs">
                  Confirm reverting the conflicting changes in MR #{mr.gitlab_mr_id}. The existing active decision will remain strictly enforced.
                </p>
              )}

              {resolutionAction === 'DISCUSS' && (
                <>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Discussion Topic</label>
                    <input
                      type="text"
                      placeholder="e.g. Discuss Cookie vs localStorage for Mobile Web"
                      value={discussTopic}
                      onChange={(e) => setDiscussTopic(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Escalation Reason</label>
                    <textarea
                      rows={3}
                      placeholder="Explain why decision makers should review this trade-off..."
                      value={discussReason}
                      onChange={(e) => setDiscussReason(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolutionAction(null)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? 'Submitting Resolution...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
