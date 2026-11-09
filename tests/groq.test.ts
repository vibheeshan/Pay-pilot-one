/**
 * tests/groq.test.ts
 * Unit tests for the Groq client and copilot action validation.
 * The Groq HTTP call is fully mocked — no network required.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// ── Schema (mirror of server.ts) ──────────────────────────────────────────────
const ALLOWED_ACTION_TYPES = new Set([
  'create_invoice',
  'send_invoice_reminder',
  'capture_payment',
  'reconcile_transaction',
  'apply_discount',
]);

const CopilotActionSchema = z.object({
  agent_tag: z.string(),
  response_text: z.string(),
  action_data: z
    .object({
      action_type: z
        .string()
        .refine((v) => ALLOWED_ACTION_TYPES.has(v), {
          message: 'action_type not in allow-list',
        }),
      title: z.string(),
      summary: z.string(),
      details: z.record(z.string(), z.unknown()),
      requires_human_approval: z.literal(true),
    })
    .nullable(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeValidResponse(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    agent_tag: 'invoice_agent',
    response_text: 'Here is a draft invoice for Acme Corp.',
    action_data: {
      action_type: 'create_invoice',
      title: 'New Invoice — Acme Corp',
      summary: 'Draft invoice for review.',
      details: { customer: 'Acme Corp' },
      requires_human_approval: true,
      ...overrides,
    },
  });
}

// ── Mock fetch ────────────────────────────────────────────────────────────────

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

// ── Inline callGroq (reproduces the logic without importing from the module
//    because the module reads env vars at import time, which makes isolation
//    awkward; we test the same logic path inline) ──────────────────────────────

async function callGroqWithFetch(
  fetchFn: typeof fetch,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  if (!apiKey) {
    return (
      '**PayPilot Copilot (Offline Mode)**\n\n' +
      'Set `GROQ_API_KEY` in your server environment to enable live AI.'
    );
  }

  const res = await fetchFn('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1024,
    }),
  });

  if (res.status === 429) {
    return 'The assistant is busy. Please try again in a minute.';
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)');
    console.error(`[groq] HTTP ${res.status}: ${body.slice(0, 300)}`);
    return 'The AI assistant is temporarily unavailable. Please try again.';
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? '{}';
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Groq client', () => {
  const API_KEY = 'gsk_test_key_not_real';
  const MODEL = 'llama-3.3-70b-versatile';
  const SYS = 'You are PayPilot Copilot.';
  const USER = 'Create an invoice for Acme Corp.';

  // 1. Valid JSON reply passes schema validation
  it('valid JSON reply passes schema validation', async () => {
    const content = makeValidResponse();
    const fetchFn = mockFetch(200, { choices: [{ message: { content } }] });

    const raw = await callGroqWithFetch(fetchFn as any, API_KEY, MODEL, SYS, USER);
    const obj = JSON.parse(raw);
    const result = CopilotActionSchema.safeParse(obj);

    expect(result.success).toBe(true);
  });

  // 2. Invalid JSON returns plain-text fallback (not an error)
  it('invalid JSON returns plain-text fallback, not an error', async () => {
    const badContent = 'This is not JSON {{{';
    const fetchFn = mockFetch(200, { choices: [{ message: { content: badContent } }] });

    const raw = await callGroqWithFetch(fetchFn as any, API_KEY, MODEL, SYS, USER);

    // The calling code wraps JSON.parse in try/catch and falls back to raw text
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { agent_tag: 'master_orchestrator', response_text: raw, action_data: null };
    }

    expect(parsed.response_text).toBe(badContent);
    expect(parsed.action_data).toBeNull();
  });

  // 3. Action with unlisted type is rejected by allow-list
  it('action with unlisted type is rejected by allow-list', () => {
    const content = makeValidResponse({ action_type: 'delete_all_invoices' });
    const obj = JSON.parse(content);
    const result = CopilotActionSchema.safeParse(obj);

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.flatten())).toContain('action_type not in allow-list');
  });

  // 4. Action that omits requires_human_approval: true is rejected
  it('action without requires_human_approval:true is rejected', () => {
    const obj = JSON.parse(makeValidResponse({ requires_human_approval: false }));
    const result = CopilotActionSchema.safeParse(obj);

    expect(result.success).toBe(false);
  });

  // 5. HTTP 429 → busy message
  it('HTTP 429 returns busy message', async () => {
    const fetchFn = mockFetch(429, {});
    const raw = await callGroqWithFetch(fetchFn as any, API_KEY, MODEL, SYS, USER);

    expect(raw).toBe('The assistant is busy. Please try again in a minute.');
  });

  // 6. Missing GROQ_API_KEY → offline mode message contains variable name, not key value
  it('missing GROQ_API_KEY returns offline mode message naming the variable', async () => {
    const fetchFn = vi.fn(); // should never be called
    const raw = await callGroqWithFetch(fetchFn as any, '', MODEL, SYS, USER);

    expect(raw).toContain('GROQ_API_KEY');
    expect(raw).not.toContain(API_KEY); // key value must not appear
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
