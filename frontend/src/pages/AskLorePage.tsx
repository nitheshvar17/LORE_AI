import React, { useState } from 'react';
import {
  MessageSquareText,
  Search,
  Brain,
  ShieldCheck,
  AlertTriangle,
  History,
  Send,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export const AskLorePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const suggestedQueries = [
    'What decisions govern authentication?',
    'Why do we use PostgreSQL instead of MongoDB?',
    'What error handling conventions exist?',
    'What lessons were learned from past security incidents?',
    'How are session tokens stored?'
  ];

  const handleSearch = async (qText?: string) => {
    const q = qText || query;
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await api.askLore(q);
      setResult(res);
    } catch (e) {
      console.error('Ask LORE error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Ask LORE — Institutional Memory Intelligence
          </h1>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Query project memory with source-cited historical decisions, active architectural policies, and conflict warnings.
        </p>
      </div>

      {/* Query Search Input */}
      <div className="lore-card p-4 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ask anything about architecture, past decisions, error standards, or incidents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Searching Memory...' : 'Ask LORE'}</span>
          </button>
        </form>

        {/* Suggested Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-500 text-[11px]">Suggested questions:</span>
          {suggestedQueries.map((sq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(sq);
                handleSearch(sq);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors text-[11px]"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {loading ? (
        <div className="lore-card p-12 text-center text-slate-400 text-sm space-y-2">
          <Sparkles className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
          <p>Querying institutional memory ledger & citations...</p>
        </div>
      ) : result ? (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="lore-card p-6 border-blue-500/30 bg-blue-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-blue-400 font-bold">
                LORE MEMORY RESPONSE
              </span>
              <span className="badge-source flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                {result.evidence_type}
              </span>
            </div>

            <p className="text-sm text-white font-medium">
              {result.answer_summary}
            </p>
          </div>

          {/* Historical Conflict Alert (If active vs superseded present) */}
          {result.has_historical_conflict && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Historical Evolution & Superseded Decision Detected</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Institutional memory shows this domain evolved over time. LORE prioritizes the confirmed <span className="font-semibold text-emerald-400">ACTIVE</span> policy over older superseded patterns.
              </p>
            </div>
          )}

          {/* Active Decisions */}
          {result.active_decisions && result.active_decisions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-400" />
                <span>Confirmed Active Decisions ({result.active_decisions.length})</span>
              </h3>

              <div className="space-y-3">
                {result.active_decisions.map((dec: any) => (
                  <div key={dec.id} className="lore-card p-5 space-y-2.5 border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-400">
                          Decision #{dec.id}
                        </span>
                        <span className="badge-active">ACTIVE</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Source: {dec.source}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{dec.title}</h4>

                    <div className="p-2.5 rounded bg-slate-900 font-mono text-xs text-blue-300 border border-slate-800">
                      {dec.decision}
                    </div>

                    <p className="text-xs text-slate-400">
                      <span className="text-slate-300 font-semibold">Rationale: </span>
                      {dec.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Superseded Decisions */}
          {result.superseded_decisions && result.superseded_decisions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <span>Superseded Historical Information (Do Not Use)</span>
              </h3>

              <div className="space-y-2">
                {result.superseded_decisions.map((sd: any) => (
                  <div key={sd.id} className="p-4 rounded-xl bg-slate-900/40 border border-purple-500/20 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-300 line-through">
                        Decision #{sd.id}: {sd.title}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{sd.decision}</div>
                    </div>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 shrink-0 ml-4">
                      {sd.superseded_by}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
