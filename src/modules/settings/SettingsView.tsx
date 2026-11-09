import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Save, 
  Check 
} from 'lucide-react';
import { db } from '../../services/dbService';
import { Business } from '../../types';

interface SettingsViewProps {
  onOpenSupabaseModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = () => {
  const [business, setBusiness] = useState<Business>(db.getBusiness());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const update = () => {
      setBusiness(db.getBusiness());
    };
    const unsub = db.subscribe(update);
    return unsub;
  }, []);

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateBusiness(business);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset all databases, invoices, and transactions to default Tech SaaS demo data?')) {
      db.resetToDemoData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>System Administration</span>
            <span aria-hidden="true">·</span>
            <span>Configuration</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace & Database Settings
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Manage your company profile, Supabase PostgreSQL credentials, and PayPal Sandbox keys.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        {/* Business Profile Settings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Business Information
            </h3>
          </div>

          <form onSubmit={handleSaveBusiness} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Company / Organization Name
              </label>
              <input
                type="text"
                value={business.name}
                onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Industry Tagline / Subtitle
              </label>
              <input
                type="text"
                value={business.description}
                onChange={(e) => setBusiness({ ...business, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Operations Email
                </label>
                <input
                  type="email"
                  value={business.business_email}
                  onChange={(e) => setBusiness({ ...business, business_email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Standard Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={business.tax_rate}
                  onChange={(e) => setBusiness({ ...business, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {import.meta.env.DEV ? (
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="text-xs text-slate-400 hover:text-rose-600 underline font-medium"
                >
                  {resetSuccess ? '✓ Demo Data Restored' : 'Reset Demo Data (Dev Only)'}
                </button>
              ) : <div />}

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                {savedSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                <span>{savedSuccess ? 'Saved Changes' : 'Update Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
