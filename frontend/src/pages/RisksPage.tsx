import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldCheck,
  History,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { api, Decision } from '../services/api';

export const RisksPage: React.FC = () => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getDecisions();
        setDecisions(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const highRiskDecisions = decisions.filter((d) => d.risk_level === 'CRITICAL' || d.risk_level === 'HIGH');

  const incidents = [
    {
      id: 12,
      title: "Production API Key Exposure in Commit History",
      description: "A developer committed a live third-party service credential in a test helper file during debugging.",
      root_cause: "Lack of pre-commit secret detection and hardcoded defaults in test suite.",
      resolution: "Rotated credentials immediately, scrubbed git history with BFG Repo-Cleaner, and instituted Decision #8.",
      lessons_learned: "Automated secret scanning before sending code to LLMs or repos is mandatory.",
      date: "2025-08-10",
      related_decision: "Decision #8"
    },
    {
      id: 18,
      title: "OAuth Redirect Hijack Simulation Incident",
      description: "Penetration testing identified missing validation on the redirect URI parameter during OAuth login.",
      root_cause: "OAuth provider state parameter was generated but never verified on callback.",
      resolution: "Instituted Decision #22 requiring strict server-side nonce verification.",
      lessons_learned: "Always validate state nonce and whitelist redirect URIs.",
      date: "2025-11-14",
      related_decision: "Decision #22"
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Architectural Risks & Historical Incidents
          </h1>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Historical post-mortems and high-risk architectural zones tracked by LORE institutional memory.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Historical Incidents */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <History className="w-5 h-5 text-blue-400" />
            <h2>Historical Incidents & Post-Mortems</h2>
          </div>

          <div className="space-y-4">
            {incidents.map((inc) => (
              <div key={inc.id} className="lore-card p-5 space-y-3 border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-400">
                    Incident #{inc.id}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" /> {inc.date}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{inc.title}</h3>
                <p className="text-xs text-slate-300">{inc.description}</p>

                <div className="space-y-2 text-xs pt-1">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    <span className="text-rose-400 font-semibold block mb-0.5">Root Cause:</span>
                    {inc.root_cause}
                  </div>

                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    <span className="text-emerald-400 font-semibold block mb-0.5">Lesson Learned & Mitigation:</span>
                    {inc.lessons_learned}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                  <span>Enforced by: <span className="text-blue-400 font-mono font-semibold">{inc.related_decision}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: High Risk Architectural Decisions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2>High-Severity Architectural Policies</h2>
          </div>

          <div className="space-y-4">
            {highRiskDecisions.map((dec) => (
              <div key={dec.id} className="lore-card p-5 space-y-2.5 border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-400">
                    Decision #{dec.id} ({dec.domain})
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    dec.risk_level === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {dec.risk_level} SEVERITY
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{dec.title}</h3>
                <div className="p-2.5 rounded bg-slate-900 font-mono text-xs text-slate-200">
                  {dec.decision}
                </div>
                <p className="text-xs text-slate-400">
                  <span className="text-slate-300 font-semibold">Mitigates: </span>
                  {dec.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
