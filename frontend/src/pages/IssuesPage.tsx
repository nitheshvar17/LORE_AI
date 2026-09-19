import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListTodo,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Brain,
  Search,
  Plus
} from 'lucide-react';
import { api, IssueItem } from '../services/api';

export const IssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await api.getIssues();
      setIssues(data);
    } catch (err) {
      console.error('Failed to load issues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const filteredIssues = issues.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              GitLab Issues & Pre-Mortem Risk Analysis
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            LORE analyzes incoming issues against historical decisions, generates pre-mortems, and captures developer promises.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="lore-card p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search issues by title or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Issues Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading issues...
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="lore-card p-12 text-center text-slate-400 text-sm">
          No issues found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => navigate(`/issues/${issue.gitlab_issue_id}`)}
              className="lore-card lore-card-hover p-6 cursor-pointer space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-400">
                      Issue #{issue.gitlab_issue_id}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {issue.domain}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {issue.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight">
                  {issue.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {issue.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Author:</span>
                  <span className="text-slate-300 font-medium">{issue.author}</span>
                </div>

                <div className="flex items-center gap-1.5 text-blue-400 font-medium group">
                  <span>Open Pre-Mortem & Q&A</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
