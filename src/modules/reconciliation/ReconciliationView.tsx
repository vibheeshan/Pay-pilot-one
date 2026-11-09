import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  FileText, 
  ShoppingCart, 
  ArrowRight,
  Receipt,
  Download
} from 'lucide-react';
import { db } from '../../services/dbService';
import { auth } from '../../services/authService';
import { apiFetch } from '../../services/apiClient';

export const ReconciliationView: React.FC = () => {
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationReport, setReconciliationReport] = useState<any | null>(null);
  const orders = db.getOrders();
  const invoices = db.getInvoices();
  const transactions = db.getTransactions();
  const currentUser = auth.getCurrentUser();

  const handleRunReconciliation = async () => {
    setIsReconciling(true);
    try {
      const res = await apiFetch('/api/reconciliation/run', {
        method: 'POST',
        body: JSON.stringify({
          orders,
          invoices,
          payments: transactions,
        }),
      });
      const data = await res.json();
      setReconciliationReport(data);
    } catch (err) {
      console.error('Reconciliation error:', err);
    } finally {
      setIsReconciling(false);
    }
  };

  useEffect(() => {
    handleRunReconciliation();
  }, []);

  const hasDiscrepancy = reconciliationReport?.status === 'DISCREPANCIES_DETECTED';

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Sandbox Banner */}
      <div className="rounded-xl border border-amber-300/40 bg-amber-50/80 p-3.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="font-semibold">
            Sandbox Environment: Cross-module reconciliation audits live orders against PayPal sandbox captures.
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60">
          Audit Mode
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>Financial Integrity & Compliance</span>
            <span aria-hidden="true">·</span>
            <span>Cross-Module Audit Engine</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cross-Module Reconciliation
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Automated verification comparing AgentCart orders, InvoiceMind settlements, and verified PayPal transactions.
          </p>
        </div>

        <button
          onClick={handleRunReconciliation}
          disabled={isReconciling}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isReconciling ? 'animate-spin' : ''}`} />
          <span>{isReconciling ? 'Running Audit...' : 'Re-Run Audit'}</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Overall Ledger Status</span>
          <div className="mt-2 flex items-center gap-2">
            {hasDiscrepancy ? (
              <span className="text-lg font-bold text-amber-600 flex items-center gap-1.5">
                <AlertTriangle className="h-5 w-5" />
                <span>Discrepancies Flagged</span>
              </span>
            ) : (
              <span className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-5 w-5" />
                <span>100% Balanced</span>
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {reconciliationReport?.reconciliation_timestamp ? new Date(reconciliationReport.reconciliation_timestamp).toLocaleTimeString() : 'Pending'}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Unsettled / Abandoned Orders</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {reconciliationReport?.discrepancies?.unverified_orders_count || 0}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Orders with missing payment capture</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Invoices Missing Payment Ref</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {reconciliationReport?.discrepancies?.invoices_missing_payment_records_count || 0}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Invoices marked paid with no payment ref</span>
        </div>
      </div>

      {/* Discrepancies Details */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ledger Discrepancy Breakdown
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Role: <strong className="capitalize text-slate-700 dark:text-slate-300">{currentUser.role}</strong> ({currentUser.full_name})
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-4">
          {/* Section 1: Orders */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              <span>Unverified Orders ({reconciliationReport?.discrepancies?.unverified_orders_count || 0})</span>
            </h4>
            {(!reconciliationReport?.discrepancies?.unverified_orders || reconciliationReport.discrepancies.unverified_orders.length === 0) ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>All completed AgentCart orders match verified PayPal Sandbox captures.</span>
              </p>
            ) : (
              <div className="space-y-2">
                {reconciliationReport.discrepancies.unverified_orders.map((ord: any) => (
                  <div key={ord.id} className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{ord.order_number}</span>
                      <span className="text-slate-500 ml-2">Total: ${ord.total_amount?.toFixed(2)}</span>
                    </div>
                    <span className="text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
                      Awaiting PayPal Capture Confirmation
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Invoices */}
          <div className="pt-4">
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>Invoices Without Payment Ledger Records ({reconciliationReport?.discrepancies?.invoices_missing_payment_records_count || 0})</span>
            </h4>
            {(!reconciliationReport?.discrepancies?.invoices_missing_payment_records || reconciliationReport.discrepancies.invoices_missing_payment_records.length === 0) ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>All paid invoices reconcile to confirmed payments in the ledger.</span>
              </p>
            ) : (
              <div className="space-y-2">
                {reconciliationReport.discrepancies.invoices_missing_payment_records.map((inv: any) => (
                  <div key={inv.id} className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{inv.invoice_number}</span>
                      <span className="text-slate-500 ml-2">Customer: {inv.customer_name} (${inv.total_amount?.toFixed(2)})</span>
                    </div>
                    <span className="text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
                      Marked Paid Without Associated Payment Record
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
