-- ==============================================================================
-- PayPilot One - Auth & Multi-Tenant Access Policies Migration
-- Version: 1.1.0
-- Migration: 002_auth_policies.sql
-- ==============================================================================

-- 1. Security Definer Helper for Business Membership Checks
CREATE OR REPLACE FUNCTION public.is_business_member(b_id uuid, roles text[] DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF roles IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_id = b_id
        AND user_id = auth.uid()
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_id = b_id
        AND user_id = auth.uid()
        AND role = ANY(roles)
    );
  END IF;
END;
$$;

-- 2. Atomic Onboarding Function (Database Transaction via RPC)
CREATE OR REPLACE FUNCTION public.create_business_with_owner(
    p_user_id UUID,
    p_user_email TEXT,
    p_user_full_name TEXT,
    p_business_name TEXT,
    p_currency VARCHAR(3) DEFAULT 'USD',
    p_tax_rate NUMERIC(5,2) DEFAULT 8.25
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_business_id UUID;
BEGIN
    -- 1. Ensure profile row exists
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (p_user_id, p_user_email, p_user_full_name)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

    -- 2. Create business
    INSERT INTO public.businesses (name, owner_id, business_email, currency, tax_rate)
    VALUES (p_business_name, p_user_id, p_user_email, p_currency, p_tax_rate)
    RETURNING id INTO new_business_id;

    -- 3. Create business member record with owner role
    INSERT INTO public.business_members (business_id, user_id, role)
    VALUES (new_business_id, p_user_id, 'owner');

    -- 4. Create immutable audit log entry
    INSERT INTO public.audit_logs (business_id, user_id, action, resource_type, metadata)
    VALUES (
        new_business_id,
        p_user_id,
        'BUSINESS_ONBOARDING_COMPLETED',
        'Business',
        jsonb_build_object(
            'business_id', new_business_id,
            'name', p_business_name,
            'currency', p_currency,
            'tax_rate', p_tax_rate
        )
    );

    RETURN new_business_id;
END;
$$;

-- 3. Automatic Profile Creation Trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- Drop old or conflicting policies
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Members view co-members" ON public.business_members;
DROP POLICY IF EXISTS "Users select business_members" ON public.business_members;
DROP POLICY IF EXISTS "Members view businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners update business" ON public.businesses;
DROP POLICY IF EXISTS "Users select businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners update businesses" ON public.businesses;

-- Profiles: a user can select and update only their own row
CREATE POLICY "Users select own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Business Members: a user can select rows where user_id = auth.uid() OR for a business where they are a member
CREATE POLICY "Users select business_members" ON public.business_members
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        public.is_business_member(business_id)
    );

-- Businesses: select rows where owner or member
CREATE POLICY "Users select businesses" ON public.businesses
    FOR SELECT TO authenticated
    USING (
        owner_id = auth.uid() OR
        public.is_business_member(id)
    );

CREATE POLICY "Owners update businesses" ON public.businesses
    FOR UPDATE TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Customers: Use security definer is_business_member to eliminate RLS recursion
DROP POLICY IF EXISTS "Business members access customers" ON public.customers;
CREATE POLICY "Business members access customers" ON public.customers
    FOR ALL TO authenticated
    USING (public.is_business_member(business_id))
    WITH CHECK (public.is_business_member(business_id));

-- Note: No INSERT policies granted to authenticated role on businesses and business_members.
-- Inserts must happen exclusively via the server-side onboarding endpoint using the service role.
