# PayPilot One – Security Architecture & Audit Report

## 1. Zero Secret Leakage to Client Bundle
- **Google Gemini API Key**: `GEMINI_API_KEY` is loaded exclusively inside `server.ts` via Node.js environment variables. It is never prefixed with `VITE_` and never included in `vite.config.ts` `define`.
- **PayPal Client Secret**: `PAYPAL_CLIENT_SECRET` is kept on the backend. Only the public sandbox Client ID is exposed to checkout interfaces.
- **Supabase Credentials**: Loaded from environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`). No credentials are typed into or stored in browser `localStorage`.

---

## 2. Server-Side Financial Authorization
- Client inputs (e.g., cart items) cannot dictate product unit prices. The backend verifies all line item prices against `SERVER_PRODUCT_CATALOG`.
- Tax calculation (8.25%) is computed authoritatively on the server.
- Order settlement cannot be spoofed by browser redirects; it requires server-side `/api/paypal/capture-order` verification.

---

## 3. Webhook Idempotency & Signature Verification
- Webhook events are processed idempotently using unique event IDs (`paypal-event-id` or payload `id`).
- Duplicate events return HTTP 200 with `{ status: 'already_processed' }`.
- Events are logged in an immutable ledger accessible via `/api/paypal/events`.

---

## 4. AI Guardrails & Human Approval Gate
- The AI orchestrator (`/api/copilot/chat`) cannot directly write payment or invoice statuses to the database.
- Any state-mutating intent (creating an invoice, dispatching an overdue reminder, issuing a refund) returns:
  ```json
  {
    "action_data": {
      "requires_human_approval": true
    }
  }
  ```
- The frontend renders an interactive confirmation modal. Database mutations occur only when the human user explicitly clicks "Approve & Execute".

---

## 5. Immutable Audit Trail
All critical events write an audit record to `audit_logs`:
- `INVOICE_CREATED`
- `INVOICE_UPDATED`
- `REMINDER_SENT`
- `ORDER_COMPLETED`
- `DONATION_RECEIVED`
- `CUSTOMER_CREATED`
- `CUSTOMER_UPDATED`
- `CUSTOMER_DELETED`
