import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

// Supabase configuration loaded strictly from environment variables (never from browser localStorage)
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 
                 (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || '';

  const isValidUrl = envUrl.startsWith('https://') && envUrl.includes('.supabase.co');
  const hasKey = Boolean(envKey && envKey.length > 20);

  return {
    url: envUrl,
    anonKey: envKey ? `${envKey.substring(0, 12)}...` : '',
    isConnected: isValidUrl && hasKey,
  };
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 
                 (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || '';

  if (envUrl && envKey && envUrl.startsWith('https://')) {
    try {
      cachedClient = createClient(envUrl, envKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return cachedClient;
    } catch (e) {
      console.warn('Supabase client failed to initialize:', e);
      return null;
    }
  }
  return null;
}

export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string }> {
  const targetUrl = url || (import.meta.env.VITE_SUPABASE_URL as string);
  const targetKey = anonKey || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string);

  if (!targetUrl || !targetKey) {
    return {
      success: false,
      message: 'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not set in .env.',
    };
  }

  try {
    const testClient = createClient(targetUrl, targetKey);
    const { error } = await testClient.from('businesses').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') {
        return { 
          success: true, 
          message: 'Connected to Supabase PostgreSQL! Tables not yet created — execute /supabase/migrations/001_initial_schema.sql in the Supabase SQL editor.' 
        };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Verified active connection with live Supabase PostgreSQL tables.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network connection failed.' };
  }
}
