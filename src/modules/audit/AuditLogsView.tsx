import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  ShieldCheck, 
  Calendar, 
  User, 
  Terminal,
  Clock,
  Layers
} from 'lucide-react';
import { db } from '../../services/dbService';
import { AuditLog } from '../../types';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(db.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedLogPayload, setSelectedLogPayload] = useState<AuditLog | null>(null);

  useEffect(() => {
    const update = () => setLogs(db.getAuditLogs());
    const unsub = db.subscribe(update);
    return unsub;
  }, []);

  const uniqueActions = ['all', ...Array.from(new Set(logs.map((l) => l.action)))];
  const uniqueUsers = ['all', ...Array.from(new Set(logs.map((l) => l.user_name || 'System / Admin')))];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.resource_id && log.resource_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    const matchesUser = selectedUser === 'all' || (log.user_name || 'System / Admin') === selectedUser;

    return matchesSearch && matchesAction && matchesUser;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Metadata'];
    const rows = filteredLogs.map((l) => [
      `"${l.created_at}"`,
      `"${l.user_name || 'System'}"`,
      `"${l.action}"`,
      `"${l.resource_type}"`,
      `"${l.resource_id || ''}"`,
      `"${JSON.stringify(l.metadata || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `paypilot_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Immutable Security Trail</span>
            <span aria-hidden="true">·</span>
            <span>22-Table Audit Ledger</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System & Security Audit Logs
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Cryptographically chronological records of invoice creation, payment capture, entity mutations, and AI approvals.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, user, or resource ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-mono"
          >
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act === 'all' ? 'All Action Types' : act}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {uniqueUsers.map((u) => (
              <option key={u} value={u}>
                {u === 'all' ? 'All Operating Users' : u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Audit Event Ledger
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-400">
            {filteredLogs.length} events logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-500 font-semibold">
              <tr>
                <th className="p-4">TIMESTAMP</th>
                <th className="p-4">ACTION TYPE</th>
                <th className="p-4">RESOURCE</th>
                <th className="p-4">OPERATOR</th>
                <th className="p-4 text-right">PAYLOAD DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-sans text-xs">
                    No audit records match the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes('DELETED')
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : log.action.includes('CREATED') || log.action.includes('COMPLETED')
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-sans text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{log.resource_type}</span>
                      {log.resource_id && (
                        <span className="text-[11px] font-mono text-slate-400 ml-1.5">
                          ({log.resource_id})
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-sans text-slate-600 dark:text-slate-400">
                      {log.user_name || 'System / Admin'}
                    </td>
                    <td className="p-4 text-right font-sans">
                      <button
                        onClick={() => setSelectedLogPayload(log)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Inspector Modal */}
      {selectedLogPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {selectedLogPayload.action} · {selectedLogPayload.id}
              </span>
              <button
                onClick={() => setSelectedLogPayload(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-2">
                Logged at: {new Date(selectedLogPayload.created_at).toLocaleString()}
              </div>
              <pre className="max-h-64 overflow-y-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-400">
                {JSON.stringify(selectedLogPayload.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="mt-4 flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedLogPayload(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
