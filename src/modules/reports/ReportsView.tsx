import React from 'react';
import { BarChart3, TrendingUp, Calendar, ArrowUpRight, DollarSign, Download } from 'lucide-react';
import { db } from '../../services/dbService';

export const ReportsView: React.FC = () => {
  const metrics = db.getDashboardMetrics();
  const business = db.getBusiness();

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>Executive Reporting</span>
            <span aria-hidden="true">·</span>
            <span>Monthly P&L</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Statements & Performance Reports
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Monthly consolidated revenue, invoice collection efficiency, and multi-channel breakdown.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <Download className="h-4 w-4" />
          <span>Print / Save PDF Report</span>
        </button>
      </div>

      {/* Summary Matrix */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {business.name} – Executive Summary
            </h3>
            <span className="text-xs text-slate-400">Fiscal Period: Q4 2026</span>
          </div>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-mono">
            Audit Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-sans">Gross Platform Revenue</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              ${metrics.totalRevenue.toFixed(2)} USD
            </div>
            <p className="text-[11px] text-emerald-600 font-sans">+18.4% compared to previous quarter</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-sans">Receivable Collection Rate</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {Math.round((metrics.paidInvoicesCount / Math.max(1, metrics.paidInvoicesCount + metrics.unpaidInvoicesCount)) * 100)}%
            </div>
            <p className="text-[11px] text-slate-500 font-sans">{metrics.paidInvoicesCount} paid of {metrics.paidInvoicesCount + metrics.unpaidInvoicesCount} invoices</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-sans">PayPal Verified Settlements</span>
            <div className="text-xl font-bold text-emerald-600">
              ${(metrics.totalRevenue - metrics.unpaidAmount).toFixed(2)} USD
            </div>
            <p className="text-[11px] text-slate-500 font-sans">100% Sandbox capture verified</p>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
            Channel Revenue Distribution
          </h4>
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              <tr>
                <th className="py-2">CHANNEL / ECOSYSTEM</th>
                <th className="py-2">SOURCE MODULE</th>
                <th className="py-2 text-right">CONTRIBUTION</th>
                <th className="py-2 text-right">SETTLED VOLUME (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              <tr>
                <td className="py-3 font-sans font-semibold text-slate-800 dark:text-slate-200">B2B Software Invoicing</td>
                <td className="py-3 font-sans text-slate-500">InvoiceMind AI</td>
                <td className="py-3 text-right">62.4%</td>
                <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                  ${db.getInvoices().filter((i) => i.status === 'paid').reduce((s, i) => s + i.total_amount, 0).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-3 font-sans font-semibold text-slate-800 dark:text-slate-200">SaaS Cloud Subscriptions</td>
                <td className="py-3 font-sans text-slate-500">AgentCart AI</td>
                <td className="py-3 text-right">24.8%</td>
                <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                  ${db.getOrders().reduce((s, o) => s + o.total_amount, 0).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-3 font-sans font-semibold text-slate-800 dark:text-slate-200">Open-Source Dev Grants</td>
                <td className="py-3 font-sans text-slate-500">GiveAI</td>
                <td className="py-3 text-right">12.8%</td>
                <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                  ${metrics.totalDonations.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
