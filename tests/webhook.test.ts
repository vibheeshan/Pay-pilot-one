import { describe, it, expect } from 'vitest';

describe('PayPal Sandbox Webhook – Idempotency & Deduplication', () => {
  it('detects and skips duplicate webhook events using eventId store', () => {
    const processedEvents = new Set<string>();

    const handleWebhook = (eventId: string, payload: any) => {
      if (processedEvents.has(eventId)) {
        return { status: 'already_processed', eventId };
      }
      processedEvents.add(eventId);
      return { status: 'received', eventId, type: payload.event_type };
    };

    const eventId = 'evt_test_unique_998877';
    const payload = { event_type: 'PAYMENT.CAPTURE.COMPLETED', amount: '249.00' };

    // First delivery
    const res1 = handleWebhook(eventId, payload);
    expect(res1.status).toBe('received');
    expect(res1.eventId).toBe(eventId);

    // Duplicate delivery
    const res2 = handleWebhook(eventId, payload);
    expect(res2.status).toBe('already_processed');
    expect(res2.eventId).toBe(eventId);

    // Check size remains 1
    expect(processedEvents.size).toBe(1);
  });
});
