import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  FileText, 
  HeartHandshake, 
  ArrowUpRight, 
  AlertCircle,
  Plus,
  Bot,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { db } from '../../services/dbService';

export const OverviewView: React.FC = () => {
  const [metrics, setMetrics] = useState(db.getDashboardMetrics());
  const [transactions, setTransactions] = useState(db.getTransactions().slice(0, 5));
  const [invoices, setInvoices] = useState(db.getInvoices());
  const [revenueData, setRevenueData] = useState(db.getMonthlyRevenueData());
  const [categoryData, setCategoryData] = useState(db.getCategorySalesData());

  useEffect(() => {
    const update = () => {
      setMetrics(db.getDashboardMetrics());
      setTransactions(db.getTransactions().slice(0, 5));
      setInvoices(db.getInvoices());
      setRevenueData(db.getMonthlyRevenueData());
      setCategoryData(db.getCategorySalesData());
    };
    const unsub = db.subscribe(update);
    return unsub;
  }, []);

  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome & Quick Action Kicker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Operations & Financial Overview
            </h1>
            {db.isUsingDemoData() && (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                Sample data
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/copilot"
            className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 transition-colors"
          >
            <Bot className="h-4 w-4" />
            <span>Ask Copilot</span>
          </Link>
          <Link
            to="/invoicemind"
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Total Gross Revenue</span>
            {metrics.growthRate !== null && (
              <span className="flex items-center text-emerald-600 font-mono text-[11px]">
                {metrics.growthRate >= 0 ? `+${metrics.growthRate}%` : `${metrics.growthRate}%`} MTD
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            ${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Orders, Invoices & Donations
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>AgentCart Orders</span>
            <span className="text-slate-400 font-mono text-[11px]">{metrics.totalProducts} active SKUs</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {metrics.totalOrders}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Processed via PayPal Sandbox
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Unpaid Invoices</span>
            {metrics.overdueInvoicesCount > 0 && (
              <span className="text-rose-600 font-semibold text-[11px]">
                {metrics.overdueInvoicesCount} Overdue
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            ${metrics.unpaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {metrics.unpaidInvoicesCount} invoices pending settlement
          </div>
        </div>

        {/* GiveAI Campaigns */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>GiveAI Impact Raised</span>
            <span className="text-indigo-600 font-semibold text-[11px]">
              {metrics.activeCampaignsCount} Active
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            ${metrics.totalDonations.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Philanthropic developer grants
          </div>
        </div>
      </div>

      {/* Overdue Invoices Alert if any */}
      {overdueInvoices.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-50/70 p-4 dark:border-amber-500/10 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                Action Required: {overdueInvoices.length} Overdue Invoice(s) Detected
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {overdueInvoices[0].invoice_number} ({overdueInvoices[0].customer_name}) is past its due date of {overdueInvoices[0].due_date}.
              </p>
            </div>
          </div>
          <Link
            to="/copilot"
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-100 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Draft Reminder with AI
          </Link>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Growth Trend */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Revenue Trajectory (2026)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly consolidated sales volume
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">USD</span>
          </div>

          <div className="h-64 w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No revenue records found for this period.
              </div>
            )}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sales by Category
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Product line breakdown
                </p>
              </div>
            </div>

            <div className="h-48 w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="category" type="category" width={110} tickLine={false} stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Sales']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No category sales recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
            <span>
              {categoryData.length > 0 ? `Primary Driver: ${categoryData[0].category}` : 'No category data'}
            </span>
            <Link to="/agentcart" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Explore Store
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity & Transactions Ledger */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Financial Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified PayPal Sandbox captures and reconciled invoice settlements
            </p>
          </div>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <span>View All Ledger Entries</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 font-medium">TRANSACTION / TITLE</th>
                <th className="pb-3 font-medium">TYPE</th>
                <th className="pb-3 font-medium">REFERENCE ID</th>
                <th className="pb-3 font-medium">DATE</th>
                <th className="pb-3 font-medium text-right">AMOUNT (USD)</th>
                <th className="pb-3 font-medium text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-sans font-medium text-slate-900 dark:text-white">
                    {tx.title}
                  </td>
                  <td className="py-3 text-slate-500 capitalize font-sans">
                    {tx.transaction_type.replace('_', ' ')}
                  </td>
                  <td className="py-3 text-slate-400 text-[11px]">
                    {tx.reference_id}
                  </td>
                  <td className="py-3 text-slate-500 text-[11px]">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                    ${tx.amount.toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-sans">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
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
      </div>
    </div>
  );
};
