import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ListTodo,
  Brain,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { api, IssueItem } from '../services/api';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<IssueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [extractedPromises, setExtractedPromises] = useState<any[]>([]);

  const loadIssue = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getIssueById(parseInt(id));
      setIssue(data);

      // Initialize answers from existing developer answers
      const ansMap: Record<string, string> = {};
      if (data.developer_answers) {
        data.developer_answers.forEach((item) => {
          ansMap[item.question] = item.answer;
        });
      }
      setAnswers(ansMap);
    } catch (err) {
      console.error('Failed to load issue detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssue();
  }, [id]);

  const handleAutofillAnswer = (question: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [question]: text }));
  };

  const handleSubmitAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;
    setIsSubmitting(true);
    try {
      const qList = issue.questions || issue.pre_mortem?.questions || [];
      const formatted = qList.map((q) => ({
        question: q,
        answer: answers[q] || ''
      }));

      const res = await api.answerIssueQuestions(issue.gitlab_issue_id, {
        developer: issue.author || 'Alex Rivera',
        answers: formatted
      });

      setSubmissionSuccess(true);
      setExtractedPromises(res.promises || []);
      await loadIssue();
    } catch (err) {
      console.error('Failed to submit answers', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading issue pre-mortem...</div>;
  }

  if (!issue) {
    return <div className="p-8 text-center text-slate-400 text-sm">Issue not found.</div>;
  }

  const risks = issue.pre_mortem?.risks || [];
  const questions = issue.questions || issue.pre_mortem?.questions || [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/issues')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Issues</span>
      </button>

      {/* Issue Header */}
      <div className="lore-card p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-blue-400">
              Issue #{issue.gitlab_issue_id}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {issue.status}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {issue.domain}
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Author: <span className="text-slate-200 font-medium">{issue.author}</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          {issue.title}
        </h1>

        <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 font-sans">
          {issue.description}
        </p>
      </div>

      {/* Relevant Project Memory retrieved by LORE */}
      <div className="lore-card p-6 space-y-4 border-blue-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Relevant Institutional Memory</h2>
          </div>
          <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            Auto-Retrieved by LORE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-mono">
              <span className="text-blue-400 font-bold">🧠 Decision #17</span>
              <span className="badge-active">ACTIVE</span>
            </div>
            <div className="text-white font-medium">Authentication Token Storage</div>
            <p className="text-slate-400 text-[11px]">
              Authentication tokens must use secure HTTP-only cookies. Never localStorage.
            </p>
            <div className="text-[10px] text-slate-500">Source: MR #72</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-mono">
              <span className="text-blue-400 font-bold">🧠 Decision #22</span>
              <span className="badge-active">ACTIVE</span>
            </div>
            <div className="text-white font-medium">OAuth State Validation</div>
            <p className="text-slate-400 text-[11px]">
              OAuth state parameter must be cryptographically validated before exchanging codes.
            </p>
            <div className="text-[10px] text-slate-500">Source: MR #84</div>
          </div>
        </div>
      </div>

      {/* PRE-MORTEM RISK ANALYSIS */}
      <div className="lore-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">PRE-MORTEM RISK MATRIX</h2>
              <p className="text-xs text-slate-400">"Imagine this feature failed in production. What went wrong?"</p>
            </div>
          </div>
          <span className="text-xs font-mono text-amber-400 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            {risks.length} Potential Failure Modes
          </span>
        </div>

        <div className="space-y-3">
          {risks.map((risk, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 font-mono flex items-center justify-center font-bold text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-white text-sm">{risk.title}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    risk.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : risk.severity === 'HIGH'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {risk.severity} RISK
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed pl-7">
                <span className="text-slate-400 font-semibold">Why this matters: </span>
                {risk.description}
              </p>

              <div className="mt-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 flex items-start gap-2 ml-7">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-emerald-400">Suggested Prevention: </span>
                  {risk.prevention}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DEVELOPER QUESTIONS & PROMISE FORM */}
      <div className="lore-card p-6 space-y-4 border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">Developer Architectural Commitments</h2>
              <p className="text-xs text-slate-400">
                Answer these questions before submitting the Merge Request. LORE will extract explicit commitments to track in review.
              </p>
            </div>
          </div>
        </div>

        {submissionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
            <div className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Promises Successfully Recorded in Institutional Ledger!</span>
            </div>
            <p className="text-slate-300">
              LORE registered your commitments as <span className="font-mono text-emerald-400 font-semibold">PENDING</span>. When you open a Merge Request, LORE's 5-Layer review will verify compliance.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmitAnswers} className="space-y-4 text-xs">
          {questions.map((q, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="text-blue-400 font-mono">Q{idx + 1}:</span>
                <span>{q}</span>
              </div>

              <textarea
                rows={2}
                placeholder="State your technical implementation plan or commitment..."
                value={answers[q] || ''}
                onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              />

              {/* Smart Autofill Suggestion chips */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <span>Auto-fill option:</span>
                {q.toLowerCase().includes('storage') || q.toLowerCase().includes('mechanism') ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleAutofillAnswer(
                        q,
                        'Authentication tokens will be stored using secure HTTP-only cookies per Decision #17.'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                  >
                    Use Secure HTTP-Only Cookies (Decision #17)
                  </button>
                ) : q.toLowerCase().includes('state') ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleAutofillAnswer(
                        q,
                        'We will generate and verify a cryptographically secure CSRF state nonce per Decision #22.'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                  >
                    Validate OAuth State Nonce (Decision #22)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handleAutofillAnswer(
                        q,
                        'All API route exceptions will raise AppError per Decision #35.'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                  >
                    Adhere to Standard AppError convention
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Recording Promises...' : 'Submit Answers & Record Promises'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/mrs/52')}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              <span>Inspect Related MR #52</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
