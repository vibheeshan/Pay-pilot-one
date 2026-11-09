# PayPilot One – System Architecture

## 1. Unified Ecosystem Overview
PayPilot One connects 5 business modules into a shared data and security perimeter:
1. **PayPilot AI**: Business intelligence, customer CRM, catalog management, and sales velocity charts.
2. **AgentCart AI**: AI shopping assistant, catalog filtering, cart management, and PayPal Sandbox checkout.
3. **GiveAI**: Impact philanthropy campaigns, Gemini AI copywriting assistant, and verified donor ledgers.
4. **InvoiceMind AI**: Multi-item natural language invoicing, PDF export, and reminder workflows.
5. **PayPilot Copilot**: Multi-agent orchestrator with human confirmation approval gates.

---

## 2. Full-Stack Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 Frontend SPA                   │
│   (Tailwind v4, Lucide Icons, Recharts, jsPDF, Confetti)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Express Server (server.ts / Node.js)          │
│   - Port 3000 (Vite Middleware in dev / Static in prod)     │
│   - Authoritative Price Computation (SERVER_CATALOG)        │
│   - PayPal Orders & Capture API (Sandbox)                   │
│   - Idempotent Webhook Receiver & Event Ledger              │
│   - Server-Side Overdue Detection (/api/invoices/check)     │
│   - Cross-Module Reconciliation Engine (/api/reconciliation)│
│   - Google Gemini AI Client (@google/genai SDK)             │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│    Supabase PostgreSQL       │    │     Google Gemini AI         │
│   - 22 Normalized Tables     │    │   - Model: gemini-3.8-flash  │
│   - Row Level Security (RLS) │    │   - Server-side only         │
│   - Multi-Tenant Isolation   │    │   - Multi-agent dispatch     │
└──────────────────────────────┘    └──────────────────────────────┘
```

---

## 3. Server-Authoritative Price Calculation
Client applications never specify prices for checkout. When a cart is submitted to `/api/paypal/create-order`:
1. The server extracts `product_id`.
2. It looks up the authoritative price in `SERVER_PRODUCT_CATALOG`.
3. It multiplies by `quantity` and computes 8.25% sales tax.
4. It issues a signed `PAYPAL-SB-*` order ID.

---

## 4. Supabase Edge Functions Support
In addition to the Express server, 10 standalone Edge Functions reside in `/supabase/functions/` for Deno-based deployment:
- `ai-assistant`
- `business-insights`
- `product-recommendations`
- `generate-invoice`
- `paypal-create-order`
- `paypal-capture-order`
- `paypal-webhook`
- `payment-copilot`
- `notification-service`
- `generate-report`
