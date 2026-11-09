import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  Moon, 
  Bell, 
  Database, 
  Menu, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  X,
  LogOut,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { db } from '../../services/dbService';
import { getSupabaseConfig } from '../../services/supabaseClient';
import { auth, AuthUser } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationItem } from '../../types';

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenSupabaseModal: () => void;
  onOpenAuthModal: () => void;
  pageTitle: string;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  onToggleSidebar, 
  onOpenSupabaseModal, 
  onOpenAuthModal,
  pageTitle 
}) => {
  const [currentUser, setCurrentUser] = useState<AuthUser>(auth.getCurrentUser());
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user: authUser, business: authBusiness, signOut: authSignOut } = useAuth();

  const displayName = authUser?.user_metadata?.full_name || currentUser.full_name;
  const displayEmail = authUser?.email || currentUser.email;
  const displayRole = authBusiness?.role || currentUser.role;
  const displayBusiness = authBusiness?.name || currentUser.business_name;

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await authSignOut();
    auth.signOut();
    window.location.href = '/login';
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const update = () => {
      setNotifications(db.getNotifications());
      setSupabaseConfig(getSupabaseConfig());
      setCurrentUser(auth.getCurrentUser());
    };
    update();
    const unsubDb = db.subscribe(update);
    const unsubAuth = auth.subscribe(update);
    return () => {
      unsubDb();
      unsubAuth();
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between gap-8 border-b border-slate-200 bg-white/95 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      {/* Zone 1: Brand & Sidebar Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          title="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
          {pageTitle}
        </span>
      </div>

      {/* Zone 2: Actions & Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Persistence Status Badge */}
        <button
          onClick={onOpenSupabaseModal}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            db.isSupabaseLiveActive()
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
          }`}
          title={db.isSupabaseLiveActive() ? 'Connected and synced with Supabase PostgreSQL' : 'Data is saved locally in this browser'}
        >
          <Database className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {db.isSupabaseLiveActive() ? 'Supabase connected' : 'Saved in this browser'}
          </span>
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Notifications ({unreadCount} unread)
                </span>
                <button
                  onClick={() => db.markAllNotificationsRead()}
                  className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Mark all read
                </button>
              </div>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => db.markNotificationRead(n.id)}
                      className={`cursor-pointer rounded-lg p-2.5 transition-colors ${
                        n.is_read
                          ? 'bg-transparent text-slate-500 dark:text-slate-400'
                          : 'bg-indigo-50/60 dark:bg-indigo-950/40 text-slate-800 dark:text-slate-200 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Pill & Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity"
            title="User Account Menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white shadow-sm">
              {displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {displayRole}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {displayEmail}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                    {displayBusiness}
                  </span>
                  <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 capitalize font-semibold">
                    {displayRole}
                  </span>
                </div>
              </div>

              {/* Dev-only Demo Accounts Switcher */}
              {import.meta.env.DEV && (
                <div className="p-1 border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAuthModal();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                  >
                    <UserIcon className="h-4 w-4 text-indigo-500" />
                    <span>Demo accounts (development only)</span>
                  </button>
                </div>
              )}

              {/* Logout Button */}
              <div className="p-1">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
