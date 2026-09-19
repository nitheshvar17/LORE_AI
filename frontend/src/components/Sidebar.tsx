import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Brain,
  LayoutDashboard,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  MessageSquareText,
  Network,
  Cpu,
  Settings,
  ShieldCheck,
  ListTodo
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/memory', label: 'Memory Ledger', icon: Brain, badge: 'Core' },
    { to: '/issues', label: 'Issues & Pre-Mortem', icon: ListTodo },
    { to: '/promises', label: 'Promises Board', icon: CheckCircle2 },
    { to: '/mrs', label: 'MR Reviews', icon: GitPullRequest, alert: true },
    { to: '/risks', label: 'Risks & Incidents', icon: AlertTriangle },
    { to: '/onboarding', label: 'Developer Briefing', icon: BookOpen },
    { to: '/ask', label: 'Ask LORE', icon: MessageSquareText },
    { to: '/graph', label: 'Impact Graph', icon: Network },
    { to: '/simulator', label: 'GitLab Simulator', icon: Cpu, highlight: true },
  ];

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-slate-800/80 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 font-mono font-bold text-white text-lg">
            L
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-white text-base">LORE</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[130px]">
              Institutional Memory
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
          Memory & Reviews
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {item.badge}
                </span>
              )}
              {item.highlight && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Live
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / GitLab Integration Status */}
      <div className="p-3 border-t border-slate-800/80 bg-[#090d16]/40">
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/90 text-xs">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              GitLab Sync Active
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono truncate">
            lore-project/core
          </div>
        </div>
      </div>
    </aside>
  );
};
