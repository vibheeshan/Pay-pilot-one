-- ==============================================================================
-- PayPilot One - Master Supabase PostgreSQL Schema & Migrations
-- Version: 1.0.0
-- Modules: PayPilot AI, AgentCart AI, GiveAI, InvoiceMind AI, PayPilot Copilot
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES & BUSINESSES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_email TEXT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    tax_rate NUMERIC(5, 2) DEFAULT 8.25,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'staff')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 2. CUSTOMERS & PRODUCTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sku VARCHAR(50) NOT NULL,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    stock_quantity INT NOT NULL DEFAULT 100,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. COMMERCE & ORDERS (AgentCart AI)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'checked_out', 'abandoned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_payment', 'paid', 'processing', 'completed', 'cancelled')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_snapshot NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. PAYMENTS & TRANSACTIONS (PayPal Sandbox)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    invoice_id UUID,
    donation_id UUID,
    provider VARCHAR(20) DEFAULT 'paypal_sandbox',
    provider_order_id TEXT UNIQUE,
    provider_capture_id TEXT UNIQUE,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.paypal_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processing_status VARCHAR(20) DEFAULT 'processed',
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('order_payment', 'invoice_payment', 'donation', 'refund')),
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    reference_id TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. DONATIONS & CAMPAIGNS (GiveAI)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    goal_amount NUMERIC(12, 2) NOT NULL CHECK (goal_amount > 0),
    raised_amount NUMERIC(12, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'paused', 'cancelled')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    donor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    donor_display_name TEXT DEFAULT 'Anonymous Donor',
    donor_email TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. INVOICES (InvoiceMind AI)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'pending', 'paid', 'overdue', 'cancelled')),
    pdf_path TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    line_total NUMERIC(12, 2) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 7. AI MULTI-AGENT, AUDIT & NOTIFICATIONS (PayPilot Copilot)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Financial Operations Assistant',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    agent_tag VARCHAR(50) DEFAULT 'master_orchestrator',
    content TEXT NOT NULL,
    action_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_action_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_payload JSONB NOT NULL,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    execution_status VARCHAR(20) DEFAULT 'idle' CHECK (execution_status IN ('idle', 'executed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'action_required')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. INDEXES FOR PERFORMANCE & LOOKUP
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_business ON public.orders(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_business ON public.campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business ON public.transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON public.audit_logs(business_id);

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES FOR ALL 22 TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- 2. Businesses
CREATE POLICY "Members view businesses" ON public.businesses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.business_members WHERE business_members.business_id = businesses.id AND business_members.user_id = auth.uid())
);
CREATE POLICY "Owners update business" ON public.businesses FOR UPDATE USING (owner_id = auth.uid());

-- 3. Business Members
CREATE POLICY "Members view co-members" ON public.business_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.business_id = business_members.business_id AND bm.user_id = auth.uid())
);

-- 4. Customers (Strict Tenant Isolation)
CREATE POLICY "Business members access customers" ON public.customers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_members WHERE business_members.business_id = customers.business_id AND business_members.user_id = auth.uid())
);

-- 5. Product Categories
CREATE POLICY "Business members access categories" ON public.product_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_members WHERE business_members.business_id = product_categories.business_id AND business_members.user_id = auth.uid())
);

-- 6. Products
CREATE POLICY "Public view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Business members manage products" ON public.products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_members WHERE business_members.business_id = products.business_id AND business_members.user_id = auth.uid())
);

-- 7 & 8. Carts & Cart Items
CREATE POLICY "Users access own cart" ON public.carts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users access own cart items" ON public.cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);

-- 9 & 10. Orders & Order Items
CREATE POLICY "Business members access orders" ON public.orders FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_members WHERE business_members.business_id = orders.business_id AND business_members.user_id = auth.uid())
);
CREATE POLICY "Order items access via order" ON public.order_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (
        orders.user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.business_members WHERE business_members.business_id = orders.business_id AND business_members.user_id = auth.uid())
    ))
);

-- 11. Payments
CREATE POLICY "Business members access payments" ON public.payments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        JOIN public.business_members ON business_members.business_id = orders.business_id 
        WHERE orders.id = payments.order_id AND business_members.user_id = auth.uid()
    )
);

-- 12. PayPal Events
CREATE POLICY "Admins view paypal events" ON public.paypal_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.business_members WHERE business_members.user_id = auth.uid() AND business_members.role = 'owner')
);

-- 13. Transactions
CREATE POLICY "Business members access transactions" ON public.transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_members WHERE business_members.business_id = transactions.business_id AND business_members.user_id = auth.uid())
);

-- 14. Campaigns
CREATE POLICY "Public view active campaigns" ON public.campaigns FOR SELECT USING (status = 'active');
CREATE POLICY "Business members manage campaigns" ON public.campaigns FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_members WHERE business_members.business_id = campaigns.business_id AND business_members.user_id = auth.uid())
);

-- 15. Donations
CREATE POLICY "Public insert donations" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Business members view donations" ON public.donations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.campaigns 
        JOIN public.business_members ON business_members.business_id = campaigns.business_id 
        WHERE campaigns.id = donations.campaign_id AND business_members.user_id = auth.uid()
    )
);

-- 16 & 17. Invoices & Invoice Items
CREATE POLICY "Business members access invoices" ON public.invoices FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_members WHERE business_members.business_id = invoices.business_id AND business_members.user_id = auth.uid())
);
CREATE POLICY "Invoice items access via invoice" ON public.invoice_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.invoices 
        JOIN public.business_members ON business_members.business_id = invoices.business_id 
        WHERE invoices.id = invoice_items.invoice_id AND business_members.user_id = auth.uid()
    )
);

-- 18 & 19. AI Conversations & Messages
CREATE POLICY "Users access own AI conversations" ON public.ai_conversations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users access own AI messages" ON public.ai_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid())
);

-- 20. AI Action Logs
CREATE POLICY "Business members view action logs" ON public.ai_action_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_members WHERE business_members.business_id = ai_action_logs.business_id AND business_members.user_id = auth.uid())
);

-- 21. Notifications
CREATE POLICY "Users access own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- 22. Audit Logs
CREATE POLICY "Business members view audit logs" ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.business_members WHERE business_members.business_id = audit_logs.business_id AND business_members.user_id = auth.uid())
);

