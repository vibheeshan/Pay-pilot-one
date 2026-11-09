import { 
  Business, Customer, Product, Invoice, Campaign, Order, 
  Transaction, AuditLog, NotificationItem, Donation, Payment, OrderItem 
} from '../types';
import { 
  INITIAL_BUSINESS, INITIAL_CUSTOMERS, INITIAL_PRODUCTS, 
  INITIAL_INVOICES, INITIAL_CAMPAIGNS, INITIAL_ORDERS, 
  INITIAL_TRANSACTIONS, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS,
  INITIAL_DONATIONS, TENANT_B_BUSINESS, TENANT_B_CUSTOMERS, TENANT_B_INVOICES
} from './demoData';
import { getSupabaseClient } from './supabaseClient';
import { auth } from './authService';

class DatabaseService {
  private business: Business = { ...INITIAL_BUSINESS };
  private customers: Customer[] = [...INITIAL_CUSTOMERS];
  private products: Product[] = [...INITIAL_PRODUCTS];
  private invoices: Invoice[] = [...INITIAL_INVOICES];
  private campaigns: Campaign[] = [...INITIAL_CAMPAIGNS];
  private donations: Donation[] = [...INITIAL_DONATIONS];
  private orders: Order[] = [...INITIAL_ORDERS];
  private transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  private notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
  private listeners: Set<() => void> = new Set();
  private supabaseLiveActive: boolean = false;

  constructor() {
    this.loadFromStorage();
    this.syncWithSupabase();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('paypilot_local_store');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.business) this.business = data.business;
        if (data.customers) this.customers = data.customers;
        if (data.products) this.products = data.products;
        if (data.invoices) this.invoices = data.invoices;
        if (data.campaigns) this.campaigns = data.campaigns;
        if (data.donations) this.donations = data.donations;
        if (data.orders) this.orders = data.orders;
        if (data.transactions) this.transactions = data.transactions;
        if (data.auditLogs) this.auditLogs = data.auditLogs;
        if (data.notifications) this.notifications = data.notifications;
      }
    } catch (e) {
      console.warn('Could not load local storage:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('paypilot_local_store', JSON.stringify({
        business: this.business,
        customers: this.customers,
        products: this.products,
        invoices: this.invoices,
        campaigns: this.campaigns,
        donations: this.donations,
        orders: this.orders,
        transactions: this.transactions,
        auditLogs: this.auditLogs,
        notifications: this.notifications,
      }));
    } catch (e) {
      console.warn('Could not save local storage:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public async syncWithSupabase() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const [
        { data: bizData },
        { data: custData },
        { data: prodData },
        { data: invData },
        { data: campData },
        { data: ordData },
      ] = await Promise.all([
        supabase.from('businesses').select('*').limit(1).maybeSingle(),
        supabase.from('customers').select('*'),
        supabase.from('products').select('*'),
        supabase.from('invoices').select('*, invoice_items(*)'),
        supabase.from('campaigns').select('*'),
        supabase.from('orders').select('*, order_items(*)'),
      ]);

      let hasLiveRows = false;
      if (bizData) { this.business = bizData as Business; hasLiveRows = true; }
      if (custData && custData.length > 0) { this.customers = custData as Customer[]; hasLiveRows = true; }
      if (prodData && prodData.length > 0) { this.products = prodData as Product[]; hasLiveRows = true; }
      if (campData && campData.length > 0) { this.campaigns = campData as Campaign[]; hasLiveRows = true; }
      if (invData && invData.length > 0) {
        this.invoices = invData.map((inv: any) => ({
          ...inv,
          items: inv.invoice_items || [],
        }));
        hasLiveRows = true;
      }
      if (ordData && ordData.length > 0) {
        this.orders = ordData.map((ord: any) => ({
          ...ord,
          items: ord.order_items || [],
        }));
        hasLiveRows = true;
      }

      this.supabaseLiveActive = hasLiveRows;
      this.saveToStorage();
    } catch (err) {
      this.supabaseLiveActive = false;
      console.warn('Supabase sync skipped or tables empty:', err);
    }
  }

  public isSupabaseLiveActive(): boolean {
    return this.supabaseLiveActive;
  }

  public isUsingDemoData(): boolean {
    return this.business.id === INITIAL_BUSINESS.id || this.business.id === TENANT_B_BUSINESS.id;
  }

  // --------------------------------------------------------------------------
  // BUSINESS GETTERS & UPDATES
  // --------------------------------------------------------------------------
  public getBusiness(): Business {
    const activeUser = auth.getCurrentUser();
    if (activeUser?.business_id === 'biz_bytescale_02') {
      return TENANT_B_BUSINESS;
    }
    return this.business;
  }

  public updateBusiness(data: Partial<Business>) {
    this.business = { ...this.business, ...data };
    this.addAuditLog('BUSINESS_UPDATED', 'Business', this.business.id, data);
    this.saveToStorage();
  }

  // --------------------------------------------------------------------------
  // CUSTOMERS
  // --------------------------------------------------------------------------
  public getCustomers(): Customer[] {
    const activeUser = auth.getCurrentUser();
    if (activeUser?.business_id === 'biz_bytescale_02') {
      return [...TENANT_B_CUSTOMERS];
    }
    return [...this.customers];
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  }

  public getCustomerOrders(customerId: string): Order[] {
    return this.orders.filter((o) => o.customer_id === customerId);
  }

  public getCustomerInvoices(customerId: string): Invoice[] {
    return this.invoices.filter((i) => i.customer_id === customerId);
  }

  public addCustomer(cust: Omit<Customer, 'id' | 'business_id' | 'created_at'>): Customer {
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      business_id: this.getBusiness().id,
      ...cust,
      created_at: new Date().toISOString(),
    };
    this.customers.unshift(newCust);
    this.addAuditLog('CUSTOMER_CREATED', 'Customer', newCust.id, { name: newCust.full_name });
    this.saveToStorage();
    return newCust;
  }

  public updateCustomer(id: string, data: Partial<Customer>) {
    this.customers = this.customers.map((c) => (c.id === id ? { ...c, ...data } : c));
    this.addAuditLog('CUSTOMER_UPDATED', 'Customer', id, data);
    this.saveToStorage();
  }

  public deleteCustomer(id: string) {
    this.customers = this.customers.filter((c) => c.id !== id);
    this.addAuditLog('CUSTOMER_DELETED', 'Customer', id);
    this.saveToStorage();
  }

  // --------------------------------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------------------------------
  public getProducts(): Product[] {
    return [...this.products];
  }

  public addProduct(prod: Omit<Product, 'id' | 'business_id' | 'created_at'>): Product {
    const newProd: Product = {
      id: `prod_${Date.now()}`,
      business_id: this.business.id,
      ...prod,
      created_at: new Date().toISOString(),
    };
    this.products.unshift(newProd);
    this.addAuditLog('PRODUCT_CREATED', 'Product', newProd.id, { name: newProd.name, price: newProd.price });
    this.saveToStorage();
    return newProd;
  }

  public updateProduct(id: string, data: Partial<Product>) {
    this.products = this.products.map((p) => (p.id === id ? { ...p, ...data } : p));
    this.addAuditLog('PRODUCT_UPDATED', 'Product', id, data);
    this.saveToStorage();
  }

  public deleteProduct(id: string) {
    this.products = this.products.filter((p) => p.id !== id);
    this.addAuditLog('PRODUCT_DELETED', 'Product', id);
    this.saveToStorage();
  }

  // --------------------------------------------------------------------------
  // INVOICES (InvoiceMind AI)
  // --------------------------------------------------------------------------
  public getInvoices(): Invoice[] {
    const activeUser = auth.getCurrentUser();
    if (activeUser?.business_id === 'biz_bytescale_02') {
      return [...TENANT_B_INVOICES];
    }
    return [...this.invoices];
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find((i) => i.id === id);
  }

  public updateInvoice(id: string, data: Partial<Invoice>) {
    this.invoices = this.invoices.map((inv) => (inv.id === id ? { ...inv, ...data } : inv));
    this.addAuditLog('INVOICE_UPDATED', 'Invoice', id, data);
    this.saveToStorage();
  }

  public createInvoice(data: Omit<Invoice, 'id' | 'business_id' | 'created_at'>): Invoice {
    const newInv: Invoice = {
      id: `inv_${Date.now()}`,
      business_id: this.getBusiness().id,
      ...data,
      created_at: new Date().toISOString(),
    };
    this.invoices.unshift(newInv);
    this.addAuditLog('INVOICE_CREATED', 'Invoice', newInv.invoice_number, {
      total: newInv.total_amount,
      client: newInv.customer_name,
    });
    this.addNotification({
      title: 'New Invoice Created',
      message: `Invoice ${newInv.invoice_number} for ${newInv.customer_name} ($${newInv.total_amount.toFixed(2)}) has been issued.`,
      type: 'info',
      link: '/invoices',
    });
    this.saveToStorage();
    return newInv;
  }

  public markInvoicePaid(id: string, paymentMethod = 'PayPal Sandbox'): Invoice | null {
    const invoice = this.invoices.find((i) => i.id === id);
    if (!invoice) return null;

    invoice.status = 'paid';
    
    // Add transaction record
    this.addTransaction({
      transaction_type: 'invoice_payment',
      title: `Invoice Payment · ${invoice.invoice_number} (${invoice.customer_name})`,
      amount: invoice.total_amount,
      currency: invoice.currency,
      reference_id: `PP-INV-${Date.now()}`,
      status: 'reconciled',
    });

    this.addAuditLog('INVOICE_PAID', 'Invoice', invoice.invoice_number, {
      amount: invoice.total_amount,
      method: paymentMethod,
    });

    this.addNotification({
      title: 'Invoice Paid & Reconciled',
      message: `${invoice.invoice_number} ($${invoice.total_amount.toFixed(2)}) was successfully settled.`,
      type: 'success',
      link: '/invoices',
    });

    this.saveToStorage();
    return invoice;
  }

  public deleteInvoice(id: string) {
    this.invoices = this.invoices.filter((i) => i.id !== id);
    this.addAuditLog('INVOICE_DELETED', 'Invoice', id);
    this.saveToStorage();
  }

  // --------------------------------------------------------------------------
  // ORDERS (AgentCart AI)
  // --------------------------------------------------------------------------
  public getOrders(): Order[] {
    return [...this.orders];
  }

  public createOrder(orderData: {
    customer_name: string;
    customer_email: string;
    items: OrderItem[];
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    currency: 'USD';
    paypal_order_id?: string;
  }): Order {
    const orderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      business_id: this.business.id,
      order_number: orderNumber,
      status: 'completed',
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      items: orderData.items,
      subtotal: orderData.subtotal,
      tax_amount: orderData.tax_amount,
      total_amount: orderData.total_amount,
      currency: orderData.currency,
      paypal_order_id: orderData.paypal_order_id,
      created_at: new Date().toISOString(),
    };

    // Deduct stock
    orderData.items.forEach((item) => {
      const prod = this.products.find((p) => p.id === item.product_id);
      if (prod) {
        prod.stock_quantity = Math.max(0, prod.stock_quantity - item.quantity);
      }
    });

    this.orders.unshift(newOrder);

    // Record verified transaction
    this.addTransaction({
      transaction_type: 'order_payment',
      title: `AgentCart Order #${orderNumber} (${orderData.customer_name})`,
      amount: newOrder.total_amount,
      currency: newOrder.currency,
      reference_id: orderData.paypal_order_id || `PP-CAPT-${Date.now()}`,
      status: 'completed',
    });

    this.addAuditLog('ORDER_COMPLETED', 'Order', newOrder.order_number, {
      total: newOrder.total_amount,
      items_count: newOrder.items.length,
      paypal_id: orderData.paypal_order_id,
    });

    this.addNotification({
      title: 'AgentCart Order Verified',
      message: `Order #${orderNumber} for $${newOrder.total_amount.toFixed(2)} completed via PayPal Sandbox.`,
      type: 'success',
      link: '/orders',
    });

    this.saveToStorage();
    return newOrder;
  }

  // --------------------------------------------------------------------------
  // CAMPAIGNS & DONATIONS (GiveAI)
  // --------------------------------------------------------------------------
  public getCampaigns(): Campaign[] {
    return [...this.campaigns];
  }

  public getDonations(): Donation[] {
    return [...this.donations];
  }

  public updateCampaign(id: string, data: Partial<Campaign>) {
    this.campaigns = this.campaigns.map((c) => (c.id === id ? { ...c, ...data } : c));
    this.addAuditLog('CAMPAIGN_UPDATED', 'Campaign', id, data);
    this.saveToStorage();
  }

  public addCampaign(camp: Omit<Campaign, 'id' | 'business_id' | 'raised_amount' | 'donors_count' | 'created_at'>): Campaign {
    const newCamp: Campaign = {
      id: `camp_${Date.now()}`,
      business_id: this.getBusiness().id,
      ...camp,
      raised_amount: 0,
      donors_count: 0,
      created_at: new Date().toISOString(),
    };
    this.campaigns.unshift(newCamp);
    this.addAuditLog('CAMPAIGN_CREATED', 'Campaign', newCamp.id, { title: newCamp.title, goal: newCamp.goal_amount });
    this.saveToStorage();
    return newCamp;
  }

  public recordDonation(campaignId: string, donationData: {
    donor_name: string;
    donor_email?: string;
    amount: number;
    currency: 'USD';
    paypal_order_id?: string;
  }): Donation {
    const campaign = this.campaigns.find((c) => c.id === campaignId);
    if (campaign) {
      campaign.raised_amount += donationData.amount;
      campaign.donors_count += 1;
    }

    const donation: Donation = {
      id: `don_${Date.now()}`,
      campaign_id: campaignId,
      campaign_title: campaign?.title,
      donor_display_name: donationData.donor_name || 'Anonymous Donor',
      donor_email: donationData.donor_email,
      amount: donationData.amount,
      currency: donationData.currency,
      payment_id: donationData.paypal_order_id,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    this.donations.unshift(donation);

    this.addTransaction({
      transaction_type: 'donation',
      title: `GiveAI Donation · ${campaign?.title || 'Open Campaign'}`,
      amount: donationData.amount,
      currency: donationData.currency,
      reference_id: donationData.paypal_order_id || `PP-DON-${Date.now()}`,
      status: 'completed',
    });

    this.addAuditLog('DONATION_RECEIVED', 'Campaign', campaignId, {
      amount: donationData.amount,
      donor: donation.donor_display_name,
    });

    this.addNotification({
      title: 'New Donation Received',
      message: `$${donationData.amount.toFixed(2)} received from ${donation.donor_display_name} for "${campaign?.title || 'Campaign'}".`,
      type: 'success',
      link: '/giveai',
    });

    this.saveToStorage();
    return donation;
  }

  // --------------------------------------------------------------------------
  // TRANSACTIONS
  // --------------------------------------------------------------------------
  public getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  public addTransaction(data: Omit<Transaction, 'id' | 'business_id' | 'created_at'>): Transaction {
    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      business_id: this.business.id,
      ...data,
      created_at: new Date().toISOString(),
    };
    this.transactions.unshift(tx);
    this.saveToStorage();
    return tx;
  }

  // --------------------------------------------------------------------------
  // AUDIT LOGS
  // --------------------------------------------------------------------------
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public addAuditLog(action: string, resource_type: string, resource_id?: string, metadata?: Record<string, any>) {
    const log: AuditLog = {
      id: `audit_${Date.now()}`,
      user_name: 'Administrator',
      action,
      resource_type,
      resource_id,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    // keep to latest 200 logs
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
  }

  // --------------------------------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------------------------------
  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'created_at' | 'is_read'>) {
    const item: NotificationItem = {
      id: `notif_${Date.now()}`,
      ...notif,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(item);
    this.saveToStorage();
  }

  public markNotificationRead(id: string) {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    this.saveToStorage();
  }

  public markAllNotificationsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, is_read: true }));
    this.saveToStorage();
  }

  // --------------------------------------------------------------------------
  // REVENUE & DASHBOARD AGGREGATES
  // --------------------------------------------------------------------------
  public getDashboardMetrics() {
    const totalOrderRevenue = this.orders.reduce((sum, o) => sum + (o.status === 'completed' ? o.total_amount : 0), 0);
    const totalInvoiceRevenue = this.invoices.reduce((sum, i) => sum + (i.status === 'paid' ? i.total_amount : 0), 0);
    const totalDonations = this.campaigns.reduce((sum, c) => sum + c.raised_amount, 0);
    const totalRevenue = totalOrderRevenue + totalInvoiceRevenue + totalDonations;

    const unpaidInvoices = this.invoices.filter((i) => i.status === 'issued' || i.status === 'pending' || i.status === 'overdue');
    const unpaidAmount = unpaidInvoices.reduce((sum, i) => sum + i.total_amount, 0);

    const paidInvoicesCount = this.invoices.filter((i) => i.status === 'paid').length;
    const overdueInvoicesCount = this.invoices.filter((i) => i.status === 'overdue').length;

    // Calculate real Month-over-Month growth percentage from stored records
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const priorMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const priorYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentMonthRevenue = 0;
    let priorMonthRevenue = 0;

    for (const o of this.orders) {
      if (o.status === 'completed' && o.created_at) {
        const d = new Date(o.created_at);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          currentMonthRevenue += o.total_amount;
        } else if (d.getFullYear() === priorYear && d.getMonth() === priorMonth) {
          priorMonthRevenue += o.total_amount;
        }
      }
    }

    for (const inv of this.invoices) {
      if (inv.status === 'paid' && (inv.issue_date || inv.created_at)) {
        const d = new Date(inv.issue_date || inv.created_at);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          currentMonthRevenue += inv.total_amount;
        } else if (d.getFullYear() === priorYear && d.getMonth() === priorMonth) {
          priorMonthRevenue += inv.total_amount;
        }
      }
    }

    let growthRate: number | null = null;
    if (priorMonthRevenue > 0) {
      growthRate = Math.round(((currentMonthRevenue - priorMonthRevenue) / priorMonthRevenue) * 1000) / 10;
    }

    return {
      totalRevenue,
      totalOrders: this.orders.length,
      totalCustomers: this.customers.length,
      totalProducts: this.products.length,
      unpaidInvoicesCount: unpaidInvoices.length,
      unpaidAmount,
      paidInvoicesCount,
      overdueInvoicesCount,
      totalDonations,
      activeCampaignsCount: this.campaigns.filter((c) => c.status === 'active').length,
      growthRate,
    };
  }

  public getMonthlyRevenueData(): { month: string; revenue: number; orders: number }[] {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const map = new Map<string, { month: string; revenue: number; orders: number }>();

    for (const o of this.orders) {
      if (o.created_at) {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[d.getMonth()]}`;
        const entry = map.get(key) || { month: label, revenue: 0, orders: 0 };
        if (o.status === 'completed') {
          entry.revenue += o.total_amount;
        }
        entry.orders += 1;
        map.set(key, entry);
      }
    }

    for (const inv of this.invoices) {
      if (inv.status === 'paid' && (inv.issue_date || inv.created_at)) {
        const d = new Date(inv.issue_date || inv.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[d.getMonth()]}`;
        const entry = map.get(key) || { month: label, revenue: 0, orders: 0 };
        entry.revenue += inv.total_amount;
        map.set(key, entry);
      }
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        month: v.month,
        revenue: Math.round(v.revenue * 100) / 100,
        orders: v.orders,
      }));
  }

  public getCategorySalesData(): { category: string; value: number }[] {
    const catMap = new Map<string, number>();

    for (const o of this.orders) {
      if (o.status === 'completed' && Array.isArray(o.items)) {
        for (const it of o.items) {
          const prod = this.products.find((p) => p.id === it.product_id);
          const cat = prod?.category || 'Cloud Services';
          catMap.set(cat, (catMap.get(cat) || 0) + it.line_total);
        }
      }
    }

    return Array.from(catMap.entries()).map(([category, value]) => ({
      category,
      value: Math.round(value * 100) / 100,
    }));
  }

  public getDailyRevenueData(): { day: string; revenue: number }[] {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const past7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return {
        dateStr: d.toISOString().split('T')[0],
        dayName: dayNames[d.getDay()],
        revenue: 0,
      };
    });

    let hasData = false;
    for (const t of this.transactions) {
      if (t.created_at && (t.status === 'completed' || t.status === 'reconciled')) {
        const tDate = t.created_at.split('T')[0];
        const match = past7Days.find((d) => d.dateStr === tDate);
        if (match) {
          match.revenue += t.amount;
          hasData = true;
        }
      }
    }

    if (!hasData) {
      return [];
    }

    return past7Days.map((d) => ({
      day: d.dayName,
      revenue: Math.round(d.revenue * 100) / 100,
    }));
  }

  public resetToDemoData() {
    this.business = { ...INITIAL_BUSINESS };
    this.customers = [...INITIAL_CUSTOMERS];
    this.products = [...INITIAL_PRODUCTS];
    this.invoices = [...INITIAL_INVOICES];
    this.campaigns = [...INITIAL_CAMPAIGNS];
    this.orders = [...INITIAL_ORDERS];
    this.transactions = [...INITIAL_TRANSACTIONS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.saveToStorage();
  }
}

export const db = new DatabaseService();
