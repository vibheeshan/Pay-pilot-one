import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../services/apiClient';
import { Building2, DollarSign, Percent, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { user, refreshBusiness, setBusiness } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState(
    (user?.user_metadata?.business_name as string) || ''
  );
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [taxRate, setTaxRate] = useState<number>(8.25);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessName.trim()) {
      setError('Please enter a business name.');
      return;
    }
    if (taxRate < 0 || taxRate > 100) {
      setError('Tax rate must be between 0% and 100%.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/onboarding/business', {
        method: 'POST',
        body: JSON.stringify({
          business_name: businessName.trim(),
          currency,
          tax_rate: Number(taxRate),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create business.');
      }

      // Immediately set the business in context so ProtectedRoute allows entry
      setBusiness({
        id: data.business_id,
        name: businessName.trim(),
        currency,
        tax_rate: Number(taxRate),
        role: 'owner',
      });

      // Also trigger refresh from server
      await refreshBusiness();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Server error creating business.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Set up your Business
          </h2>
          <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
            Configure your enterprise workspace and financial settings
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Business / Workspace Name
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Building2 className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Apex Technologies LLC"
                className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Base Operating Currency
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-colors ${
                  currency === 'USD'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                <span>USD ($)</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-colors ${
                  currency === 'INR'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                <span>INR (₹)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Default Sales Tax / GST Rate (%)
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Percent className="h-4 w-4" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Standard US SaaS tax is 8.25%; standard Indian GST is 18.00%.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Configuring workspace...
              </span>
            ) : (
              <>
                <span>Complete setup & enter workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
