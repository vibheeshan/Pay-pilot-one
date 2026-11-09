import React from 'react';
import { ShieldAlert, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { AIActionRequest } from '../../types';

interface ConfirmationModalProps {
  action: AIActionRequest | null;
  isOpen: boolean;
  onApprove: (action: AIActionRequest) => void;
  onReject: () => void;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  action,
  isOpen,
  onApprove,
  onReject,
  isLoading = false,
}) => {
  if (!isOpen || !action) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onReject}
          className="absolute top-5 right-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header with Human Approval Tag */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Human Approval Required
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-[11px] font-mono text-slate-400">
                Audit Logged
              </span>
            </div>
            <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              {action.title}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {action.summary}
            </p>
          </div>
        </div>

        {/* Action Details Table */}
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/60">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500">
            <span>Action Parameter</span>
            <span>Proposed Value</span>
          </div>
          <div className="mt-2.5 space-y-2 text-xs">
            {Object.entries(action.details).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between font-mono">
                <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[240px]">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Guardrail Callout */}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <span>PayPilot AI guardrails prohibit automatic writes without review.</span>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onReject}
            disabled={isLoading}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel / Reject
          </button>
          <button
            type="button"
            onClick={() => onApprove(action)}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span>Executing...</span>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Confirm & Execute Action</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
