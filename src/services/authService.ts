import { getSupabaseClient } from './supabaseClient';
import { Profile } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'staff';
  business_id: string;
  business_name: string;
  avatar_url?: string;
}

// Development-only demo test accounts
export const TEST_USERS: AuthUser[] = [
  {
    id: 'usr_owner_a',
    email: 'alex@cloudpilot.io',
    full_name: 'Alex Mercer',
    role: 'owner',
    business_id: 'biz_cloudpilot_01',
    business_name: 'CloudPilot Technologies Inc.',
  },
  {
    id: 'usr_tenant_b',
    email: 'elena@bytescale.dev',
    full_name: 'Elena Rostova (Tenant B)',
    role: 'owner',
    business_id: 'biz_bytescale_02',
    business_name: 'ByteScale Labs Inc.',
  },
  {
    id: 'usr_staff_c',
    email: 'marcus@cloudpilot.io',
    full_name: 'Marcus Vance',
    role: 'staff',
    business_id: 'biz_cloudpilot_01',
    business_name: 'CloudPilot Technologies Inc.',
  },
];

const AUTH_STORAGE_KEY = 'paypilot_auth_user';

class AuthService {
  private currentUser: AuthUser = TEST_USERS[0];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {
      this.currentUser = TEST_USERS[0];
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getCurrentUser(): AuthUser {
    return this.currentUser;
  }

  public async signUp(email: string, password: string, fullName: string, businessName: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
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
        if (error) return { success: false, message: error.message };
        return { success: true, message: `Account created for ${email}.` };
      } catch (err: any) {
        return { success: false, message: err?.message || 'Registration failed.' };
      }
    }

    if (import.meta.env.DEV) {
      const newUser: AuthUser = {
        id: `usr_${Date.now()}`,
        email,
        full_name: fullName,
        role: 'owner',
        business_id: `biz_${Date.now()}`,
        business_name: businessName,
      };
      this.currentUser = newUser;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      this.notify();
      return { success: true, message: `Account created for ${email}.` };
    }

    return { success: false, message: 'Authentication service unavailable.' };
  }

  public async signIn(email: string, password: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, message: error.message };
        return { success: true, message: 'Successfully signed in.' };
      } catch (err: any) {
        return { success: false, message: err?.message || 'Login failed.' };
      }
    }

    if (import.meta.env.DEV) {
      const matched = TEST_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      const userToSet: AuthUser = matched || {
        id: `usr_${Date.now()}`,
        email,
        full_name: email.split('@')[0],
        role: 'owner',
        business_id: `biz_${Date.now()}`,
        business_name: `${email.split('@')[0]}'s Workspace`,
      };
      this.currentUser = userToSet;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userToSet));
      this.notify();
      return { success: true, message: `Logged in as ${userToSet.full_name}.` };
    }

    return { success: false, message: 'Authentication service unavailable.' };
  }

  public switchUser(user: AuthUser) {
    if (!import.meta.env.DEV) return;
    this.currentUser = user;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    this.notify();
  }

  public signOut() {
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (import.meta.env.DEV) {
      this.currentUser = TEST_USERS[0];
    }
    this.notify();
  }
}

export const auth = new AuthService();
