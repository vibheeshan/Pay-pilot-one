/**
 * server/ai/groqClient.ts
 * Server-only Groq API client. The key never leaves the server process.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TIMEOUT_MS   = 20_000;
const MAX_TOKENS   = 1024;

// Fail fast at startup if the key is absent.
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? '';
const GROQ_MODEL   = process.env.GROQ_MODEL   || 'llama-3.3-70b-versatile';

if (!GROQ_API_KEY) {
  // Log a startup warning (not a hard exit — allows server to still serve non-AI routes)
  console.warn(
    '[groq] GROQ_API_KEY is not set. AI features will return offline mode message.',
  );
}

/**
 * Returns whether the Groq client is configured (key present).
 * Use this in /api/health instead of exposing the key value.
 */
export function isGroqConfigured(): boolean {
  return Boolean(GROQ_API_KEY);
}

/**
 * Calls the Groq chat completions endpoint.
 * @param systemPrompt  System-level instructions for the model.
 * @param userMessage   The user's message (never merged into the system prompt).
 * @returns The raw text from the model's first choice message, or a safe fallback string.
 */
export async function callGroq(systemPrompt: string, userMessage: string): Promise<string> {
  if (!GROQ_API_KEY) {
    return (
      '**PayPilot Copilot (Offline Mode)**\n\n' +
      'Set `GROQ_API_KEY` in your server environment to enable live AI.'
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage  },
        ],
        response_format: { type: 'json_object' },
        max_tokens: MAX_TOKENS,
      }),
    });

    clearTimeout(timer);

    if (res.status === 429) {
      console.warn('[groq] Rate limited (HTTP 429)');
      return 'The assistant is busy. Please try again in a minute.';
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '(no body)');
      // Log details server-side; return generic message to browser.
      console.error(`[groq] HTTP ${res.status}: ${body.slice(0, 300)}`);
      return 'The AI assistant is temporarily unavailable. Please try again.';
    }

    const json = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return json.choices?.[0]?.message?.content ?? '{}';
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      console.error('[groq] Request timed out after 20 s');
      return 'The AI assistant timed out. Please try again.';
    }
    console.error('[groq] Unexpected error:', err.message);
    return 'The AI assistant is temporarily unavailable. Please try again.';
  }
}
