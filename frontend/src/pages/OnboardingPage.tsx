import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Download
} from 'lucide-react';
import { api } from '../services/api';

export const OnboardingPage: React.FC = () => {
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadBriefing = async () => {
    try {
      setLoading(true);
      const data = await api.getOnboardingBriefing();
      setBriefing(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBriefing();
  }, []);

  const handleCopy = () => {
    if (!briefing) return;
    navigator.clipboard.writeText(JSON.stringify(briefing, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Developer Onboarding & Institutional Briefing
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Live briefing compiled from verified decisions, incident post-mortems, and team conventions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadBriefing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Regenerate Briefing</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Compiling institutional memory briefing...
        </div>
      ) : !briefing ? (
        <div className="lore-card p-12 text-center text-slate-400 text-sm">
          Failed to load developer briefing.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="lore-card p-6 border-blue-500/30 bg-blue-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight">
                {briefing.title}
              </h2>
              <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Source Verified
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {briefing.summary}
            </p>
          </div>

          {/* Section 1: Architecture */}
          <div className="lore-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              {briefing.sections[0]?.heading}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {briefing.sections[0]?.content}
            </p>
          </div>

          {/* Section 2: Confirmed Decisions */}
          <div className="lore-card p-6 space-y-4 border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {briefing.sections[1]?.heading}
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">Mandatory Architectural Rules</span>
            </div>

            <div className="space-y-3">
              {briefing.sections[1]?.items?.map((item: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{item.title}</span>
                    <span className="badge-source font-mono">{item.source}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-blue-300 border border-slate-800">
                    {item.decision}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    <span className="text-slate-500 font-semibold">Rationale: </span>{item.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Historical Incidents */}
          <div className="lore-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              {briefing.sections[2]?.heading}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {briefing.sections[2]?.items?.map((inc: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-white">{inc.title}</div>
                  <div className="p-2 rounded bg-slate-950 text-rose-300 text-[11px] border border-slate-800">
                    <span className="text-slate-500 font-sans block">Root Cause:</span>
                    {inc.root_cause}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    Lesson: {inc.lessons_learned}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Superseded Decisions (Anti-patterns) */}
          <div className="lore-card p-6 space-y-3 border-purple-500/20">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              {briefing.sections[4]?.heading}
            </h3>

            <div className="space-y-2">
              {briefing.sections[4]?.items?.map((sd: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-300 line-through">{sd.title}</div>
                    <div className="text-slate-500 text-[11px]">{sd.decision}</div>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    Superseded by {sd.superseded_by}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: First Files to Read */}
          <div className="lore-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              {briefing.sections[5]?.heading}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {briefing.sections[5]?.files?.map((f: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                  <div className="font-mono text-blue-400 font-bold">{f.path}</div>
                  <div className="text-slate-400 text-[11px]">{f.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
