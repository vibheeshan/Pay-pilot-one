/**
 * apiClient.ts
 * Thin wrapper around fetch that:
 *  1. Attaches the Supabase JWT as Bearer token on every /api/* request.
 *  2. In production builds, strictly requires an authentic session token.
 *  3. In development mode (import.meta.env.DEV), falls back to demo token when Supabase is disconnected.
 */

import { getSupabaseClient } from './supabaseClient';

const DEMO_TOKEN = 'demo.eyJzdWIiOiJkZW1vLXVzZXIiLCJlbWFpbCI6ImRlbW9AcGF5cGlsb3Qub25lIiwiZXhwIjo5OTk5OTk5OTk5fQ.demo';

export async function getBearerToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        return data.session.access_token;
      }
    }
  } catch (e) {
    // Supabase client failure
  }

  // In production builds, never return a demo token
  if (!import.meta.env.DEV) {
    return null;
  }

  return DEMO_TOKEN;
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getBearerToken();

  // In production, if no authentic token is present, block call and redirect
  if (!token && !import.meta.env.DEV) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return new Response(JSON.stringify({ error: 'Unauthorized: active session required.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers = new Headers(options.headers as HeadersInit | undefined);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}
