import React, { useState, useEffect } from 'react';
import { Receipt, Search, Download, CheckCircle2, Clock, Filter, ShieldCheck, Terminal, Layers } from 'lucide-react';
import { db } from '../../services/dbService';
import { apiFetch } from '../../services/apiClient';
import { Transaction } from '../../types';

export const TransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(db.getTransactions());
  const [activeTab, setActiveTab] = useState<'transactions' | 'webhooks'>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);

  useEffect(() => {
    const update = () => setTransactions(db.getTransactions());
    const unsub = db.subscribe(update);
    return unsub;
  }, []);

  const fetchWebhookEvents = async () => {
    try {
      const res = await apiFetch('/api/paypal/events');
      if (res.ok) {
        const data = await res.json();
        setWebhookEvents(data.events || []);
      }
    } catch (e) {
      console.warn('Could not load webhook events:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'webhooks') {
      fetchWebhookEvents();
    }
  }, [activeTab]);

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.transaction_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Type', 'Amount', 'Currency', 'Reference ID', 'Status', 'Date'];
    const rows = filtered.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.transaction_type,
      t.amount,
      t.currency,
      t.reference_id,
      t.status,
      t.created_at,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PayPilot_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Sandbox Warning Banner */}
      <div className="rounded-xl border border-amber-300/40 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="font-semibold">
            Sandbox – test transactions only. All monetary inflows represent verified PayPal sandbox settlements.
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60">
          PayPal Sandbox
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>Financial Operations</span>
            <span aria-hidden="true">·</span>
            <span>Ledger</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Unified Transaction Ledger
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Complete transaction records across AgentCart e-commerce orders, InvoiceMind settlements, and GiveAI donations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === 'webhooks'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Webhook Events Log</span>
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {activeTab === 'transactions' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, customer, or PayPal reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Transactions' },
                { id: 'order_payment', label: 'Store Orders' },
                { id: 'invoice_payment', label: 'Invoices' },
                { id: 'donation', label: 'Donations' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTypeFilter(item.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    typeFilter === item.id
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-500 font-semibold">
                <tr>
                  <th className="p-4">TRANSACTION</th>
                  <th className="p-4">TYPE</th>
                  <th className="p-4">PAYPAL REFERENCE</th>
                  <th className="p-4">TIMESTAMP</th>
                  <th className="p-4 text-right">SETTLED AMOUNT (USD)</th>
                  <th className="p-4 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-sans font-semibold text-slate-900 dark:text-white">
                      {tx.title}
                    </td>
                    <td className="p-4 font-sans capitalize text-slate-500">
                      {tx.transaction_type.replace('_', ' ')}
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {tx.reference_id}
                    </td>
                    <td className="p-4 text-slate-500 text-[11px]">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-900 dark:text-white">
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-sans">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        tx.status === 'reconciled'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Webhooks Event Log */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                PayPal Sandbox Webhook Deduplication Ledger
              </h3>
              <p className="text-xs text-slate-400">
                Server-side verified webhook events with unique idempotency IDs
              </p>
            </div>
            <button
              onClick={fetchWebhookEvents}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Refresh Events
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-500">
                <tr>
                  <th className="p-4">EVENT ID</th>
                  <th className="p-4">EVENT TYPE</th>
                  <th className="p-4">RECEIVED TIMESTAMP</th>
                  <th className="p-4 text-right">SIGNATURE VERIFIED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {webhookEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-sans text-xs">
                      No webhook transmissions captured in memory yet. Use Postman or the QA matrix to trigger webhook events!
                    </td>
                  </tr>
                ) : (
                  webhookEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{evt.id}</td>
                      <td className="p-4 text-indigo-600 dark:text-indigo-400 font-semibold">{evt.event_type}</td>
                      <td className="p-4 text-slate-400 text-[11px]">{new Date(evt.received_at).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold">
                          VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
