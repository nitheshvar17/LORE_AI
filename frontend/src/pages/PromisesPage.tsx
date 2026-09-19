import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertOctagon,
  Clock,
  Filter,
  User,
  GitPullRequest,
  Check,
  Ban,
  Search,
  ExternalLink
} from 'lucide-react';
import { api, PromiseItem } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const PromisesPage: React.FC = () => {
  const navigate = useNavigate();
  const [promises, setPromises] = useState<PromiseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadPromises = async () => {
    try {
      setLoading(true);
      const data = await api.getPromises({
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setPromises(data);
    } catch (err) {
      console.error('Failed to load promises', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromises();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.updatePromise(id, { status: newStatus });
      await loadPromises();
    } catch (err) {
      console.error('Failed to update promise', err);
    }
  };

  const filteredPromises = promises.filter((p) =>
    p.promise_text.toLowerCase().includes(search.toLowerCase()) ||
    p.developer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Developer Promises & Commitments Board
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Explicit architectural promises captured during pre-mortems and verified during MR reviews.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="lore-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search promises by text or developer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="FULFILLED">FULFILLED</option>
            <option value="VIOLATED">VIOLATED</option>
            <option value="WAIVED">WAIVED</option>
          </select>
        </div>
      </div>

      {/* Promises List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading promises...
        </div>
      ) : filteredPromises.length === 0 ? (
        <div className="lore-card p-12 text-center text-slate-400 text-sm">
          No promises found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPromises.map((p) => (
            <div
              key={p.id}
              className={`lore-card p-5 border space-y-3 ${
                p.status === 'VIOLATED'
                  ? 'border-rose-500/40 bg-rose-500/5'
                  : p.status === 'FULFILLED'
                  ? 'border-emerald-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-blue-400">
                    Promise #{p.id}
                  </span>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                      p.status === 'VIOLATED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : p.status === 'FULFILLED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : p.status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {p.status}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.developer}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  Source: {p.source_context}
                </div>
              </div>

              {/* Promise statement */}
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-sm font-medium text-white">
                "{p.promise_text}"
              </div>

              {/* Evidence if violated or fulfilled */}
              {p.evidence_found && (
                <div className="text-xs p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-slate-300 font-mono">
                  <span className="text-slate-500 font-semibold">Evidence Detected: </span>
                  <span className={p.status === 'VIOLATED' ? 'text-rose-400' : 'text-emerald-400'}>
                    {p.evidence_found}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                {p.mr_id && (
                  <button
                    onClick={() => navigate(`/mrs/${p.mr_id}`)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    <span>View in MR #{p.mr_id} Review</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  {p.status !== 'FULFILLED' && (
                    <button
                      onClick={() => handleUpdateStatus(p.id, 'FULFILLED')}
                      className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors flex items-center gap-1 font-medium"
                    >
                      <Check className="w-3 h-3" /> Fulfill
                    </button>
                  )}
                  {p.status !== 'WAIVED' && (
                    <button
                      onClick={() => handleUpdateStatus(p.id, 'WAIVED')}
                      className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 font-medium"
                    >
                      <Ban className="w-3 h-3" /> Waive
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
