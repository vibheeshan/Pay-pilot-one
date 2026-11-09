import React, { useState } from 'react';
import { User, LogIn, UserPlus, LogOut, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { auth, TEST_USERS, AuthUser } from '../../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'switch' | 'signin' | 'signup'>('switch');
  const [currentUser, setCurrentUser] = useState<AuthUser>(auth.getCurrentUser());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSwitchUser = (user: AuthUser) => {
    auth.switchUser(user);
    setCurrentUser(user);
    setFeedback({ type: 'success', message: `Active workspace switched to ${user.business_name} (${user.full_name}).` });
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 600);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await auth.signIn(email, password);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 600);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await auth.signUp(email, password, fullName, businessName);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 600);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {import.meta.env.DEV ? 'Demo accounts (development only)' : 'User Account'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active: <span className="font-semibold text-slate-700 dark:text-slate-200">{currentUser.full_name}</span> ({currentUser.role})
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('switch')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'switch'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tenant Switcher
          </button>
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'signin'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'signup'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {feedback && (
          <div className={`mt-3 rounded-lg p-2.5 text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
          }`}>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* 1. Fast Tenant Switcher for Testing */}
        {activeTab === 'switch' && (
          <div className="mt-4 space-y-2.5">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Test Multi-Tenant Isolation & Role-Based Access:
            </span>
            {TEST_USERS.map((user) => {
              const isSelected = currentUser.id === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => handleSwitchUser(user)}
                  className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/30'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {user.full_name}
                    </span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {user.role}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{user.email}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {user.business_name}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-slate-400 text-[11px]">RLS Isolation Enforced</span>
              <button
                onClick={() => {
                  auth.signOut();
                  window.location.reload();
                }}
                className="flex items-center gap-1 text-rose-600 hover:underline text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Sign In Form */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@cloudpilot.io"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Sign In to PayPilot One
            </button>
          </form>
        )}

        {/* 3. Sign Up Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Business / Company Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Innovate Cloud Labs"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@innovate.co"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Create Account & Initialize Workspace
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
