import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Sparkles,
  ShieldAlert,
  Send,
  CheckCircle2,
  RefreshCw,
  Lock,
  ArrowRight,
  Code2
} from 'lucide-react';
import { api } from '../services/api';

export const SimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const [runningScenario, setRunningScenario] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<any>(null);

  // Secret scanner test state
  const [secretResult, setSecretResult] = useState<any>(null);
  const [scanningSecret, setScanningSecret] = useState(false);

  // Webhook custom tester
  const [webhookKind, setWebhookKind] = useState('issue');
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  const handleRunAuthScenario = async () => {
    setRunningScenario(true);
    try {
      const res = await api.runAuthScenario();
      setScenarioResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRunningScenario(false);
    }
  };

  const handleRunSecretScanner = async () => {
    setScanningSecret(true);
    try {
      const res = await api.runSecretScanScenario();
      setSecretResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setScanningSecret(false);
    }
  };

  const handleSendSimulatedWebhook = async () => {
    setIsSendingWebhook(true);
    try {
      let payload = {};
      if (webhookKind === 'issue') {
        payload = {
          object_kind: 'issue',
          object_attributes: {
            id: 105,
            iid: 105,
            title: 'Add Apple Sign-In OAuth Flow',
            description: 'Implement Apple Sign-in with authorization code verification.',
            state: 'opened'
          },
          user: { name: 'Alex Rivera' }
        };
      } else if (webhookKind === 'merge_request') {
        payload = {
          object_kind: 'merge_request',
          object_attributes: {
            id: 55,
            iid: 55,
            title: 'Feature: Apple Sign-In client',
            description: 'Client implementation storing auth tokens.',
            source_branch: 'feature/apple-auth',
            target_branch: 'main',
            state: 'opened'
          },
          user: { name: 'Alex Rivera' }
        };
      } else {
        payload = {
          object_kind: 'push',
          user_name: 'Alex Rivera',
          commits: [
            {
              id: 'd4e5f6a',
              message: 'feat(auth): initial Apple sign in router',
              added: ['src/auth/apple.py'],
              modified: ['src/core/config.py']
            }
          ]
        };
      }

      const res = await fetch('/api/webhooks/gitlab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gitlab-Token': 'lore-webhook-secret-token'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setWebhookResponse(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingWebhook(false);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all institutional memory and demo state to clean baseline?')) {
      await api.resetSeed();
      navigate('/');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Cpu className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            GitLab Simulator & Webhook Playground
          </h1>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Interactive simulation engine to trigger GitLab CI/CD events, pre-LLM secret scanning, and complete memory conflict workflows.
        </p>
      </div>

      {/* Scenario 1: Full Auth Conflict Demo */}
      <div className="lore-card p-6 border-cyan-500/30 bg-cyan-500/5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Preset Scenario: The Auth Cookie Conflict Flow
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Simulates: Issue #103 → Pre-Mortem analysis → Promise #27 registered → MR #52 with localStorage diff → 5-Layer Review → Conflict detected.
            </p>
          </div>

          <button
            onClick={handleRunAuthScenario}
            disabled={runningScenario}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-blue-500/25 flex items-center gap-2 shrink-0 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${runningScenario ? 'animate-spin' : ''}`} />
            <span>{runningScenario ? 'Running Scenario...' : 'Execute Scenario Flow'}</span>
          </button>
        </div>

        {scenarioResult && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-white">
              <span>Scenario Execution Completed</span>
              <button
                onClick={() => navigate('/mrs/52')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs"
              >
                <span>Open MR #52 Review Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Issue #103:</span>
                <span className="text-emerald-400 font-bold">Pre-Mortem Generated</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Promise #27:</span>
                <span className="text-amber-400 font-bold">PENDING Registered</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-rose-500/30">
                <span className="text-slate-500 block">Layer 1 Check:</span>
                <span className="text-rose-400 font-bold">CONFLICT DETECTED</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-rose-500/30">
                <span className="text-slate-500 block">Layer 2 Promise:</span>
                <span className="text-rose-400 font-bold">PROMISE VIOLATED</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scenario 2: Secret Scanner & Redactor Live Inspector */}
      <div className="lore-card p-6 space-y-4 border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-base font-bold text-white">Pre-LLM Secret Redaction & Security Inspector</h2>
              <p className="text-xs text-slate-400">
                Demonstrates how LORE scrubs API keys, bearer tokens, passwords, and connection strings before AI processing.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunSecretScanner}
            disabled={scanningSecret}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{scanningSecret ? 'Scanning...' : 'Test Secret Redactor'}</span>
          </button>
        </div>

        {secretResult && (
          <div className="space-y-3 pt-2 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold font-mono">Raw Incoming Code (Unsafe):</span>
                <pre className="p-3 rounded-lg bg-slate-950 border border-rose-500/30 text-rose-300 font-mono text-[11px] overflow-x-auto">
                  {secretResult.original_text}
                </pre>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold font-mono">Sanitized Code Sent to LLM (Redacted):</span>
                <pre className="p-3 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] overflow-x-auto">
                  {secretResult.redacted_text}
                </pre>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">
                Redacted <span className="text-purple-400 font-bold">{secretResult.redactions_count} sensitive secrets</span> of types: <span className="font-mono text-cyan-400">{secretResult.detected_secret_types?.join(', ')}</span>
              </span>
              <span className="badge-active">PASSED COMPLIANCE</span>
            </div>
          </div>
        )}
      </div>

      {/* Scenario 3: Live GitLab Webhook Event Dispatcher */}
      <div className="lore-card p-6 space-y-4 border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-white">Live GitLab Webhook Dispatcher</h2>
              <p className="text-xs text-slate-400">
                Dispatches real HMAC-authenticated GitLab webhook payloads to POST /api/webhooks/gitlab.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={webhookKind}
            onChange={(e) => setWebhookKind(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="issue">GitLab Issue Created (Issue #105)</option>
            <option value="merge_request">GitLab MR Created (MR #55)</option>
            <option value="push">GitLab Push Commit (sha: d4e5f6a)</option>
          </select>

          <button
            onClick={handleSendSimulatedWebhook}
            disabled={isSendingWebhook}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingWebhook ? 'Dispatching...' : 'Dispatch Webhook Event'}</span>
          </button>
        </div>

        {webhookResponse && (
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="text-slate-500">Webhook Response:</div>
            <pre>{JSON.stringify(webhookResponse, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Reset Seed Data */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-300">Reset Demo State</div>
          <div className="text-xs text-slate-500">Restore all decisions, issues, and MR reviews to the initial demo baseline.</div>
        </div>
        <button
          onClick={handleResetData}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          Reset Baseline
        </button>
      </div>
    </div>
  );
};
