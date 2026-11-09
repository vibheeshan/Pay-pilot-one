import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, X, CreditCard, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../../services/dbService';
import { apiFetch } from '../../services/apiClient';
import { OrderItem } from '../../types';

interface PayPalCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: OrderItem[];
  donationAmount?: number;
  campaignId?: string;
  campaignTitle?: string;
  onSuccess?: () => void;
}

export const PayPalCheckoutModal: React.FC<PayPalCheckoutModalProps> = ({
  isOpen,
  onClose,
  items = [],
  donationAmount,
  campaignId,
  campaignTitle,
  onSuccess,
}) => {
  const [step, setStep] = useState<'review' | 'processing' | 'success' | 'error'>('review');
  const [errorMessage, setErrorMessage] = useState('');
  const [customerName, setCustomerName] = useState('Alex Mercer');
  const [customerEmail, setCustomerEmail] = useState('alex.mercer@innovate.co');
  const [captureReceipt, setCaptureReceipt] = useState<{ orderId: string; captureId: string; total: string } | null>(null);

  if (!isOpen) return null;

  const isDonation = Boolean(donationAmount);
  const subtotal = isDonation
    ? (donationAmount || 0)
    : items.reduce((sum, item) => sum + item.line_total, 0);
  const taxRate = isDonation ? 0 : 0.0825; // 8.25% tax on SaaS products
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const handleExecutePayPalCheckout = async () => {
    setStep('processing');
    setErrorMessage('');

    try {
      // 1. Call server to create authoritative sandbox order
      const orderPayload = isDonation
        ? {
            items: [
              {
                unit_price: donationAmount,
                quantity: 1,
                name: `Donation: ${campaignTitle || 'Campaign'}`,
              },
            ],
            customer: { name: customerName, email: customerEmail },
            source: 'giveai',
          }
        : {
            items: items.map((it) => ({
              unit_price: it.unit_price_snapshot,
              quantity: it.quantity,
              name: it.product_name_snapshot,
            })),
            customer: { name: customerName, email: customerEmail },
            source: 'agentcart',
          };

      const createRes = await apiFetch('/api/paypal/create-order', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      const orderData = await createRes.json();
      if (!createRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to create PayPal sandbox order.');
      }

      // 2. Capture in PayPal Sandbox — pass expected total for server-side amount check
      const captureRes = await apiFetch('/api/paypal/capture-order', {
        method: 'POST',
        body: JSON.stringify({
          orderId: orderData.orderId,
          expectedTotal: orderData.breakdown?.total,
          expectedCurrency: 'USD',
        }),
      });

      const captureData = await captureRes.json();
      // Accept real sandbox status or stub status when no credentials configured
      const captureOk = captureData.status === 'COMPLETED' || captureData.status === 'COMPLETED_STUB';
      if (!captureRes.ok || !captureOk) {
        throw new Error(captureData.error || 'PayPal payment capture could not be verified.');
      }

      // 3. Record in database
      if (isDonation && campaignId) {
        db.recordDonation(campaignId, {
          donor_name: customerName,
          donor_email: customerEmail,
          amount: donationAmount || 0,
          currency: 'USD',
          paypal_order_id: captureData.orderId,
        });
      } else {
        db.createOrder({
          customer_name: customerName,
          customer_email: customerEmail,
          items,
          subtotal,
          tax_amount: tax,
          total_amount: total,
          currency: 'USD',
          paypal_order_id: captureData.orderId,
        });
      }

      setCaptureReceipt({
        orderId: captureData.orderId,
        captureId: captureData.captureId,
        total: total.toFixed(2),
      });

      setStep('success');

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('PayPal Sandbox Error:', err);
      setErrorMessage(err?.message || 'An unexpected payment error occurred.');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        {step === 'review' && (
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    PayPal Sandbox Checkout
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    Verified Test Mode
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isDonation ? `Support: ${campaignTitle}` : 'Confirm & Authorize Order'}
                </h3>
              </div>
            </div>

            {/* Sandbox Notice Banner */}
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-50/80 p-2.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
              <span className="font-medium text-[11px]">
                Sandbox – test transactions only. Zero actual charges are processed to payment accounts.
              </span>
            </div>

            {/* Payer Info */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Customer / Donor Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* Item Breakdown */}
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
              <span className="text-xs font-semibold text-slate-500">Summary Breakdown</span>
              <div className="mt-2 space-y-1 text-xs">
                {isDonation ? (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-300">{campaignTitle}</span>
                    <span className="font-mono font-medium">${donationAmount?.toFixed(2)}</span>
                  </div>
                ) : (
                  items.map((it) => (
                    <div key={it.id} className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60 last:border-0">
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                        {it.product_name_snapshot} × {it.quantity}
                      </span>
                      <span className="font-mono font-medium">${it.line_total.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                {!isDonation && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax (8.25%)</span>
                    <span className="font-mono">${tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1">
                  <span>Total Amount</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">${total.toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            {/* Sandbox Security Notice */}
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Uses PayPal Developer Sandbox. No real credit card or funds are required.</span>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePayPalCheckout}
                className="flex items-center gap-2 rounded-lg bg-[#0070BA] hover:bg-[#005ea6] px-5 py-2 text-xs font-bold text-white shadow-md transition-colors"
              >
                <span>Authorize & Pay with PayPal Sandbox</span>
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-12 text-center">
            <RefreshCw className="mx-auto h-9 w-9 animate-spin text-blue-600" />
            <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              Communicating with PayPal Sandbox...
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Validating cart prices and executing server-side order capture.
            </p>
          </div>
        )}

        {step === 'success' && captureReceipt && (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h4 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
              Payment Verified & Captured!
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              The transaction has been successfully confirmed and recorded in your ledger.
            </p>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left font-mono text-xs dark:border-slate-800 dark:bg-slate-950/60 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">PayPal Order ID:</span>
                <span className="text-slate-800 dark:text-slate-200">{captureReceipt.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capture Reference:</span>
                <span className="text-slate-800 dark:text-slate-200">{captureReceipt.captureId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Settled Total:</span>
                <span className="font-bold text-emerald-600">${captureReceipt.total} USD</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              Done & Return to Workspace
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              Payment Capture Failed
            </h4>
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
              {errorMessage}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setStep('review')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
