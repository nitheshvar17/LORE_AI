import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitPullRequest,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Brain,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api, MergeRequestItem } from '../services/api';

export const MergeRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [mrs, setMrs] = useState<MergeRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMRs = async () => {
    try {
      setLoading(true);
      const data = await api.getMergeRequests();
      setMrs(data);
    } catch (err) {
      console.error('Failed to load merge requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMRs();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              GitLab Merge Request Reviews
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Memory-aware 5-layer inspections detecting architectural conflicts, broken promises, security issues, and pattern violations.
          </p>
        </div>

        <button
          onClick={loadMRs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh MRs</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading merge request reviews...
        </div>
      ) : mrs.length === 0 ? (
        <div className="lore-card p-12 text-center text-slate-400 text-sm">
          No merge requests available.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {mrs.map((mr) => (
            <div
              key={mr.id}
              onClick={() => navigate(`/mrs/${mr.gitlab_mr_id}`)}
              className={`lore-card lore-card-hover p-6 cursor-pointer border space-y-4 ${
                mr.conflict_status === 'DETECTED'
                  ? 'border-rose-500/40 bg-rose-500/5'
                  : mr.conflict_status === 'OVERRIDDEN'
                  ? 'border-purple-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-400">
                      MR #{mr.gitlab_mr_id}
                    </span>

                    {/* Overall Risk Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        mr.overall_risk === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : mr.overall_risk === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {mr.overall_risk} RISK
                    </span>

                    {/* Conflict Badge */}
                    {mr.conflict_status === 'DETECTED' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        ⚠️ Conflict Detected
                      </span>
                    )}

                    {mr.conflict_status === 'OVERRIDDEN' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        ⚡ Decision Overridden
                      </span>
                    )}

                    {mr.conflict_status === 'REVERTED' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Reverted
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-mono">
                      {mr.source_branch} → {mr.target_branch}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {mr.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {mr.description}
                  </p>
                </div>

                <div className="text-right text-xs text-slate-400 space-y-1">
                  <div>
                    Author: <span className="text-slate-200 font-medium">{mr.author}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-400 font-semibold justify-end pt-2">
                    <span>Inspect 5-Layer Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Changed files chips */}
              {mr.changed_files && mr.changed_files.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
                  <span className="text-slate-500">Changed:</span>
                  {mr.changed_files.map((file, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
                    >
                      {file}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
