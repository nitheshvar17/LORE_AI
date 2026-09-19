import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  GitPullRequest,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Flame,
  FileCode2,
  Clock
} from 'lucide-react';
import { api, StatsData } from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningDemo, setRunningDemo] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRunFullDemo = async () => {
    try {
      setRunningDemo(true);
      await api.runAuthScenario();
      navigate('/mrs/52');
    } catch (err) {
      console.error('Demo run failed', err);
    } finally {
      setRunningDemo(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1322] via-[#11192e] to-[#0d1322] border border-slate-800 p-7 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-32 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                AI Institutional Memory for GitLab
              </span>
              <span className="text-xs text-slate-400 font-mono">GitLab CI/CD Integration</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              LORE Engineering Memory Engine
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              <span className="text-blue-400 font-semibold">"LORE remembers what the team learned yesterday</span> so developers don't accidentally repeat yesterday's mistakes tomorrow."
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunFullDemo}
              disabled={runningDemo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${runningDemo ? 'animate-spin' : ''}`} />
              <span>{runningDemo ? 'Simulating Review...' : 'Run Hackathon Demo Flow'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/onboarding')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-medium text-sm transition-all"
            >
              <span>Developer Briefing</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Decisions */}
        <div
          onClick={() => navigate('/memory')}
          className="lore-card lore-card-hover p-5 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Decisions</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">
              {stats?.metrics.decisions ?? 6}
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              {stats?.metrics.active_decisions ?? 5} active
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Decision Ledger</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Metric 2: Active Risks */}
        <div
          onClick={() => navigate('/risks')}
          className="lore-card lore-card-hover p-5 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Risks</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">
              {stats?.metrics.active_risks ?? 4}
            </span>
            <span className="text-xs text-amber-400 font-medium">High / Critical</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Pre-mortem alerts</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Metric 3: Pending Promises */}
        <div
          onClick={() => navigate('/promises')}
          className="lore-card lore-card-hover p-5 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Promises</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">
              {stats?.metrics.pending_promises ?? 1}
            </span>
            <span className="text-xs text-rose-400 font-medium">
              {stats?.metrics.violated_promises ?? 1} violated
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Developer commitments</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Metric 4: Security Findings */}
        <div
          onClick={() => navigate('/mrs/52')}
          className="lore-card lore-card-hover p-5 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Security Findings</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">
              {stats?.metrics.security_findings ?? 3}
            </span>
            <span className="text-xs text-rose-400 font-medium">Pre-LLM scanned</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Review findings</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Activity & Hackathon Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Recent Activity & Memory Review Feed</h2>
            </div>
            <button
              onClick={loadStats}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          <div className="space-y-3">
            {stats?.recent_activity.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(item.link)}
                className="lore-card lore-card-hover p-4 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      item.badge_color === 'red'
                        ? 'bg-rose-500 shadow-rose-500/50 shadow-sm animate-pulse'
                        : item.badge_color === 'orange'
                        ? 'bg-amber-500 shadow-amber-500/50 shadow-sm'
                        : item.badge_color === 'yellow'
                        ? 'bg-yellow-400 shadow-yellow-400/50 shadow-sm'
                        : 'bg-emerald-400 shadow-emerald-400/50 shadow-sm'
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.status_text}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>{item.timestamp}</span>
                  <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 group-hover:border-blue-500/40 transition-colors flex items-center gap-1">
                    <span>View details</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Institutional Memory Loop & Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Continuous Memory Loop</h2>
          </div>

          <div className="lore-card p-5 space-y-4">
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Past Decision recorded (Decision #17: Secure Cookies)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Issue #103 created → Pre-Mortem generates risks</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">3</span>
                <span>Developer makes Promise #27 (Secure Cookies)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-rose-500/30 bg-rose-500/5 flex items-center gap-2 text-rose-300">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[10px]">4</span>
                <span>MR #52 review catches localStorage conflict!</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-2 text-emerald-300">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">5</span>
                <span>Override/Revert updates Institutional Memory</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/mrs/52')}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Inspect Live MR #52 Conflict</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
