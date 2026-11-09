import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, X, RefreshCw, Key, ShieldCheck } from 'lucide-react';
import { getSupabaseConfig, testSupabaseConnection } from '../../services/supabaseClient';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const config = getSupabaseConfig();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'env' | 'sql'>('env');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection();
    setTestResult(result);
    setIsTesting(false);
  };

  const envSample = `# Add to your .env file
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleCopySql = () => {
    const sqlPath = `-- Run /supabase/migrations/001_initial_schema.sql in Supabase SQL Editor
-- Contains 22 PostgreSQL tables with RLS and multi-tenant policies`;
    navigator.clipboard.writeText(sqlPath);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Supabase PostgreSQL Architecture
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Managed via secure environment variables (zero in-browser credential exposure).
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('env')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'env'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Environment Configuration (.env)
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'sql'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            22-Table SQL Schema
          </button>
        </div>

        {activeTab === 'env' ? (
          <div className="mt-4 space-y-4">
            {/* Security Notice */}
            <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300">
              <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <div>
                <span className="font-bold block">Hardened Security Standard</span>
                <span>
                  Supabase URL and API keys are strictly configured via server/build environment variables. Credentials are never entered into or stored in browser localStorage.
                </span>
              </div>
            </div>

            {/* Current Environment Status */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Active Environment Variables
                </span>
                <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                  config.isConnected
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                }`}>
                  {config.isConnected ? 'CONFIGURED' : 'UNSET IN .ENV'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">VITE_SUPABASE_URL</span>
                  <span className="text-slate-900 dark:text-white font-semibold truncate max-w-xs">
                    {config.url || 'Not set in environment'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">VITE_SUPABASE_ANON_KEY</span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {config.anonKey || 'Not set in environment'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  To configure or update live Supabase:
                </span>
                <button
                  onClick={handleCopyEnv}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  {copiedEnv ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedEnv ? 'Copied' : 'Copy Template'}</span>
                </button>
              </div>
              <pre className="rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-xs text-emerald-400 dark:border-slate-800">
                {envSample}
              </pre>
            </div>

            {testResult && (
              <div
                className={`flex items-start gap-2.5 rounded-xl p-3 text-xs ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                )}
                <span className="leading-relaxed">{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                <span>Supabase Dashboard</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Testing .env Credentials...</span>
                    </>
                  ) : (
                    <span>Test .env Connection</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Run this file in your Supabase SQL Editor to initialize all 22 tables with RLS:
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSql ? 'Path Copied' : 'Copy Path'}</span>
              </button>
            </div>

            <pre className="max-h-64 overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] text-slate-200 dark:border-slate-800 leading-relaxed">
              {`-- Location: /supabase/migrations/001_initial_schema.sql
-- 22 Complete PostgreSQL Tables with Foreign Keys & RLS:
1.  profiles              12. paypal_events
2.  businesses            13. transactions
3.  business_members      14. campaigns
4.  customers             15. donations
5.  product_categories    16. invoices
6.  products              17. invoice_items
7.  carts                 18. ai_conversations
8.  cart_items            19. ai_messages
9.  orders                20. ai_action_logs
10. order_items           21. notifications
11. payments              22. audit_logs`}
            </pre>
            <p className="text-[11px] text-slate-400">
              The complete schema file with Row Level Security is saved in your codebase at <code>/supabase/migrations/001_initial_schema.sql</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
