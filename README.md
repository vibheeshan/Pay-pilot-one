# PayPilot One

> **One Intelligent Platform. Five Integrated Ecosystems. Authoritative Financial Operations.**

PayPilot One is a full-stack, multi-tenant business operations platform that unites real-time analytics, AI-assisted commerce, crowdfunding, intelligent invoicing, and a central multi-agent AI copilot — all backed by server-authoritative payment security and human-in-the-loop AI governance.

**Live demo:** [`https://paypilot-one.onrender.com`](https://paypilot-one.onrender.com)  
**Repository:** [`github.com/vibheeshan/paypilot-one`](https://github.com/vibheeshan/paypilot-one)

---

## Table of Contents

1. [Architecture](#architecture)
2. [The Five Ecosystems](#the-five-ecosystems)
3. [Database Schema](#database-schema)
4. [Authentication & Multi-Tenancy](#authentication--multi-tenancy)
5. [API Reference](#api-reference)
6. [Environment Variables](#environment-variables)
7. [Getting Started](#getting-started)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Architecture

```
┌──────────────────────────────────────────┐
│         React 19 + Vite Frontend         │
│   TypeScript · Tailwind v4 · Recharts    │
└─────────────────────┬────────────────────┘
                      │  HTTP / JSON (REST)
┌─────────────────────▼────────────────────┐
│        Express Application Server        │
│    Node.js · TypeScript · Zod · RLS      │
└───┬─────────────────┬────────────────┬───┘
    │                 │                │
    ▼                 ▼                ▼
PayPal REST      Supabase          Groq AI
(Sandbox)        PostgreSQL        (server-only)
Server catalog   22 tables         llama-3.3-70b
Amount verify    Row Level Sec.    Approval gate
Webhook sig      Multi-tenant      Allow-list
```

### Core Principles

| Principle | Detail |
| :--- | :--- |
| **Server-authoritative pricing** | All prices, taxes (8.25 % / 18 % GST), and totals are computed server-side against an immutable catalog. The client can never set a price. |
| **Real PayPal Sandbox** | Direct server-to-server calls to `v2/checkout/orders`. Captured amounts are verified against the original order. Webhooks are cryptographically verified and deduplicated. |
| **Human-in-the-loop AI** | High-impact AI actions (invoices, reminders, captures) require explicit user approval before execution. `requires_human_approval: true` is enforced by Zod schema. |
| **Zero client secret exposure** | `GROQ_API_KEY`, `PAYPAL_CLIENT_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` live only in server memory. CI confirms 0 occurrences in `dist/`. |
| **Dual-mode persistence** | Works with live Supabase PostgreSQL when credentials are present, or falls back to a fully functional in-browser state. |

---

## The Five Ecosystems

### 1. PayPilot AI — Business Intelligence & CRM
- **Revenue analytics**: sales velocity, 7-day run rate, and MRR powered by Recharts.
- **Customer CRM**: lifecycle management, transaction histories, lifetime value, and contact tracking.
- **Catalog management**: live stock control, SKU management, dynamic pricing, and CSV export.

### 2. AgentCart AI — AI Shopping Assistant & E-Commerce
- **Natural-language shopping**: budget-aware conversational search (*"Find developer tools under $100/mo"*).
- **Tamper-proof checkout**: server-catalog pricing pipeline → 8.25 % tax → PayPal Sandbox capture.
- **Fulfillment ledger**: itemized digital receipts and order tracking.

### 3. GiveAI — Philanthropy & Crowdfunding
- **Impact campaigns**: developer grants, open-source initiatives, and STEM education.
- **AI campaign assistant**: AI-assisted copy drafting for compelling campaign summaries.
- **Micro-donations**: flexible amounts via PayPal Sandbox with instant donor-wall updates.

### 4. InvoiceMind AI — Automated Invoicing & Collections
- **Smart invoice builder**: multi-item invoices from free-text English prompts (USD `$` and INR `₹`).
- **PDF generation**: client-ready PDFs via `jspdf` with payment-status stamps.
- **Overdue scanner**: background scanner (`/api/invoices/check-overdue`) stages collection reminders.
- **Human approval gate**: AI drafts require explicit review before dispatch.

### 5. PayPilot Copilot — Central Multi-Agent Operations
- **Agent routing**: six specialist agents (business, shopping, donation, invoice, payment, orchestrator).
- **Action allow-list**: only `create_invoice`, `send_invoice_reminder`, `capture_payment`, `reconcile_transaction`, `apply_discount` are permitted.
- **Approval cards**: every financial action surfaces an interactive confirmation card before execution.
- **Immutable audit log**: every approved action is recorded with actor, timestamp, payload, and status.

---

## Database Schema

22 normalized tables with Row Level Security on every table:

| Domain | Tables |
| :--- | :--- |
| **Identity & Access** | `profiles`, `businesses`, `business_members` (owner / admin / staff) |
| **CRM & Catalog** | `customers`, `product_categories`, `products` |
| **Orders & Commerce** | `carts`, `cart_items`, `orders`, `order_items` |
| **Payments & Gateway** | `payments`, `paypal_events` (dedup store), `transactions` |
| **Philanthropy** | `campaigns`, `donations` |
| **Invoicing** | `invoices`, `invoice_items` |
| **AI & Automation** | `ai_conversations`, `ai_messages`, `ai_action_logs` |
| **System & Compliance** | `notifications`, `audit_logs` |

### Applying Migrations

Run both SQL files in order inside the Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql   -- tables, indexes, FK constraints
supabase/migrations/002_auth_policies.sql    -- RLS policies, is_business_member(),
                                             -- create_business_with_owner() RPC,
                                             -- handle_new_user() trigger
```

---

## Authentication & Multi-Tenancy

Authentication is handled by **Supabase Auth** (email + password). Every new user goes through a one-time onboarding screen that creates their business row and owner membership.

### Supabase Dashboard Settings

| Setting | Value |
| :--- | :--- |
| Authentication → Providers → Email | **Enabled** |
| Site URL | `http://localhost:3000` (dev) / your Render URL (prod) |
| Redirect URLs | Add `http://localhost:3000/reset-password` and `https://<render>.onrender.com/reset-password` |
| Confirm email | **OFF** for quick testing; **ON** for production |

### Auth Flow

```
Sign up → Supabase Auth → handle_new_user() trigger creates profile
        → Onboarding screen → POST /api/onboarding/business
        → create_business_with_owner() RPC → dashboard
```

> **Email rate limits**: if Supabase's SMTP quota is exhausted, the frontend automatically falls back to `POST /api/auth/signup`, which uses the service-role admin API to create the user directly.

### Session Security

- Every protected route verifies the bearer token with `supabaseAdmin.auth.getUser(token)`.
- Demo token fallback is disabled in production (`NODE_ENV=production`).
- The test-user switcher is only rendered when `import.meta.env.DEV` is true.

---

## API Reference

All routes are in [`server.ts`](./server.ts), protected by rate limiting (`express-rate-limit`) and request validation (`Zod`).

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Server status, AI provider, PayPal and Supabase configuration flags. |
| `POST` | `/api/auth/signup` | Public | Admin-API signup bypass for Supabase email rate-limit situations. |
| `GET` | `/api/user/business` | Bearer | Returns the authenticated user's business (uses service role). |
| `POST` | `/api/onboarding/business` | Bearer | Creates business + owner membership atomically via RPC. |
| `POST` | `/api/paypal/create-order` | Bearer | Creates a PayPal Sandbox order with server-computed totals. |
| `POST` | `/api/paypal/capture-order` | Bearer | Captures a PayPal order and cross-checks the captured amount. |
| `POST` | `/api/paypal/webhook` | PayPal Sig | Ingests, verifies, and deduplicates PayPal webhook events. |
| `GET` | `/api/paypal/events` | Bearer | Returns recorded PayPal events for audit and reconciliation. |
| `POST` | `/api/copilot/chat` | Bearer | Multi-agent Groq AI copilot with approval gate and action allow-list. |
| `POST` | `/api/copilot/approve-action` | Bearer | Executes a user-approved AI action. |
| `POST` | `/api/reconciliation/run` | Bearer | 3-way cross-ledger reconciliation across orders, invoices, and PayPal. |
| `POST` | `/api/invoices/check-overdue` | Bearer | Scans for overdue accounts and stages reminder workflows. |

### `/api/health` Response Shape

```json
{
  "status": "ok",
  "timestamp": "2026-11-09T...",
  "aiProvider": "groq",
  "ai_available": true,
  "groq_configured": true,
  "paypal_configured": true,
  "paypal_webhook_configured": true,
  "supabase_configured": true,
  "environment": "production"
}
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. Variables prefixed `VITE_` are embedded in the browser bundle at build time — **never use `VITE_` for secrets**.

```bash
# ── Server ────────────────────────────────────────────────────────────────────
PORT=3000
NODE_ENV=production

# ── Groq AI (server-side only) ────────────────────────────────────────────────
# Get your free key at https://console.groq.com
GROQ_API_KEY="gsk_..."
GROQ_MODEL="llama-3.3-70b-versatile"

# ── Supabase (server-side — service role, never expose to browser) ─────────────
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."

# ── Supabase (client-side — anon key, safe to expose via VITE_ prefix + RLS) ──
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_..."

# ── PayPal Sandbox (server-side) ──────────────────────────────────────────────
PAYPAL_CLIENT_ID="your-client-id"
PAYPAL_CLIENT_SECRET="your-client-secret"
PAYPAL_WEBHOOK_ID="your-webhook-id"

# ── PayPal (client SDK init — public) ─────────────────────────────────────────
VITE_PAYPAL_CLIENT_ID="your-client-id"
```

> **Secret audit**: `npm run build` is followed by a `findstr` scan of `dist/*.js`. Any match on `gsk_`, `GROQ_API_KEY`, `sb_secret`, or `PAYPAL_CLIENT_SECRET` fails the pipeline.

---

## Getting Started

### Prerequisites

- **Node.js** v20+ (v18 minimum)
- **npm** v9+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key (free tier available)
- A [PayPal Developer](https://developer.paypal.com) sandbox app

### Local Setup

```bash
# 1. Clone
git clone https://github.com/vibheeshan/paypilot-one.git
cd paypilot-one

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Edit .env — fill in Supabase, Groq, and PayPal credentials

# 4. Apply database migrations (Supabase SQL Editor)
#    001_initial_schema.sql  then  002_auth_policies.sql

# 5. Start dev server
npm run dev
# → http://localhost:3000
```

### Production Build

```bash
npm run lint    # TypeScript type-check (must be 0 errors)
npm test        # Run all Vitest suites (must be all passing)
npm run build   # Vite production bundle → dist/
npm start       # Express server in production mode
```

---

## Testing

```bash
npm test
```

39 tests across 7 suites — all mocked, no network required:

| Suite | Tests | What it covers |
| :--- | :---: | :--- |
| `tests/invoice.test.ts` | 3 | Line-item math, tax rounding (8.25 %), discount accuracy |
| `tests/auth.test.ts` | 11 | Sign-up, sign-in, session, onboarding, protected routes |
| `tests/ai-approval.test.ts` | 2 | Human-in-the-loop gate, `requires_human_approval` enforcement |
| `tests/hardening.test.ts` | 15 | Zod schemas, rate-limit boundaries, unauthorized rejections |
| `tests/groq.test.ts` | 6 | Valid schema, bad-JSON fallback, allow-list, 429, missing key |
| `tests/webhook.test.ts` | 1 | PayPal webhook idempotency and replay protection |
| `tests/security.test.ts` | 1 | Server-authoritative price tamper resistance |

---

## Groq AI — Copilot Configuration

The Copilot uses [Groq](https://console.groq.com) (`llama-3.3-70b-versatile` by default). The API key **never leaves the server** — it is not bundled into the frontend build.

### How it works

1. `POST /api/copilot/chat` receives the user message and a structured business-context block.
2. The server builds two separate messages: a `system` prompt (guardrails + agent routing) and a `user` message (business context + query). They are **never string-concatenated**.
3. Groq returns a JSON object validated by `CopilotActionSchema` (Zod).
4. Any `action_type` not in the allow-list is stripped. Any action without `requires_human_approval: true` is rejected.
5. Financial amounts are always sourced from the server catalog — the model cannot set a price.

### Rate limits

Groq free-tier models have per-minute token limits. When the limit is reached, the server returns HTTP 429 and the UI shows:

> *"The assistant is busy. Please try again in a minute."*

No raw provider error or key value ever reaches the browser.

---

## Deployment

### Render (recommended)

A [`render.yaml`](./render.yaml) blueprint is included for one-click deploy.

1. Push this repository to GitHub.
2. In Render: **New → Blueprint Instance** → select the repo.
3. Add these secrets in the Render **Environment** tab:

   | Key | Where to get it |
   | :--- | :--- |
   | `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
   | `SUPABASE_URL` | Supabase project → Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
   | `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` |
   | `VITE_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
   | `PAYPAL_CLIENT_ID` | PayPal Developer Dashboard |
   | `PAYPAL_CLIENT_SECRET` | PayPal Developer Dashboard |
   | `PAYPAL_WEBHOOK_ID` | PayPal Developer → Webhooks |
   | `VITE_PAYPAL_CLIENT_ID` | Same as `PAYPAL_CLIENT_ID` |

4. Render runs `npm install && npm run build` and starts with `npm start` (`NODE_ENV=production tsx server.ts`).

> After deploy, update Supabase **Site URL** and **Redirect URLs** to your Render service URL.

---

## License

MIT — see [LICENSE](./LICENSE) for details.
