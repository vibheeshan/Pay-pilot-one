import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  FileText, 
  RefreshCw,
  Layers,
  Activity,
  Trash2
} from 'lucide-react';
import { db } from '../../services/dbService';
import { apiFetch } from '../../services/apiClient';
import { AIMessage, AIActionRequest, AgentRole, AuditLog } from '../../types';
import { ConfirmationModal } from '../../components/layout/ConfirmationModal';

const AGENT_BADGES: Record<AgentRole, { label: string; color: string }> = {
  master_orchestrator: { label: 'Master Orchestrator', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400' },
  business_agent: { label: 'Business Agent', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
  shopping_agent: { label: 'Shopping Agent', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400' },
  donation_agent: { label: 'Donation Agent', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400' },
  invoice_agent: { label: 'Invoice Agent', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' },
  payment_agent: { label: 'Payment Ops Agent', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' },
};

const SUGGESTED_PROMPTS = [
  'Summarize my business performance and revenue this month.',
  'Find all overdue invoices and prepare automated reminder drafts.',
  'Which products generated the highest sales and what is our stock?',
  'Reconcile recent PayPal sandbox transactions against customer orders.',
  'Create an invoice for ABC Technologies for 5 cloud services at $1,500 each.',
  'Summarize all donations received and campaign goals this month.',
];

export const CopilotView: React.FC = () => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'init_1',
      role: 'assistant',
      agent_tag: 'master_orchestrator',
      content: `Hello! I am **PayPilot Copilot**, your central AI financial and operations orchestrator.\n\nI connect all five ecosystems: **PayPilot AI** (business intelligence), **AgentCart AI** (commerce & orders), **GiveAI** (fundraising campaigns), **InvoiceMind AI** (invoice automation), and **Payment Operations** (PayPal sandbox reconciliation).\n\nHow can I assist your operations today? You can select a recommended query below or type your instruction.`,
      created_at: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(db.getAuditLogs());
  const [pendingApprovalAction, setPendingApprovalAction] = useState<AIActionRequest | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setAuditLogs(db.getAuditLogs());
    const unsub = db.subscribe(update);
    return unsub;
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: AIMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      agent_tag: 'master_orchestrator',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      // Gather authoritative context from database
      const metrics = db.getDashboardMetrics();
      const context = {
        business_name: db.getBusiness().name,
        total_revenue: metrics.totalRevenue,
        unpaid_invoices_count: metrics.unpaidInvoicesCount,
        unpaid_amount: metrics.unpaidAmount,
        overdue_count: metrics.overdueInvoicesCount,
        products_count: metrics.totalProducts,
        campaigns_count: metrics.activeCampaignsCount,
        orders_count: metrics.totalOrders,
      };

      const res = await apiFetch('/api/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, context }),
      });

      const data = await res.json();

      const assistantMsg: AIMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        agent_tag: (data.agent_tag as AgentRole) || 'master_orchestrator',
        content: data.response_text || 'Acknowledged. Operations synchronized.',
        action_data: data.action_data,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          agent_tag: 'master_orchestrator',
          content: `Operational timeout or connectivity error: ${err.message || 'Check connection.'}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = async (action: AIActionRequest) => {
    // 1. Call server approve endpoint — this writes the audit log via service role.
    try {
      const approveRes = await apiFetch('/api/copilot/approve-action', {
        method: 'POST',
        body: JSON.stringify({
          action_type: action.action_type,
          details: action.details || {},
        }),
      });
      if (!approveRes.ok) {
        const err = await approveRes.json().catch(() => ({}));
        console.error('[approve] Server rejected action:', err);
        // Still continue with local side-effects so the UI doesn't freeze
      }
    } catch (err) {
      console.warn('[approve] Could not reach approve endpoint:', err);
    }

    // 2. Apply local side-effects (demo/localStorage mode — no-op when Supabase is live)
    if (action.action_type === 'create_invoice') {
      const d = action.details;
      const sub = Number(d.subtotal || 1500);
      const tax = Number(d.tax || sub * 0.0825);
      const tot = Number(d.total_amount || sub + tax);

      db.createInvoice({
        invoice_number: `INV-2026-${String(db.getInvoices().length + 1).padStart(3, '0')}`,
        customer_name: d.client_name || 'Enterprise Customer',
        customer_company: d.client_company || d.client_name || 'Acme Corp',
        customer_email: d.client_email || 'billing@acme.com',
        customer_address: 'Enterprise Towers',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        subtotal: sub,
        tax_amount: tax,
        total_amount: tot,
        currency: 'USD',
        status: 'issued',
        notes: `AI-drafted invoice. Approved via PayPilot Copilot approval gate.`,
        items: [
          {
            id: `item_${Date.now()}`,
            description: d.description || 'Cloud Software Services',
            quantity: Number(d.quantity || 1),
            unit_price: Number(d.unit_price || sub),
            tax_rate: 8.25,
            line_total: sub,
          },
        ],
      });
    } else if (action.action_type === 'send_invoice_reminder') {
      db.addNotification({
        title: 'Overdue Reminder Dispatched',
        message: `Overdue reminder sent for ${action.details.invoice_number || 'invoice'}.`,
        type: 'success',
      });
      db.addAuditLog('REMINDER_DISPATCHED', 'Invoice', action.details.invoice_number, action.details);
    }

    // 3. Update message action status in UI
    setMessages((prev) =>
      prev.map((m) =>
        m.action_data === action
          ? { ...m, action_data: { ...action, approval_status: 'approved', executed: true } }
          : m
      )
    );

    setPendingApprovalAction(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                PayPilot Copilot Multi-Agent Orchestrator
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cross-module intelligence with human confirmation gates and permanent audit logs.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'init_fresh',
                role: 'assistant',
                agent_tag: 'master_orchestrator',
                content: 'Conversation history reset. How can I assist your operations?',
                created_at: new Date().toISOString(),
              },
            ]);
          }}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-lg"
          title="Clear Conversation"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Main Body Grid */}
      <div className="mt-4 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Left: Chat Flow (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              const badge = AGENT_BADGES[msg.agent_tag] || AGENT_BADGES.master_orchestrator;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    isAssistant ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 font-bold text-[11px]">
                      AI
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                    isAssistant
                      ? 'border border-slate-200 bg-slate-50/70 text-slate-900 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100'
                      : 'bg-indigo-600 text-white'
                  }`}>
                    {isAssistant && (
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    <div className="whitespace-pre-line text-xs font-sans">
                      {msg.content}
                    </div>

                    {/* Interactive Action Card if proposed */}
                    {msg.action_data && (
                      <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50/80 p-3 text-slate-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-white">
                        <div className="flex items-center justify-between pb-1.5 border-b border-amber-200 dark:border-amber-900/60 text-[11px]">
                          <span className="font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Action Proposal Awaiting Approval</span>
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">
                            {msg.action_data.approval_status}
                          </span>
                        </div>
                        <h5 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                          {msg.action_data.title}
                        </h5>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                          {msg.action_data.summary}
                        </p>

                        <div className="mt-3 flex justify-end">
                          {msg.action_data.approval_status === 'approved' ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Approved & Executed</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setPendingApprovalAction(msg.action_data!)}
                              className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors"
                            >
                              <span>Review & Confirm Action</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Orchestrating specialist agents & querying database...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Suggested Prompts Strip */}
          <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Quick Prompts:</span>
            {SUGGESTED_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-600 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Copilot about sales, invoices, PayPal orders, or draft workflows..."
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Specialist Agents & Audit Ledger (1 Col) */}
        <div className="space-y-4 flex flex-col justify-between overflow-y-auto">
          {/* Active Agents Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
              Specialist Agent Fleet
            </span>
            <div className="space-y-2 text-xs">
              {Object.entries(AGENT_BADGES).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">{val.label}</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Authorized</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Audit Log Stream */}
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Live Audit Trail
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {auditLogs.length} events
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-[11px]">
              {auditLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950/60 font-mono">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{log.action}</span>
                    <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 truncate mt-0.5">
                    {log.resource_type}: {log.resource_id || 'system'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(pendingApprovalAction)}
        action={pendingApprovalAction}
        onApprove={handleApproveAction}
        onReject={() => setPendingApprovalAction(null)}
      />
    </div>
  );
};
