import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  Package, 
  BarChart2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight,
  Eye,
  FileText,
  ShoppingCart,
  Download,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { db } from '../../services/dbService';
import { Customer, Product, Business, Order, Invoice } from '../../types';



export const PayPilotView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'customers' | 'products' | 'profile'>('analytics');
  const [business, setBusiness] = useState<Business>(db.getBusiness());
  const [customers, setCustomers] = useState<Customer[]>(db.getCustomers());
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const dailyRevenue = db.getDailyRevenueData();
  const avgDaily = dailyRevenue.length > 0
    ? Math.round(dailyRevenue.reduce((s, r) => s + r.revenue, 0) / dailyRevenue.length)
    : null;

  // Modals state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [newCustomer, setNewCustomer] = useState({ full_name: '', email: '', company: '', phone: '', address: '' });
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    sku: '',
    category: 'Cloud Security',
    price: 99,
    currency: 'USD' as const,
    stock_quantity: 100,
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  });

  useEffect(() => {
    const update = () => {
      setBusiness(db.getBusiness());
      setCustomers(db.getCustomers());
      setProducts(db.getProducts());
    };
    const unsub = db.subscribe(update);
    return unsub;
  }, []);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.full_name || !newCustomer.email) return;
    db.addCustomer(newCustomer);
    setShowCustomerModal(false);
    setNewCustomer({ full_name: '', email: '', company: '', phone: '', address: '' });
  };

  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    db.updateCustomer(editingCustomer.id, editingCustomer);
    setEditingCustomer(null);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku) return;
    db.addProduct(newProduct);
    setShowProductModal(false);
    setNewProduct({
      name: '',
      description: '',
      sku: '',
      category: 'Cloud Security',
      price: 99,
      currency: 'USD',
      stock_quantity: 100,
      image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      is_active: true,
    });
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    db.updateProduct(editingProduct.id, editingProduct);
    setEditingProduct(null);
  };

  const filteredCustomers = customers.filter((c) =>
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>Module 1</span>
            <span aria-hidden="true">·</span>
            <span>Business Intelligence & CRM</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            PayPilot AI Operations
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Monitor sales velocity, customer relationships, and cloud product licenses.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'customers'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Customers ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'products'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Products ({products.length})</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* TAB 1: REVENUE ANALYTICS */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Run-Rate */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    7-Day Sales Cadence
                  </h3>
                  <p className="text-xs text-slate-500">Daily gross revenue</p>
                </div>
                {avgDaily !== null && (
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    Avg ${avgDaily.toLocaleString()}/day
                  </span>
                )}
              </div>
              <div className="h-60 w-full">
                {dailyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        formatter={(v: any) => [`$${v}`, 'Revenue']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <BarChart2 className="w-8 h-8 mb-2 opacity-40" />
                    <span>No transactions recorded in the past 7 days.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Performance Ranking */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Inventory & Catalog Status
                  </h3>
                  <p className="text-xs text-slate-500">Stock availability & pricing</p>
                </div>
              </div>
              <div className="space-y-3">
                {products.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800 last:border-0">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</span>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {p.sku} · {p.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        ${p.price.toFixed(2)}
                      </span>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        {p.stock_quantity} available
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 2: CUSTOMER MANAGEMENT */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers by name, company, or email..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const headers = ['ID', 'Full Name', 'Email', 'Company', 'Phone', 'Address'];
                  const rows = filteredCustomers.map((c) => [
                    c.id,
                    `"${c.full_name}"`,
                    c.email,
                    `"${c.company || ''}"`,
                    `"${c.phone || ''}"`,
                    `"${(c.address || '').replace(/"/g, '""')}"`,
                  ]);
                  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `PayPilot_Customers_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowCustomerModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-500 font-semibold">
                <tr>
                  <th className="p-4">CUSTOMER NAME</th>
                  <th className="p-4">COMPANY</th>
                  <th className="p-4">EMAIL</th>
                  <th className="p-4">PHONE</th>
                  <th className="p-4">LOCATION</th>
                  <th className="p-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="text-left font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                      >
                        <span>{cust.full_name}</span>
                        <Eye className="h-3 w-3 text-slate-400" />
                      </button>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {cust.company || '—'}
                    </td>
                    <td className="p-4 font-mono text-slate-500 dark:text-slate-400">
                      {cust.email}
                    </td>
                    <td className="p-4 text-slate-500">
                      {cust.phone || '—'}
                    </td>
                    <td className="p-4 text-slate-500 truncate max-w-[160px]">
                      {cust.address || '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingCustomer(cust)}
                          className="rounded p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                          title="Edit customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => db.deleteCustomer(cust.id)}
                          className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                          title="Delete customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 3: PRODUCT MANAGEMENT */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by SKU, name, or category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const headers = ['ID', 'SKU', 'Name', 'Category', 'Price', 'Currency', 'Stock Quantity', 'Billing Interval'];
                  const rows = filteredProducts.map((p) => [
                    p.id,
                    p.sku,
                    `"${p.name.replace(/"/g, '""')}"`,
                    `"${p.category}"`,
                    p.price,
                    p.currency,
                    p.stock_quantity,
                    p.billing_interval || 'monthly',
                  ]);
                  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `PayPilot_Products_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowProductModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product / Service</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{prod.sku}</span>
                    <span className="text-emerald-600 font-semibold">{prod.stock_quantity} in stock</span>
                  </div>
                  <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                    {prod.name}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {prod.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                    ${prod.price.toFixed(2)} <span className="text-[10px] text-slate-400">/{prod.billing_interval || 'mo'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingProduct(prod)}
                      className="rounded p-1 text-slate-400 hover:text-indigo-600"
                      title="Edit product & stock"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => db.deleteProduct(prod.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600"
                      title="Archive product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: View Customer Details & History */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-bold dark:bg-indigo-950 dark:text-indigo-400">
                  {selectedCustomer.full_name[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedCustomer.full_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedCustomer.company || 'Individual Client'} · {selectedCustomer.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="rounded p-1 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <span className="text-slate-400 block mb-1">Phone & Address:</span>
                  <div className="text-slate-800 dark:text-slate-200">{selectedCustomer.phone || 'No phone recorded'}</div>
                  <div className="text-slate-500 text-[11px]">{selectedCustomer.address || 'No address recorded'}</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <span className="text-slate-400 block mb-1">Customer Since:</span>
                  <div className="text-slate-800 dark:text-slate-200">{new Date(selectedCustomer.created_at).toLocaleDateString()}</div>
                  <div className="text-emerald-600 text-[11px] font-semibold">Active Account</div>
                </div>
              </div>

              {/* Linked Invoices */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white mb-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>Invoice History ({db.getCustomerInvoices(selectedCustomer.id).length})</span>
                </div>
                {db.getCustomerInvoices(selectedCustomer.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No invoices linked yet.</p>
                ) : (
                  <div className="space-y-2">
                    {db.getCustomerInvoices(selectedCustomer.id).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 text-xs font-mono dark:border-slate-800">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{inv.invoice_number}</span>
                          <span className="text-slate-400 text-[11px] ml-2">Due {inv.due_date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">${inv.total_amount.toFixed(2)}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800">{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-800"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Customer */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Business Customer</h3>
            <form onSubmit={handleAddCustomer} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomer.full_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })}
                  placeholder="e.g. Jessica Lin"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Company Name</label>
                <input
                  type="text"
                  value={newCustomer.company}
                  onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                  placeholder="e.g. Nexus Vector Labs"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="jessica@nexusvector.com"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Address / City</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="San Francisco, CA"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Customer */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Customer Profile</h3>
            <form onSubmit={handleSaveEditCustomer} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.full_name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, full_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Company</label>
                <input
                  type="text"
                  value={editingCustomer.company || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, company: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Address / City</label>
                <input
                  type="text"
                  value={editingCustomer.address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Product */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Product / Service</h3>
            <form onSubmit={handleAddProduct} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Distributed Redis Cluster"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="CP-REDIS-01"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="Cloud Security">Cloud Security</option>
                  <option value="Databases">Databases</option>
                  <option value="AI Infrastructure">AI Infrastructure</option>
                  <option value="DevOps">DevOps</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Key features and technical capabilities"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Product */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Product & Inventory</h3>
            <form onSubmit={handleSaveEditProduct} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.stock_quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value, 10) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
