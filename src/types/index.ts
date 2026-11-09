export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  business_email: string;
  currency: Currency;
  tax_rate: number;
  logo_url?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  business_id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  price: number;
  currency: Currency;
  stock_quantity: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  billing_interval?: 'monthly' | 'one-time' | 'annual';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'awaiting_payment' | 'paid' | 'processing' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  unit_price_snapshot: number;
  line_total: number;
}

export interface Order {
  id: string;
  user_id?: string;
  business_id: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: Currency;
  created_at: string;
  items: OrderItem[];
  paypal_order_id?: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  order_id?: string;
  invoice_id?: string;
  donation_id?: string;
  provider: string;
  provider_order_id?: string;
  provider_capture_id?: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  verified_at?: string;
  created_at: string;
}

export type TransactionType = 'order_payment' | 'invoice_payment' | 'donation' | 'refund';

export interface Transaction {
  id: string;
  business_id: string;
  payment_id?: string;
  transaction_type: TransactionType;
  title: string;
  amount: number;
  currency: Currency;
  reference_id: string;
  status: 'completed' | 'pending' | 'reconciled';
  created_at: string;
}

export type CampaignStatus = 'draft' | 'active' | 'completed' | 'paused';

export interface Campaign {
  id: string;
  business_id: string;
  title: string;
  description: string;
  goal_amount: number;
  raised_amount: number;
  currency: Currency;
  image_url: string;
  status: CampaignStatus;
  start_date: string;
  end_date?: string;
  donors_count: number;
  created_at: string;
}

export interface Donation {
  id: string;
  campaign_id: string;
  campaign_title?: string;
  donor_display_name: string;
  donor_email?: string;
  amount: number;
  currency: Currency;
  payment_id?: string;
  status: 'completed' | 'pending';
  created_at: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
}

export interface Invoice {
  id: string;
  business_id: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_company?: string;
  customer_address?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: Currency;
  status: InvoiceStatus;
  notes?: string;
  items: InvoiceItem[];
  created_at: string;
}

export type AgentRole = 
  | 'master_orchestrator'
  | 'business_agent'
  | 'shopping_agent'
  | 'donation_agent'
  | 'invoice_agent'
  | 'payment_agent';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  agent_tag: AgentRole;
  content: string;
  action_data?: AIActionRequest;
  created_at: string;
}

export interface AIActionRequest {
  action_type: 'create_invoice' | 'send_invoice_reminder' | 'capture_payment' | 'reconcile_transaction' | 'apply_discount';
  title: string;
  summary: string;
  details: Record<string, any>;
  requires_human_approval: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  executed?: boolean;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'action_required';
  is_read: boolean;
  created_at: string;
  link?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastChecked?: string;
  errorMessage?: string;
}
