import React from 'react';
import { Search, GitBranch, Shield, Sparkles, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onQuickReset?: () => void;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onQuickReset, isResetting }) => {
  const navigate = useNavigate();

  return (
    <header className="h-14 border-b border-slate-800/80 bg-[#0d1322]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search trigger & repo branch */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={() => navigate('/ask')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-300 w-full max-w-md transition-all text-left"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Ask LORE or search decisions... (e.g. "auth cookies", "Postgres vs Mongo")</span>
          <kbd className="ml-auto font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-mono">
          <GitBranch className="w-3.5 h-3.5 text-blue-400" />
          <span>main</span>
        </div>

        <button
          onClick={() => navigate('/simulator')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-blue-500/40 text-blue-300 hover:text-white hover:border-blue-400 text-xs font-medium transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Run Demo Conflict</span>
        </button>

        {onQuickReset && (
          <button
            onClick={onQuickReset}
            disabled={isResetting}
            title="Reset demo data"
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        )}

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
            AR
          </div>
          <span className="text-xs font-medium text-slate-300 hidden md:inline">Alex Rivera</span>
        </div>
      </div>
    </header>
  );
};
