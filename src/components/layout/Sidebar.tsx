import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BriefcaseBusiness, 
  ShoppingCart, 
  HeartHandshake, 
  FileText, 
  Bot, 
  Receipt, 
  BarChart3, 
  Settings,
  ShieldCheck,
  ChevronRight,
  GitCompare,
  Terminal,
} from 'lucide-react';
import { db } from '../../services/dbService';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const business = db.getBusiness();

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/paypilot', label: 'PayPilot AI', icon: BriefcaseBusiness },
    { to: '/agentcart', label: 'AgentCart AI', icon: ShoppingCart },
    { to: '/giveai', label: 'GiveAI', icon: HeartHandshake },
    { to: '/invoicemind', label: 'InvoiceMind AI', icon: FileText },
    { to: '/copilot', label: 'PayPilot Copilot', icon: Bot },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    { to: '/reconciliation', label: 'Reconciliation', icon: GitCompare },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/audit-logs', label: 'Audit Trail', icon: Terminal },
    ...(import.meta.env.DEV ? [{ to: '/audit', label: 'QA Test Matrix', icon: ShieldCheck }] : []),
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20">
            P1
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                PayPilot One
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                {business.name}
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
