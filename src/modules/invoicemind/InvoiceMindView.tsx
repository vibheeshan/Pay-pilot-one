import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Sparkles, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Mail, 
  Trash2,
  Calendar,
  X,
  Edit2,
  DollarSign
} from 'lucide-react';
import { db } from '../../services/dbService';
import { apiFetch } from '../../services/apiClient';
import { generateInvoicePDF } from '../../services/pdfService';
import { Invoice, InvoiceItem, AIActionRequest, Currency } from '../../types';
import { ConfirmationModal } from '../../components/layout/ConfirmationModal';

export const InvoiceMindView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(db.getInvoices());
  const [business, setBusiness] = useState(db.getBusiness());
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'issued' | 'overdue' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Natural Language AI Invoice Prompt
  const [nlPrompt, setNlPrompt] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  // Manual Creation Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [manualInvoice, setManualInvoice] = useState({
    customer_name: 'Sarah Chen',
    customer_company: 'Apex Digital Dynamics',
    customer_email: 'sarah.chen@apexdigital.tech',
    customer_address: '450 Mission St, San Francisco, CA',
    due_days: 14,
    currency: 'USD' as Currency,
    notes: 'Net-14 cloud services SLA terms.',
    items: [
      { id: 'item_1', description: 'API Sentinel Pro (Monthly Seat)', quantity: 2, unit_price: 89.00, tax_rate: 8.25, line_total: 178.00 },
    ],
  });

  // Human Approval Action Modal
  const [pendingApprovalAction, setPendingApprovalAction] = useState<AIActionRequest | null>(null);

  useEffect(() => {
    const update = () => {
      setInvoices(db.getInvoices());
      setBusiness(db.getBusiness());
    };
    const unsub = db.subscribe(update);
    return unsub;
  }, []);

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const unpaidInvoices = invoices.filter((i) => i.status === 'issued' || i.status === 'pending' || i.status === 'overdue');
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');

  const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + i.total_amount, 0);
  const totalCollected = paidInvoices.reduce((sum, i) => sum + i.total_amount, 0);

  // Line item helpers for Manual Invoice Modal
  const handleAddLineItem = () => {
    setManualInvoice((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item_${Date.now()}`,
          description: '',
          quantity: 1,
          unit_price: 100,
          tax_rate: 8.25,
          line_total: 100,
        },
      ],
    }));
  };

  const handleRemoveLineItem = (index: number) => {
    if (manualInvoice.items.length <= 1) return;
    setManualInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleUpdateLineItem = (index: number, field: string, val: any) => {
    setManualInvoice((prev) => {
      const updated = [...prev.items];
      const cur = { ...updated[index], [field]: val };
      if (field === 'quantity' || field === 'unit_price') {
        cur.line_total = (Number(cur.quantity) || 0) * (Number(cur.unit_price) || 0);
      }
      updated[index] = cur;
      return { ...prev, items: updated };
    });
  };

  // Natural language invoice drafting via Copilot endpoint
  const handleAiDraftInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlPrompt.trim()) return;

    setIsAiDrafting(true);
    try {
      // Check if Indian Rupee is specified
      const isRupee = nlPrompt.includes('₹') || /rupee|inr/i.test(nlPrompt);
      const currency: Currency = isRupee ? 'INR' : 'USD';

      // Call server copilot route
      const res = await apiFetch('/api/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: `Create an invoice draft based on this request: "${nlPrompt}". Calculate unit price, line items, 8.25% tax, and total. Currency is ${currency}.`,
        }),
      });

      const data = await res.json();
      
      // If server returned structured action_data, present human approval modal
      if (data.action_data) {
        if (!data.action_data.details.currency) {
          data.action_data.details.currency = currency;
        }
        setPendingApprovalAction(data.action_data);
      } else {
        // Fallback robust regex parser supporting both $ and ₹
        const match = nlPrompt.match(/for\s+([^for]+?)\s+with\s+(\d+)\s+(.+?)\s+at\s+[\$₹]?(\d+)/i) ||
                      nlPrompt.match(/for\s+([^for]+?)\s+for\s+(\d+)\s+(.+?)\s+at\s+[\$₹]?(\d+)/i);
        
        const client = match ? match[1].trim() : 'Enterprise Client';
        const qty = match ? parseInt(match[2], 10) : 5;
        const desc = match ? match[3].trim() : 'Cloud Services & Maintenance';
        const price = match ? parseFloat(match[4]) : 150;
        const sub = qty * price;
        const tax = Math.round(sub * 0.0825 * 100) / 100;
        const total = sub + tax;
        const symbol = currency === 'INR' ? '₹' : '$';

        setPendingApprovalAction({
          action_type: 'create_invoice',
          title: `Draft Invoice for ${client}`,
          summary: `InvoiceMind AI has calculated an invoice totaling ${symbol}${total.toFixed(2)} ${currency} for ${qty}× ${desc}.`,
          details: {
            client_name: client,
            quantity: qty,
            description: desc,
            unit_price: price,
            subtotal: sub,
            tax: tax,
            total_amount: total,
            currency,
          },
          requires_human_approval: true,
          approval_status: 'pending',
        });
      }
    } catch (err) {
      console.error('AI Invoice Draft Error:', err);
    } finally {
      setIsAiDrafting(false);
      setNlPrompt('');
    }
  };

  // Execution when user confirms in ConfirmationModal
  const handleConfirmAction = (action: AIActionRequest) => {
    if (action.action_type === 'create_invoice') {
      const d = action.details;
      const sub = Number(d.subtotal || 0);
      const tax = Number(d.tax || sub * 0.0825);
      const tot = Number(d.total_amount || sub + tax);
      const curr = (d.currency as Currency) || 'USD';

      const newInvNumber = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
      const issueDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

      db.createInvoice({
        invoice_number: newInvNumber,
        customer_name: d.client_name || 'Enterprise Customer',
        customer_company: d.client_company || d.client_name || 'Acme Corp',
        customer_email: d.client_email || 'accounting@client.com',
        customer_address: 'Enterprise Plaza, Suite 400',
        issue_date: issueDate,
        due_date: dueDate,
        subtotal: sub,
        tax_amount: tax,
        total_amount: tot,
        currency: curr,
        status: 'issued',
        notes: `AI Generated invoice drafted via PayPilot Copilot. Approved by Administrator.`,
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
        title: 'Invoice Reminder Sent',
        message: `Overdue reminder dispatched to ${action.details.recipient || 'client'} for ${action.details.invoice_number}.`,
        type: 'success',
      });
      db.addAuditLog('REMINDER_SENT', 'Invoice', action.details.invoice_number, action.details);
    }

    setPendingApprovalAction(null);
  };

  const handleManualAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = manualInvoice.items.reduce((sum, it) => sum + (Number(it.line_total) || 0), 0);
    const tax = Math.round(subtotal * 0.0825 * 100) / 100;
    const total = subtotal + tax;

    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + manualInvoice.due_days * 86400000).toISOString().split('T')[0];
    const invNumber = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;

    db.createInvoice({
      invoice_number: invNumber,
      customer_name: manualInvoice.customer_name,
      customer_company: manualInvoice.customer_company,
      customer_email: manualInvoice.customer_email,
      customer_address: manualInvoice.customer_address,
      issue_date: issueDate,
      due_date: dueDate,
      subtotal,
      tax_amount: tax,
      total_amount: total,
      currency: manualInvoice.currency,
      status: 'issued',
      notes: manualInvoice.notes,
      items: manualInvoice.items,
    });

    setShowManualModal(false);
  };

  const handleSaveEditedInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const subtotal = editingInvoice.items.reduce((sum, it) => sum + (Number(it.line_total) || 0), 0);
    const tax = Math.round(subtotal * 0.0825 * 100) / 100;
    const total = subtotal + tax;

    db.updateInvoice(editingInvoice.id, {
      customer_name: editingInvoice.customer_name,
      customer_company: editingInvoice.customer_company,
      customer_email: editingInvoice.customer_email,
      status: editingInvoice.status,
      due_date: editingInvoice.due_date,
      subtotal,
      tax_amount: tax,
      total_amount: total,
      notes: editingInvoice.notes,
    });

    setEditingInvoice(null);
  };

  const handlePrepareReminder = (inv: Invoice) => {
    const symbol = inv.currency === 'INR' ? '₹' : '$';
    setPendingApprovalAction({
      action_type: 'send_invoice_reminder',
      title: `Prepare Payment Reminder for ${inv.customer_name}`,
      summary: `InvoiceMind AI will prepare and dispatch an overdue payment notice for ${inv.invoice_number} (${symbol}${inv.total_amount.toFixed(2)} ${inv.currency}).`,
      details: {
        invoice_number: inv.invoice_number,
        recipient: inv.customer_email,
        overdue_amount: `${symbol}${inv.total_amount.toFixed(2)}`,
        due_date: inv.due_date,
      },
      requires_human_approval: true,
      approval_status: 'pending',
    });
  };

  const filteredInvoices = invoices.filter((i) => {
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchesSearch =
      i.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.customer_company && i.customer_company.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>Module 4</span>
            <span aria-hidden="true">·</span>
            <span>Intelligent Invoicing & PDF Generation</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            InvoiceMind AI
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Automate multi-item invoicing with natural language, track overdue accounts, and generate client-ready PDFs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const headers = ['Invoice Number', 'Customer', 'Email', 'Company', 'Issue Date', 'Due Date', 'Subtotal', 'Tax', 'Total', 'Currency', 'Status'];
              const rows = filteredInvoices.map((i) => [
                i.invoice_number,
                `"${i.customer_name}"`,
                i.customer_email,
                `"${i.customer_company || ''}"`,
                i.issue_date,
                i.due_date,
                i.subtotal,
                i.tax_amount,
                i.total_amount,
                i.currency,
                i.status,
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `PayPilot_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={async () => {
              try {
                const res = await apiFetch('/api/invoices/check-overdue', {
                  method: 'POST',
                  body: JSON.stringify({ invoices }),
                });
                const data = await res.json();
                db.addNotification({
                  title: 'Overdue Audit Completed',
                  message: `Server audited ${invoices.length} invoices: ${data.overdue_count} accounts past due.`,
                  type: data.overdue_count > 0 ? 'warning' : 'success',
                });
              } catch (e) {
                console.warn('Overdue check failed:', e);
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 transition-colors"
          >
            <Clock className="h-4 w-4" />
            <span>Server Overdue Audit</span>
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Manual Multi-Item Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Total Billed Volume</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            ${(totalCollected + totalOutstanding).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">{totalInvoices} total invoices issued</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-emerald-600">Settled & Reconciled</span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">{paidInvoices.length} paid invoices</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Outstanding Receivable</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">{unpaidInvoices.length} awaiting settlement</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-rose-600">Past Due / Overdue</span>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            {overdueInvoices.length}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Requires reminder workflow</span>
        </div>
      </div>

      {/* Natural Language Invoice Drafting Input */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1">
          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Natural Language Invoice Builder (Supports $ USD and ₹ INR)</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
          Type an invoice instruction in plain English. InvoiceMind AI will parse line items and calculate taxes before asking for your confirmation:
        </p>

        <form onSubmit={handleAiDraftInvoice} className="flex gap-2">
          <input
            type="text"
            value={nlPrompt}
            onChange={(e) => setNlPrompt(e.target.value)}
            placeholder="e.g. Create an invoice for Apex Digital for 5 cloud licenses at $1,200 each (or ₹50,000 for Infosys)"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white shadow-xs"
          />
          <button
            type="submit"
            disabled={isAiDrafting || !nlPrompt.trim()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isAiDrafting ? 'Drafting...' : 'Draft with AI'}</span>
          </button>
        </form>
      </div>

      {/* Filter and Invoices Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice #, customer, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(['all', 'paid', 'issued', 'overdue', 'draft'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices Data Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-500 font-semibold">
              <tr>
                <th className="p-4">INVOICE #</th>
                <th className="p-4">CUSTOMER / COMPANY</th>
                <th className="p-4">ISSUE DATE</th>
                <th className="p-4">DUE DATE</th>
                <th className="p-4 text-right">TOTAL</th>
                <th className="p-4 text-center">STATUS</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredInvoices.map((inv) => {
                const symbol = inv.currency === 'INR' ? '₹' : '$';
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {inv.invoice_number}
                    </td>
                    <td className="p-4 font-sans">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {inv.customer_name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {inv.customer_company || inv.customer_email}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-[11px]">
                      {inv.issue_date}
                    </td>
                    <td className="p-4 text-slate-500 text-[11px]">
                      {inv.due_date}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-900 dark:text-white">
                      {symbol}{inv.total_amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-center font-sans">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : inv.status === 'overdue'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => db.markInvoicePaid(inv.id)}
                            className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                            title="Mark Invoice Paid"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setEditingInvoice(inv)}
                          className="rounded-lg bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          title="Edit Invoice"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {inv.status === 'overdue' && (
                          <button
                            onClick={() => handlePrepareReminder(inv)}
                            className="rounded-lg bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400"
                            title="Draft Overdue Reminder with Copilot"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => generateInvoicePDF(inv, business)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => db.deleteInvoice(inv.id)}
                          className="rounded p-1.5 text-slate-400 hover:text-rose-600"
                          title="Delete invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Invoice Creation Modal with Dynamic Multi-Line Items */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Multi-Item Invoice</h3>
              <button onClick={() => setShowManualModal(false)} className="rounded p-1 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualAddInvoice} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={manualInvoice.customer_name}
                    onChange={(e) => setManualInvoice({ ...manualInvoice, customer_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Company</label>
                  <input
                    type="text"
                    value={manualInvoice.customer_company}
                    onChange={(e) => setManualInvoice({ ...manualInvoice, customer_company: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Currency</label>
                  <select
                    value={manualInvoice.currency}
                    onChange={(e) => setManualInvoice({ ...manualInvoice, currency: e.target.value as Currency })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={manualInvoice.customer_email}
                  onChange={(e) => setManualInvoice({ ...manualInvoice, customer_email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
                />
              </div>

              {/* Dynamic Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Line Items & Services
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {manualInvoice.items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Item description"
                          value={it.description}
                          onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={it.quantity}
                          onChange={(e) => handleUpdateLineItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-mono dark:border-slate-700 dark:bg-slate-950 dark:text-white text-center"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={it.unit_price}
                          onChange={(e) => handleUpdateLineItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-mono dark:border-slate-700 dark:bg-slate-950 dark:text-white text-right"
                        />
                      </div>
                      <div className="w-20 text-right font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        ${(it.line_total || 0).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        disabled={manualInvoice.items.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary */}
              {(() => {
                const sub = manualInvoice.items.reduce((s, it) => s + (it.line_total || 0), 0);
                const tax = Math.round(sub * 0.0825 * 100) / 100;
                const tot = sub + tax;
                return (
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>${sub.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Tax (8.25%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800 text-sm">
                      <span>Grand Total</span>
                      <span className="text-indigo-600 dark:text-indigo-400">${tot.toFixed(2)} {manualInvoice.currency}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Save & Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Invoice {editingInvoice.invoice_number}
              </h3>
              <button onClick={() => setEditingInvoice(null)} className="rounded p-1 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedInvoice} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editingInvoice.customer_name}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, customer_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={editingInvoice.status}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, status: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="issued">Issued</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Email</label>
                <input
                  type="email"
                  required
                  value={editingInvoice.customer_email}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, customer_email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Due Date</label>
                <input
                  type="date"
                  required
                  value={editingInvoice.due_date}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, due_date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Notes & Payment Terms</label>
                <textarea
                  rows={2}
                  value={editingInvoice.notes || ''}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Human Approval Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(pendingApprovalAction)}
        action={pendingApprovalAction}
        onApprove={handleConfirmAction}
        onReject={() => setPendingApprovalAction(null)}
      />
    </div>
  );
};
