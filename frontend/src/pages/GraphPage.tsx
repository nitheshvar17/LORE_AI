import React, { useState } from 'react';
import { Network, Layers, ShieldCheck, AlertTriangle, FileCode } from 'lucide-react';

export const GraphPage: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState<string>('Authentication');

  const modules = [
    {
      domain: 'Authentication',
      files: ['src/auth/session.py', 'src/auth/oauth.py', 'src/auth/cookies.py'],
      decisions: ['Decision #17 (HTTP-only cookies)', 'Decision #22 (OAuth state nonce)'],
      blast_radius: 'HIGH',
      dependents: ['Session Management', 'User Service', 'API Middleware']
    },
    {
      domain: 'Database',
      files: ['src/db/session.py', 'src/db/models.py', 'alembic/versions/'],
      decisions: ['Decision #12 (PostgreSQL primary engine)'],
      blast_radius: 'HIGH',
      dependents: ['User Analytics', 'Repository Layer', 'Migration Pipeline']
    },
    {
      domain: 'API & Middleware',
      files: ['src/core/exceptions.py', 'src/middleware/error_handler.py'],
      decisions: ['Decision #35 (AppError standard)'],
      blast_radius: 'MEDIUM',
      dependents: ['All REST Routes', 'Frontend Error Boundaries', 'Sentry Logger']
    },
    {
      domain: 'Security & Secrets',
      files: ['src/core/config.py', '.env.example'],
      decisions: ['Decision #8 (Zero hardcoded secrets)'],
      blast_radius: 'CRITICAL',
      dependents: ['All Third-party Clients', 'CI/CD Pipeline', 'Vault Engine']
    }
  ];

  const current = modules.find((m) => m.domain === selectedDomain) || modules[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Network className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Architectural Dependency & Impact Graph
          </h1>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Visual blast radius and decision dependencies across project modules and changed files.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Picker */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Architecture Domains
          </h2>

          <div className="space-y-2">
            {modules.map((m) => (
              <div
                key={m.domain}
                onClick={() => setSelectedDomain(m.domain)}
                className={`lore-card p-4 cursor-pointer transition-all ${
                  selectedDomain === m.domain
                    ? 'border-blue-500/60 bg-blue-500/10'
                    : 'hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{m.domain}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    m.blast_radius === 'CRITICAL' ? 'text-rose-400 bg-rose-500/10' :
                    m.blast_radius === 'HIGH' ? 'text-amber-400 bg-amber-500/10' :
                    'text-blue-400 bg-blue-500/10'
                  }`}>
                    {m.blast_radius} IMPACT
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {m.files.length} core files • {m.decisions.length} active decisions
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Graph Card */}
        <div className="lg:col-span-2 lore-card p-6 space-y-5 border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">{current.domain} Module Blast Radius</h2>
              <p className="text-xs text-slate-400">Inspecting impact propagation when code in this domain changes</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-blue-400 font-mono">
              Blast Radius: {current.blast_radius}
            </span>
          </div>

          {/* Connected Graph Map */}
          <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
            {/* Core Domain Node */}
            <div className="p-4 rounded-xl bg-blue-600/20 border-2 border-blue-500 text-center w-48 shadow-lg shadow-blue-500/20">
              <div className="text-blue-400 text-[10px] font-semibold">CORE DOMAIN</div>
              <div className="text-white font-bold text-sm mt-1">{current.domain}</div>
            </div>

            <div className="text-blue-400 text-lg font-bold">──▶</div>

            {/* Files changed */}
            <div className="space-y-2 w-56">
              <div className="text-slate-500 text-[10px] font-sans font-semibold">CONTAINED SOURCE FILES</div>
              {current.files.map((f, i) => (
                <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px] truncate">
                  {f}
                </div>
              ))}
            </div>

            <div className="text-blue-400 text-lg font-bold">──▶</div>

            {/* Affected downstream services */}
            <div className="space-y-2 w-56">
              <div className="text-slate-500 text-[10px] font-sans font-semibold">POTENTIALLY AFFECTED MODULES</div>
              {current.dependents.map((dep, i) => (
                <div key={i} className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                  {dep}
                </div>
              ))}
            </div>
          </div>

          {/* Governing Institutional Decisions */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Governing Institutional Decisions in this Domain</span>
            </h3>

            <div className="space-y-2">
              {current.decisions.map((dec, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center justify-between">
                  <span>{dec}</span>
                  <span className="badge-active">ACTIVE</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
