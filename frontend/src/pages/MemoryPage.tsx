import React, { useEffect, useState } from 'react';
import {
  Brain,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  History,
  FileCode,
  Tag,
  AlertCircle,
  X,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';
import { api, Decision } from '../services/api';

export const MemoryPage: React.FC = () => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [evidenceFilter, setEvidenceFilter] = useState('All');
  
  // Selected decision for audit modal
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [newDecisionText, setNewDecisionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New decision form state
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newDomain, setNewDomain] = useState('Authentication');
  const [newSourceRef, setNewSourceRef] = useState('MR #100');

  const loadDecisions = async () => {
    try {
      setLoading(true);
      const data = await api.getDecisions({
        q: searchQuery || undefined,
        domain: domainFilter !== 'All' ? domainFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        evidence_type: evidenceFilter !== 'All' ? evidenceFilter : undefined
      });
      setDecisions(data);
    } catch (err) {
      console.error('Failed to load decisions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadDecisions();
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery, domainFilter, statusFilter, evidenceFilter]);

  const handleOpenDetail = async (id: number) => {
    try {
      const detail = await api.getDecisionById(id);
      setSelectedDecision(detail);
    } catch (err) {
      console.error('Failed to get decision detail', err);
    }
  };

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newText || !newReason) return;
    setIsSubmitting(true);
    try {
      await api.createDecision({
        title: newTitle,
        decision: newText,
        reason: newReason,
        domain: newDomain,
        source_ref: newSourceRef,
        author: 'Alex Rivera',
        status: 'ACTIVE',
        evidence_type: 'SOURCE_VERIFIED'
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewText('');
      setNewReason('');
      await loadDecisions();
    } catch (err) {
      console.error('Failed to create decision', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDecision || !overrideReason || !newDecisionText) return;
    setIsSubmitting(true);
    try {
      await api.overrideDecision(selectedDecision.id, {
        override_reason: overrideReason,
        new_decision: newDecisionText,
        new_title: `Updated: ${selectedDecision.title}`,
        actor: 'Alex Rivera',
        source_mr_ref: 'MR #52'
      });
      setShowOverrideModal(false);
      setSelectedDecision(null);
      setOverrideReason('');
      setNewDecisionText('');
      await loadDecisions();
    } catch (err) {
      console.error('Override failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Institutional Memory Ledger
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Confirmed team architectural decisions, evidence sources, and immutable lifecycle history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Decision</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="lore-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search decisions by title, keyword, rule, tags, files, or source MR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Domain Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-400 hidden lg:inline">Domain:</span>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Domains</option>
              <option value="Authentication">Authentication</option>
              <option value="Database">Database</option>
              <option value="API">API</option>
              <option value="Security">Security</option>
              <option value="General">General</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUPERSEDED">SUPERSEDED</option>
              <option value="PROPOSED">PROPOSED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>

            {/* Evidence Filter */}
            <select
              value={evidenceFilter}
              onChange={(e) => setEvidenceFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Evidence</option>
              <option value="SOURCE_VERIFIED">SOURCE VERIFIED</option>
              <option value="AI_INFERENCE">AI INFERENCE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Decisions List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading institutional memory records...
        </div>
      ) : decisions.length === 0 ? (
        <div className="lore-card p-12 text-center space-y-3">
          <Brain className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No decisions matched your search</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your query or filter selections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {decisions.map((dec) => (
            <div
              key={dec.id}
              onClick={() => handleOpenDetail(dec.id)}
              className={`lore-card lore-card-hover p-6 cursor-pointer border ${
                dec.status === 'SUPERSEDED'
                  ? 'border-purple-500/20 opacity-75'
                  : 'border-slate-800/80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-400">
                      Decision #{dec.id}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        dec.status === 'ACTIVE'
                          ? 'badge-active'
                          : dec.status === 'SUPERSEDED'
                          ? 'badge-superseded'
                          : 'badge-inference'
                      }`}
                    >
                      {dec.status}
                    </span>

                    {/* Evidence Verification Badge */}
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                        dec.evidence_type === 'SOURCE_VERIFIED'
                          ? 'badge-source'
                          : 'badge-inference'
                      }`}
                    >
                      {dec.evidence_type === 'SOURCE_VERIFIED' ? (
                        <ShieldCheck className="w-3 h-3 text-blue-400" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-400" />
                      )}
                      <span>{dec.evidence_type.replace('_', ' ')}</span>
                    </span>

                    {/* Domain Tag */}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {dec.domain}
                    </span>

                    {dec.supersedes_id && (
                      <span className="text-[10px] text-purple-400 font-mono">
                        (Supersedes #{dec.supersedes_id})
                      </span>
                    )}

                    {dec.superseded_by_id && (
                      <span className="text-[10px] text-purple-400 font-mono">
                        (Superseded by #{dec.superseded_by_id})
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {dec.title}
                  </h3>

                  {/* Decision Text */}
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/90 text-slate-200 text-xs font-mono leading-relaxed">
                    <span className="text-blue-400 font-bold block mb-1">Decision:</span>
                    {dec.decision}
                  </div>

                  {/* Reason */}
                  <div className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-slate-300 font-semibold">Reason: </span>
                    {dec.reason}
                  </div>

                  {/* Related files */}
                  {dec.related_files && dec.related_files.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <FileCode className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] text-slate-500">Related files:</span>
                      {dec.related_files.map((file, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                        >
                          {file}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Meta Column */}
                <div className="flex md:flex-col items-end justify-between md:justify-start gap-2 text-right text-xs text-slate-400">
                  <div className="space-y-1">
                    <div>
                      <span className="text-slate-500">Author: </span>
                      <span className="text-slate-300 font-medium">{dec.author}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Source: </span>
                      <span className="text-blue-400 font-mono font-medium">{dec.source_ref}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Risk: </span>
                      <span className={`font-semibold ${dec.risk_level === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`}>
                        {dec.risk_level}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium">
                    <span>Inspect Audit Log</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decision Detail & Audit Log Modal */}
      {selectedDecision && !showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="lore-card max-w-2xl w-full p-6 space-y-5 border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400">
                    Decision #{selectedDecision.id}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    selectedDecision.status === 'ACTIVE' ? 'badge-active' : 'badge-superseded'
                  }`}>
                    {selectedDecision.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {selectedDecision.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDecision(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-200">
                <span className="text-blue-400 font-bold block mb-1">Confirmed Decision:</span>
                {selectedDecision.decision}
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-slate-300">
                <span className="font-semibold block mb-1 text-slate-400">Architectural Rationale:</span>
                {selectedDecision.reason}
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400">
                <div>
                  <span className="text-slate-500">Author:</span> {selectedDecision.author}
                </div>
                <div>
                  <span className="text-slate-500">Source:</span> <span className="text-blue-400 font-mono">{selectedDecision.source_ref}</span>
                </div>
                <div>
                  <span className="text-slate-500">Domain:</span> {selectedDecision.domain}
                </div>
                <div>
                  <span className="text-slate-500">Evidence:</span> {selectedDecision.evidence_type}
                </div>
              </div>

              {/* Audit Trail Section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <History className="w-4 h-4 text-blue-400" />
                  <span>Immutable Audit Trail</span>
                </div>

                <div className="space-y-2">
                  {selectedDecision.audit_logs && selectedDecision.audit_logs.length > 0 ? (
                    selectedDecision.audit_logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/90 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-blue-400 font-bold">{log.action}</span>
                          <span className="text-slate-500">{log.timestamp}</span>
                        </div>
                        <div className="text-slate-300">
                          <span className="text-slate-500">By:</span> {log.actor} — {log.reason}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-[11px] italic">
                      Initial confirmation record from {selectedDecision.source_ref}.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowOverrideModal(true)}
                className="px-3.5 py-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 text-xs font-semibold transition-all"
              >
                Override & Supersede Decision
              </button>

              <button
                onClick={() => setSelectedDecision(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Decision Modal */}
      {showOverrideModal && selectedDecision && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="lore-card max-w-lg w-full p-6 space-y-4 border border-purple-500/40">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-400" />
                Override Decision #{selectedDecision.id}
              </h2>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Overriding will mark <span className="text-purple-400 font-bold font-mono">Decision #{selectedDecision.id}</span> as <span className="line-through text-slate-400 font-semibold">SUPERSEDED</span> and create a new <span className="text-emerald-400 font-semibold">ACTIVE</span> decision with your justification.
            </p>

            <form onSubmit={handleExecuteOverride} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  New Decision Specification *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Store tokens in secure authorization headers with mobile-client support..."
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
                  placeholder="Explain architectural context, new technical requirements, or trade-offs..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-500/20"
                >
                  {isSubmitting ? 'Recording Override...' : 'Submit Override & Supersede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Decision Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="lore-card max-w-lg w-full p-6 space-y-4 border border-blue-500/40">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Record Confirmed Decision
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Decision Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Session Expiration & Refresh Token Rotation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Domain</label>
                  <select
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Authentication">Authentication</option>
                    <option value="Database">Database</option>
                    <option value="API">API</option>
                    <option value="Security">Security</option>
                    <option value="Architecture">Architecture</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Source Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. MR #95"
                    value={newSourceRef}
                    onChange={(e) => setNewSourceRef(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Decision Specification *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Exact rule or standard that developers must adhere to..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Engineering Rationale (Why) *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Why was this chosen? What failure or security risk does it mitigate?"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? 'Saving...' : 'Record Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
