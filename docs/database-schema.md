# PayPilot One – Database Schema (22 Tables)

The master PostgreSQL schema is defined in `/supabase/migrations/001_initial_schema.sql`.

## Table Inventory

| # | Table Name | Purpose | Primary Tenant Foreign Key | RLS Status |
|---|------------|---------|----------------------------|------------|
| 1 | `profiles` | User accounts, names, avatars | `id = auth.uid()` | ENABLED |
| 2 | `businesses` | Organization entity and settings | `owner_id` | ENABLED |
| 3 | `business_members` | RBAC: owner, admin, staff | `business_id` | ENABLED |
| 4 | `customers` | CRM contacts, accounts, addresses | `business_id` | ENABLED |
| 5 | `product_categories` | SaaS & catalog taxonomy | `business_id` | ENABLED |
| 6 | `products` | SaaS plans, seats, pricing | `business_id` | ENABLED |
| 7 | `carts` | User shopping sessions | `user_id` | ENABLED |
| 8 | `cart_items` | Products in active shopping cart | `cart_id` | ENABLED |
| 9 | `orders` | Completed checkout orders | `business_id` | ENABLED |
| 10 | `order_items` | Line items snapshot for order | `order_id` | ENABLED |
| 11 | `payments` | PayPal transaction capture records | `order_id` | ENABLED |
| 12 | `paypal_events` | Idempotent webhook event ledger | `event_id` | ENABLED |
| 13 | `transactions` | Consolidated financial ledger | `business_id` | ENABLED |
| 14 | `campaigns` | GiveAI philanthropy initiatives | `business_id` | ENABLED |
| 15 | `donations` | Contributor records & funds raised | `campaign_id` | ENABLED |
| 16 | `invoices` | B2B invoices with payment terms | `business_id` | ENABLED |
| 17 | `invoice_items` | Multi-line items with rates | `invoice_id` | ENABLED |
| 18 | `ai_conversations` | Copilot session metadata | `user_id` | ENABLED |
| 19 | `ai_messages` | Prompts, responses, specialist tags | `conversation_id` | ENABLED |
| 20 | `ai_action_logs` | Human approval audit logs | `business_id` | ENABLED |
| 21 | `notifications` | System alerts & reminder warnings | `user_id` | ENABLED |
| 22 | `audit_logs` | Immutable audit trail | `business_id` | ENABLED |

---

## Multi-Tenant Isolation Strategy
All queries are guarded by PostgreSQL Row Level Security:
```sql
CREATE POLICY "Business members access customers" ON public.customers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_members WHERE business_members.business_id = customers.business_id AND business_members.user_id = auth.uid())
);
```
Users belonging to Tenant A (*CloudPilot Technologies Inc.*) cannot view or modify data belonging to Tenant B (*ByteScale Labs Inc.*).
