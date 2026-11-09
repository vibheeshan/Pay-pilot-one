import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar,
  X,
  History,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { db } from '../../services/dbService';
import { apiFetch } from '../../services/apiClient';
import { Campaign, Donation } from '../../types';
import { PayPalCheckoutModal } from '../../components/layout/PayPalCheckoutModal';

export const GiveAIView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(db.getCampaigns());
  const [donations, setDonations] = useState<Donation[]>(db.getDonations());
  const [activeTab, setActiveTab] = useState<'campaigns' | 'history'>('campaigns');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedCampaignForDonation, setSelectedCampaignForDonation] = useState<Campaign | null>(null);
  const [customDonationAmount, setCustomDonationAmount] = useState<number>(50);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    goal_amount: 10000,
    currency: 'USD' as const,
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    status: 'active' as const,
    start_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const update = () => {
      setCampaigns(db.getCampaigns());
      setDonations(db.getDonations());
    };
    const unsub = db.subscribe(update);
    return unsub;
  }, []);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.title.trim()) {
      setValidationError('Please provide a campaign title.');
      return;
    }
    if (!newCampaign.description.trim()) {
      setValidationError('Please provide a campaign description.');
      return;
    }
    setValidationError(null);
    db.addCampaign(newCampaign);
    setShowCreateModal(false);
    setNewCampaign({
      title: '',
      description: '',
      goal_amount: 10000,
      currency: 'USD',
      image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleUpdateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    db.updateCampaign(editingCampaign.id, {
      title: editingCampaign.title,
      description: editingCampaign.description,
      goal_amount: editingCampaign.goal_amount,
      status: editingCampaign.status,
    });
    setEditingCampaign(null);
  };

  // AI Campaign description generation assistant via /api/copilot/chat
  const handleGenerateAiDescription = async () => {
    if (!newCampaign.title.trim()) {
      setValidationError('Please enter a campaign title first to generate AI copy.');
      return;
    }
    setValidationError(null);
    setIsAiGenerating(true);
    try {
      const res = await apiFetch('/api/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: `Write a compelling, professional, 2-paragraph fundraising description for a tech campaign titled: "${newCampaign.title}" with a goal of $${newCampaign.goal_amount}. Focus on clear impact and community value.`,
        }),
      });
      const data = await res.json();
      if (data.response_text) {
        setNewCampaign((prev) => ({
          ...prev,
          description: data.response_text.replace(/\*\*/g, '').replace(/###/g, '').trim(),
        }));
      }
    } catch (e) {
      console.warn('AI Copywriting fallback:', e);
      setNewCampaign((prev) => ({
        ...prev,
        description: `Empowering developers and researchers through transparent community grants for ${prev.title}. Every dollar accelerates open infrastructure and technological accessibility.`,
      }));
    } finally {
      setIsAiGenerating(false);
    }
  };

  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised_amount, 0);
  const totalDonors = campaigns.reduce((sum, c) => sum + c.donors_count, 0);

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Sandbox Warning Banner */}
      <div className="rounded-xl border border-amber-300/40 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="font-semibold">
            Sandbox – test transactions only. No live credit cards or actual funds are charged.
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60">
          PayPal Sandbox
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>Module 3</span>
            <span aria-hidden="true">·</span>
            <span>AI Crowdfunding & Impact Philanthropy</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            GiveAI Donation Platform
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Empower technological breakthroughs, open developer tooling, and STEM initiatives with verified PayPal Sandbox support.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tab Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === 'campaigns'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Active Campaigns ({campaigns.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Donation History ({donations.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              setValidationError(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Launch Campaign</span>
          </button>
        </div>
      </div>

      {/* Aggregate Impact Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Total Philanthropic Volume</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            ${totalRaised.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Processed via PayPal Sandbox</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Active Contributors</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {totalDonors} verified donors
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Global developer community</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Campaigns Supported</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {campaigns.length} Initiatives
          </div>
          <span className="text-xs text-emerald-600 mt-1 block">100% Sandbox verified</span>
        </div>
      </div>

      {/* TAB 1: CAMPAIGNS GRID */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((camp) => {
            const percent = Math.min(100, Math.round((camp.raised_amount / camp.goal_amount) * 100));
            return (
              <div
                key={camp.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="capitalize font-semibold text-indigo-600 dark:text-indigo-400">
                      {camp.status} Campaign
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{camp.donors_count} donors</span>
                      <button
                        onClick={() => setEditingCampaign(camp)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Edit Campaign Details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                    {camp.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {camp.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        ${camp.raised_amount.toLocaleString()} <span className="text-slate-400 font-sans">raised</span>
                      </span>
                      <span className="text-slate-500">
                        Goal: ${camp.goal_amount.toLocaleString()} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Donation Trigger Box */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    {[25, 50, 100, 250].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => {
                          setSelectedCampaignForDonation(camp);
                          setCustomDonationAmount(amt);
                        }}
                        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 transition-colors"
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCampaignForDonation(camp);
                      setCustomDonationAmount(50);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-colors"
                  >
                    <HeartHandshake className="h-4 w-4" />
                    <span>Donate with PayPal Sandbox</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: DONATIONS & DONORS HISTORY */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Donation Ledger & Contributor Records
              </h3>
              <p className="text-xs text-slate-400">
                Verified PayPal sandbox contributions recorded in real-time
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              {donations.length} records verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-500 font-semibold">
                <tr>
                  <th className="p-4">DONOR</th>
                  <th className="p-4">CAMPAIGN</th>
                  <th className="p-4">DATE & TIME</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4">PAYPAL CAPTURE REF</th>
                  <th className="p-4 text-right">AMOUNT (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-sans text-xs">
                      No donations recorded yet. Make a sandbox donation to test this ledger!
                    </td>
                  </tr>
                ) : (
                  donations.map((don) => {
                    const matchedCamp = campaigns.find((c) => c.id === don.campaign_id);
                    return (
                      <tr key={don.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-sans">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {don.donor_display_name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {don.donor_email}
                          </span>
                        </td>
                        <td className="p-4 font-sans text-slate-700 dark:text-slate-300">
                          {matchedCamp?.title || 'Tech Community Grant'}
                        </td>
                        <td className="p-4 text-slate-400 text-[11px]">
                          {new Date(don.created_at).toLocaleDateString()} {new Date(don.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 uppercase">
                            <ShieldCheck className="h-3 w-3" />
                            <span>{don.status}</span>
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 text-[11px]">
                          {don.payment_id || 'PAYPAL_SANDBOX_TX'}
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          +${don.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Campaign */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Launch GiveAI Campaign
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {validationError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  placeholder="e.g. Open-Source AI Security Benchmarks"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Fundraising Goal ($ USD) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  value={newCampaign.goal_amount}
                  onChange={(e) => setNewCampaign({ ...newCampaign, goal_amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Campaign Description & Mission *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAiDescription}
                    disabled={isAiGenerating}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400 disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{isAiGenerating ? 'AI Generating...' : 'Generate with AI'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="Explain why this initiative matters, key deliverables, and community impact..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Publish Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Campaign */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Campaign Details
              </h3>
              <button
                onClick={() => setEditingCampaign(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCampaign} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingCampaign.title}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Fundraising Goal ($ USD) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  value={editingCampaign.goal_amount}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, goal_amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Campaign Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingCampaign.description}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Update Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Donation PayPal Checkout Modal */}
      {selectedCampaignForDonation && (
        <PayPalCheckoutModal
          isOpen={Boolean(selectedCampaignForDonation)}
          onClose={() => setSelectedCampaignForDonation(null)}
          donationAmount={customDonationAmount}
          campaignId={selectedCampaignForDonation.id}
          campaignTitle={selectedCampaignForDonation.title}
          onSuccess={() => setSelectedCampaignForDonation(null)}
        />
      )}
    </div>
  );
};
