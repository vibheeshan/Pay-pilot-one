# PayPilot One

> **One Intelligent Platform. Five Integrated Ecosystems. Authoritative Financial Operations.**

PayPilot One is a full-stack, enterprise-grade business operations platform uniting real-time analytics, AI-assisted commerce, crowdfunding, intelligent invoicing, and a central multi-agent AI operations copilot. Engineered with strict server-authoritative payment security, human-in-the-loop AI governance, and multi-tenant data isolation.

---

## Architecture Overview

```
                      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                      â”‚          React 19 + Vite Client         â”‚
                      â”‚  (Tailwind CSS v4 Â· Recharts Â· Lucide) â”‚
                      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                          â”‚
                                 HTTP / JSON (REST API)
                                          â”‚
                      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                      â”‚         Express Application Server     â”‚
                      â”‚  (Node.js Â· TypeScript Â· Rate Limiter) â”‚
                      â””â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”˜
                          â”‚                   â”‚              â”‚
             PayPal REST API & Webhooks       â”‚          Groq AI API
                           â”‚                   â”‚     (llama-3.3-70b-versatile)
            â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”‚              â”‚
            â”‚ PayPal Sandbox Engine â”‚         â”‚     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”
            â”‚ - Server Catalog      â”‚         â”‚     â”‚ Multi-Agent AI  â”‚
            â”‚ - Amount Verification â”‚         â”‚     â”‚ - Approval Gate â”‚
            â”‚ - Webhook Sig Check   â”‚         â”‚     â”‚ - Tool Actions  â”‚
            â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â”‚     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                              â”‚
                                 Supabase PostgreSQL (22 Tables)
                                 - Row Level Security (RLS)
                                 - Multi-Tenant Isolation
                                 - Edge Functions
```

### Core Architecture Principles

1. **Server-Authoritative Pricing & Catalog**: All item prices, taxes (8.25%), and order totals are calculated and validated server-side against an immutable catalog. Client requests cannot tamper with unit prices or charge amounts.
2. **Real PayPal Sandbox Integration**: Direct server-to-server interaction with PayPal's REST API (`v2/checkout/orders`) for order creation, capture validation, amount cross-checks, and cryptographically verified webhooks with deduplication.
3. **Multi-Agent AI with Human-in-the-Loop Governance**: AI copilot runs on Groq (`llama-3.3-70b-versatile`). High-impact operations (issuing invoices, processing refunds, capturing payments) generate structured approval cards that require explicit human approval before execution.
4. **Zero Client Secret Exposure**: Sensitive keys (`GROQ_API_KEY`, `PAYPAL_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) reside strictly in server memory and are never bundled into client assets.
5. **Dual-Mode Persistence**: Seamlessly operates with live Supabase PostgreSQL when credentials are provided, or falls back gracefully to a fully functional in-browser sandbox state.

---

## The Five Integrated Ecosystems

### 1. PayPilot AI (Business Intelligence & CRM)
- **Revenue Analytics**: Dynamic sales velocity, 7-day run rate, and monthly recurring revenue (MRR) tracking powered by Recharts.
- **Customer CRM**: Complete customer lifecycle management, transaction histories, lifetime value calculations, and contact tracking.
- **Catalog Management**: Live stock inventory control, SKU management, dynamic price configuration, and CSV export.

### 2. AgentCart AI (AI Shopping Assistant & E-Commerce)
- **Natural Language Shopping**: Budget-aware conversational search (e.g., *"Find developer tools under $100/mo"*).
- **Curated Cloud Catalog**: Pre-configured SaaS tools and cloud infrastructure items.
- **Tamper-Proof Checkout**: Authoritative pricing pipeline, 8.25% sales tax calculation, and direct PayPal Sandbox checkout.
- **Fulfillment Ledger**: Itemized digital receipt generation and order tracking.

### 3. GiveAI (Philanthropy & Crowdfunding)
- **Impact Campaigns**: Support developer grants, open-source initiatives, and STEM education campaigns.
- **AI Campaign Assistant**: AI-assisted copy drafting to generate compelling campaign summaries.
- **Micro-Donations**: Flexible donation amounts processed through PayPal Sandbox with instant donor wall ledger updates.

### 4. InvoiceMind AI (Automated Invoicing & Collections)
- **Smart Invoice Builder**: Create multi-item invoices manually or parse plain English prompts into structured billing items (supporting USD `$` and INR `â‚¹`).
- **PDF Generation**: Generates client-ready PDF invoices (`jspdf`) with payment status stamps and itemized totals.
- **Overdue Account Scanner**: Automated background scanner (`/api/invoices/check-overdue`) that identifies overdue balances and prepares friendly reminder workflows.
- **Human Approval Gate**: AI-generated drafts require explicit user review before issuing.

### 5. PayPilot Copilot (Central Multi-Agent Operations)
Coordinated multi-agent architecture with specialized task delegators:
- **Business Analyst Agent**: Queries revenue trends, MRR, and customer cohort analytics.
- **Shopping Assistant Agent**: Handles product search, pricing comparisons, and stock inquiries.
- **Donation Operations Agent**: Monitors campaign progress and donor participation metrics.
- **Invoicing Specialist Agent**: Drafts itemized bills and scans for outstanding balances.
- **Payment Operations Agent**: Cross-checks PayPal capture events and reconciliation state.
- **Action Approval Cards**: High-privilege actions display interactive confirmation modals; no mutations occur without explicit human authorization.
- **Immutable Audit Logging**: Every approved action is logged with actor, timestamp, payload, and status.

---

## Compliance, Reconciliation & Testing Modules

- **Cross-Module Reconciliation (`/reconciliation`)**: Automated 3-way reconciliation engine matching AgentCart orders, InvoiceMind settlements, and verified PayPal transactions to identify orphaned or uncaptured payments.
- **Security Audit Trail (`/audit-logs`)**: Filterable, searchable system audit log tracking all operational events, with CSV export.
- **QA Test Matrix (`/audit`)**: Built-in developer verification suite executing real-time tests against backend health, catalog math, RLS policies, and AI tool calling guardrails (available in dev mode).

---

## Supabase Database Schema

The database schema consists of **22 normalized relational tables** with Row Level Security (RLS) enabled on all tables:

| Schema Domain | Tables |
| :--- | :--- |
| **Identity & Access** | `profiles`, `businesses`, `business_members` (RBAC: owner, admin, staff) |
| **CRM & Catalog** | `customers`, `product_categories`, `products` |
| **Orders & Commerce** | `carts`, `cart_items`, `orders`, `order_items` |
| **Payments & Gateway** | `payments`, `paypal_events` (deduplication store), `transactions` |
| **Philanthropy** | `campaigns`, `donations` |
| **Invoicing** | `invoices`, `invoice_items` |
| **AI & Automation** | `ai_conversations`, `ai_messages`, `ai_action_logs` |
| **System & Compliance** | `notifications`, `audit_logs` |

The schema migration files are located at:
```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_auth_policies.sql
```

To apply the schema and security policies to your Supabase project:
1. Open your Supabase Project Dashboard.
2. Navigate to the **SQL Editor**.
3. First execute `001_initial_schema.sql` to establish the tables and base relations.
4. Then execute `002_auth_policies.sql` to apply the `is_business_member` security definer helper, atomic onboarding RPC (`create_business_with_owner`), `auth.users` profile creation trigger, and anti-recursion RLS policies.

### Supabase Authentication Dashboard Configuration

Configure the following settings in your Supabase Project Dashboard:
- **Authentication â†’ Providers â†’ Email**: Ensure Email provider is **Enabled**.
- **Authentication â†’ URL Configuration**:
  - **Site URL**: `http://localhost:3000` (development) or `https://<your-render-service>.onrender.com` (production).
  - **Redirect URLs**: Add both `http://localhost:3000/reset-password` and `https://<your-render-service>.onrender.com/reset-password`.
- **Confirm email**: For testing and competition submission builds, **Confirm email** can be toggled **OFF** in Authentication â†’ Providers â†’ Email to allow direct sign-in and onboarding immediately after sign-up without waiting for SMTP dispatch. For live production, toggle **ON**.

---

## Server API Reference

All backend routes are defined in [`server.ts`](file:///f:/Downloads/paypilot-one/server.ts) and protected with rate limiting (`express-rate-limit`) and request validation (`Zod`):

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status, uptime, database connectivity, and configured AI model. |
| `POST` | `/api/paypal/create-order` | Optional Bearer | Creates a verified PayPal Sandbox order with server-calculated totals. |
| `POST` | `/api/paypal/capture-order` | Optional Bearer | Captures a PayPal order and validates captured funds against order amount. |
| `POST` | `/api/paypal/webhook` | PayPal Signature | Ingests PayPal webhooks, verifies signatures, and deduplicates event IDs. |
| `GET` | `/api/paypal/events` | Required Bearer | Retrieves recorded PayPal webhook events for audit and reconciliation. |
| `POST` | `/api/copilot/chat` | Required Bearer | Multi-agent AI assistant powered by Groq AI with rate limiting. |
| `POST` | `/api/copilot/approve-action` | Required Bearer | Executes a user-approved AI action (e.g., invoice generation, payment capture). |
| `POST` | `/api/reconciliation/run` | Required Bearer | Performs automated cross-ledger reconciliation check across all modules. |
| `POST` | `/api/invoices/check-overdue` | Required Bearer | Scans for overdue accounts and stages collection reminder workflows. |
| `POST` | `/api/onboarding/business` | Required Bearer | Atomically creates business, owner membership, and profile via RPC/service role. |

---

## Environment Variables

Create a `.env` file in the project root:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Groq AI API (Server-Only — Never Bundled into Frontend)
# Get your key at https://console.groq.com
GROQ_API_KEY="gsk_..."
GROQ_MODEL="llama-3.3-70b-versatile"

# Supabase Configuration
# Server variables (used for direct database queries and RLS bypass when needed)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."

# Client variables (baked into Vite bundle for client-side queries)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_..."

# PayPal Sandbox Configuration
# Server variables (used for REST authentication and signature verification)
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_WEBHOOK_ID="your-sandbox-webhook-id"

# Client variable (used for client SDK initialization)
VITE_PAYPAL_CLIENT_ID="your-paypal-client-id"
```

> **Security Note:** All private secrets (`GROQ_API_KEY`, `PAYPAL_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) are kept on the server. Automated checks confirm 0 occurrences of API secrets in the `dist/` production client bundle.

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/paypilot-one.git
   cd paypilot-one
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

### Production Build

```bash
# Type check the codebase
npm run lint

# Build production assets with Vite
npm run build

# Start the production Express server
npm start
```

---

## Testing & Quality Assurance

The project includes unit, integration, and security test suites powered by [Vitest](https://vitest.dev/):

```bash
# Run all test suites
npm test
```

### Test Coverage Areas
1. **Invoice Calculations (`tests/invoice.test.ts`)**: Line item mathematics, tax rounding (8.25%), and discount accuracy.
2. **Webhook Idempotency (`tests/webhook.test.ts`)**: Duplicate event prevention, idempotency verification, and replay protection.
3. **AI Approval Gate (`tests/ai-approval.test.ts`)**: Validation of human-in-the-loop requirements before sensitive actions commit.
4. **Security & Pricing Integrity (`tests/security.test.ts`)**: Server-authoritative price validation and tamper resistance.
5. **API Hardening (`tests/hardening.test.ts`)**: Zod input validation schemas, rate-limiting boundaries, and unauthorized access rejections.
6. **Groq AI Client (`tests/groq.test.ts`)**: Schema allow-list validation, JSON fallback on bad model output, 429 busy handling, and missing API key behaviour.

---

## Groq AI Configuration

PayPilot Copilot uses [Groq](https://console.groq.com) for all AI features. The key is **server-side only** and never bundled into the browser build.

### Setup
1. Create a free account at <https://console.groq.com> and generate an API key.
2. Add to your `.env`:
   ```bash
   GROQ_API_KEY="gsk_..."
   GROQ_MODEL="llama-3.3-70b-versatile"   # or any model you have access to
   ```
3. If `GROQ_API_KEY` is absent, the copilot returns an offline-mode message; all other routes continue to work.

### Rate limits
Groq free-tier models have per-minute token limits. When the limit is hit the server returns HTTP 429 and the UI shows **"The assistant is busy. Please try again in a minute."** — no raw provider error reaches the browser.

---

## Deployment

### Render Deployment
This repository includes a [`render.yaml`](file:///f:/Downloads/paypilot-one/render.yaml) blueprint file for one-click deployment:

1. Connect your repository to Render.
2. Select **New Blueprint Instance**.
3. Supply the environment secrets (`GROQ_API_KEY`, `PAYPAL_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) in the Render Dashboard.
4. Render automatically runs `npm install && npm run build` and starts via `npm start`.

---

## License

This project is licensed under the MIT License â€” see the LICENSE file for details.
#   P a y p i l o t _ o n e  
 