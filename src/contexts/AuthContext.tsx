import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient } from '../services/supabaseClient';
import { apiFetch } from '../services/apiClient';

export interface BusinessInfo {
  id: string;
  name: string;
  currency: string;
  tax_rate: number;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  business: BusinessInfo | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string, businessName: string) => Promise<{ session: Session | null; user: User | null; error?: string }>;
  signOut: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
  setBusiness: (b: BusinessInfo | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserBusiness = async (_accessToken?: string) => {
    try {
      // 1. Authoritative server endpoint (bypasses any client-side RLS quirks)
      try {
        const res = await apiFetch('/api/user/business');
        if (res.ok) {
          const data = await res.json();
          if (data?.business) {
            setBusiness(data.business);
            return;
          }
        }
      } catch (err) {
        // Fallback to client query if server endpoint unreachable
      }

      // 2. Direct client query
      const supabase = getSupabaseClient();
      if (!supabase) {
        setBusiness(null);
        return;
      }

      // Query business membership
      const { data: memberData } = await supabase
        .from('business_members')
        .select('business_id, role, businesses(id, name, currency, tax_rate)')
        .limit(1)
        .maybeSingle();

      if (memberData && memberData.businesses) {
        const b = memberData.businesses as any;
        setBusiness({
          id: b.id,
          name: b.name,
          currency: b.currency || 'USD',
          tax_rate: b.tax_rate ?? 8.25,
          role: memberData.role || 'owner',
        });
      } else {
        setBusiness(null);
      }
    } catch (e) {
      console.warn('[AuthContext] Error loading user business:', e);
      setBusiness(null);
    }
  };

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserBusiness(session.access_token).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserBusiness(session.access_token);
      } else {
        setBusiness(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: 'Supabase authentication service is not configured.' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    setSession(data.session);
    setUser(data.user);
    if (data.session) {
      await fetchUserBusiness(data.session.access_token);
    }
    return {};
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    businessName: string
  ): Promise<{ session: Session | null; user: User | null; error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { session: null, user: null, error: 'Supabase authentication service is not configured.' };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          business_name: businessName,
        },
      },
    });

    if (error) {
      // If Supabase free tier email rate limit is hit, gracefully provision via server
      if (error.message.toLowerCase().includes('rate limit')) {
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName, businessName }),
          });

          if (res.ok) {
            // Sign in directly with the newly created verified credentials
            const signInRes = await supabase.auth.signInWithPassword({ email, password });
            if (!signInRes.error && signInRes.data.session) {
              setSession(signInRes.data.session);
              setUser(signInRes.data.user);
              return { session: signInRes.data.session, user: signInRes.data.user };
            }
          }
        } catch (e) {
          // Fall through to original error if server call fails
        }
      }
      return { session: null, user: null, error: error.message };
    }

    setSession(data.session);
    setUser(data.user);
    return { session: data.session, user: data.user };
  };

  const signOut = async (): Promise<void> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    setSession(null);
    setBusiness(null);
    localStorage.removeItem('paypilot_auth_user');
  };

  const refreshBusiness = async () => {
    if (session?.access_token) {
      await fetchUserBusiness(session.access_token);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Restoring session...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        business,
        loading,
        signIn,
        signUp,
        signOut,
        refreshBusiness,
        setBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
