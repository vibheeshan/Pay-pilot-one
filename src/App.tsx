import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { SupabaseSetupModal } from './components/layout/SupabaseSetupModal';
import { AuthModal } from './components/layout/AuthModal';

// Auth Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Onboarding } from './pages/Onboarding';

// Modules
import { OverviewView } from './modules/dashboard/OverviewView';
import { PayPilotView } from './modules/paypilot/PayPilotView';
import { AgentCartView } from './modules/agentcart/AgentCartView';
import { GiveAIView } from './modules/giveai/GiveAIView';
import { InvoiceMindView } from './modules/invoicemind/InvoiceMindView';
import { CopilotView } from './modules/copilot/CopilotView';
import { TransactionsView } from './modules/transactions/TransactionsView';
import { ReportsView } from './modules/reports/ReportsView';
import { SettingsView } from './modules/settings/SettingsView';
import { AuditSuiteView } from './modules/testing/AuditSuiteView';
import { ReconciliationView } from './modules/reconciliation/ReconciliationView';
import { AuditLogsView } from './modules/audit/AuditLogsView';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Consolidated Dashboard',
  '/paypilot': 'PayPilot AI Operations',
  '/agentcart': 'AgentCart AI Marketplace',
  '/giveai': 'GiveAI Philanthropy',
  '/invoicemind': 'InvoiceMind AI Invoicing',
  '/copilot': 'PayPilot Copilot Multi-Agent',
  '/transactions': 'Unified Financial Ledger',
  '/reconciliation': 'Cross-Module Reconciliation',
  '/reports': 'Financial Statements',
  '/audit-logs': 'System & Security Audit Trail',
  '/audit': 'System Audit & QA Matrix',
  '/settings': 'System Settings & Supabase',
};

const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();

  const currentTitle = PAGE_TITLES[location.pathname] || 'Workspace';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          onOpenAuthModal={() => setAuthModalOpen(true)}
          pageTitle={currentTitle}
        />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<OverviewView />} />
            <Route path="/paypilot" element={<PayPilotView />} />
            <Route path="/agentcart" element={<AgentCartView />} />
            <Route path="/giveai" element={<GiveAIView />} />
            <Route path="/invoicemind" element={<InvoiceMindView />} />
            <Route path="/copilot" element={<CopilotView />} />
            <Route path="/transactions" element={<TransactionsView />} />
            <Route path="/reconciliation" element={<ReconciliationView />} />
            <Route path="/reports" element={<ReportsView />} />
            <Route path="/audit-logs" element={<AuditLogsView />} />
            <Route path="/audit" element={<AuditSuiteView />} />
            <Route
              path="/settings"
              element={<SettingsView onOpenSupabaseModal={() => setSupabaseModalOpen(true)} />}
            />
          </Routes>
        </main>
      </div>

      {/* Supabase PostgreSQL Setup & Migration Modal */}
      <SupabaseSetupModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />

      {/* User Authentication & Multi-Tenant Switcher Modal (DEV only) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  useEffect(() => {
    // Check initial dark theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Onboarding Route (Protected) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Workspace Application Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
