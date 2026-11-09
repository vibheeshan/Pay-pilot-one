import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Sparkles, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  CreditCard, 
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
  Info,
  History,
  X
} from 'lucide-react';
import { db } from '../../services/dbService';
import { Product, CartItem, OrderItem, Order } from '../../types';
import { PayPalCheckoutModal } from '../../components/layout/PayPalCheckoutModal';

export const AgentCartView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [orders, setOrders] = useState<Order[]>(db.getOrders());
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  // Product Details Modal
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  // PayPal Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      setProducts(db.getProducts());
      setOrders(db.getOrders());
    };
    const unsub = db.subscribe(update);
    return unsub;
  }, []);

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock_quantity, item.quantity + 1) }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartTax = Math.round(cartSubtotal * 0.0825 * 100) / 100;
  const cartTotal = Math.round((cartSubtotal + cartTax) * 100) / 100;

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesBudget = !budgetInput || p.price <= parseFloat(budgetInput);
    return matchesSearch && matchesCategory && matchesBudget;
  });

  // AI Shopping Assistant budget query
  const handleAiBudgetQuery = (budget: number) => {
    setBudgetInput(String(budget));
    const matching = products.filter((p) => p.price <= budget);
    if (matching.length > 0) {
      setAiRecommendation(
        `AgentCart AI filtered ${matching.length} verified cloud products matching your $${budget} budget limit. Top match: ${matching[0].name} ($${matching[0].price}/mo).`
      );
    } else {
      setAiRecommendation(`No cloud products found under $${budget}. The lowest tier plan starts at $49.00/mo.`);
    }
  };

  const orderItemsForCheckout: OrderItem[] = cart.map((item) => ({
    id: `item_${item.product.id}`,
    product_id: item.product.id,
    product_name_snapshot: item.product.name,
    quantity: item.quantity,
    unit_price_snapshot: item.product.price,
    line_total: item.product.price * item.quantity,
  }));

  const handleCheckoutSuccess = () => {
    setCart([]);
    setIsCartOpen(false);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Sandbox Warning Banner */}
      <div className="rounded-xl border border-amber-300/40 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="font-semibold">
            Sandbox – test transactions only. No live credit cards or actual funds are charged.
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60">
          PayPal Sandbox
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>Module 2</span>
            <span aria-hidden="true">·</span>
            <span>AI E-Commerce & Checkout</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AgentCart AI Marketplace
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Discover verified cloud infrastructure, manage shopping carts, and complete PayPal Sandbox checkout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tab Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Cloud Catalog ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === 'orders'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Order History ({orders.length})</span>
            </button>
          </div>

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="relative flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            {cart.length > 0 && (
              <span className="font-mono text-emerald-400 dark:text-emerald-700 font-bold ml-1">
                ${cartTotal.toFixed(2)}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'catalog' && (
        <>
          {/* AI Shopping Assistant Prompt Strip */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>AgentCart AI Shopping Assistant</span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Click a quick recommendation prompt or filter by budget limit:
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                onClick={() => handleAiBudgetQuery(100)}
                className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                "Find cloud tools under $100/mo"
              </button>
              <button
                onClick={() => handleAiBudgetQuery(200)}
                className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                "Show AI inference & vector nodes under $200"
              </button>
              <button
                onClick={() => {
                  setSearchQuery('security');
                  setSelectedCategory('all');
                }}
                className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                "Security & DDoS mitigation tools"
              </button>
              {budgetInput && (
                <button
                  onClick={() => {
                    setBudgetInput('');
                    setAiRecommendation(null);
                  }}
                  className="rounded-lg bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400"
                >
                  Clear Budget Filter
                </button>
              )}
            </div>

            {aiRecommendation && (
              <div className="mt-3 rounded-lg bg-white/80 p-2.5 text-xs text-indigo-900 dark:bg-slate-900/80 dark:text-indigo-300 font-medium border border-indigo-200/50 dark:border-indigo-800/50">
                {aiRecommendation}
              </div>
            )}
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search cloud subscriptions by keyword, SKU, or tier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['all', 'Cloud Security', 'Databases', 'AI Infrastructure', 'DevOps'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'All Products' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>{prod.sku}</span>
                    <span className="text-emerald-600 font-semibold">{prod.stock_quantity} available</span>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {prod.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {prod.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        ${prod.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400 font-sans ml-1">
                        /{prod.billing_interval || 'month'}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedProductDetails(prod)}
                      className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleAddToCart(prod)}
                    disabled={prod.stock_quantity <= 0}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white transition-colors disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* TAB 2: ORDER HISTORY */}
      {activeTab === 'orders' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Fulfillment & Orders Ledger
              </h3>
              <p className="text-xs text-slate-400">
                Verified PayPal sandbox purchase orders with itemized breakdown
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
              {orders.length} orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-500 font-semibold">
                <tr>
                  <th className="p-4">ORDER #</th>
                  <th className="p-4">CUSTOMER</th>
                  <th className="p-4">ITEMS PURCHASED</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4">DATE</th>
                  <th className="p-4 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-sans text-xs">
                      No orders recorded yet. Add items to cart and checkout via PayPal Sandbox!
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {ord.order_number}
                      </td>
                      <td className="p-4 font-sans">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {ord.customer_name || 'Verified Purchaser'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {ord.customer_email || 'customer@client.com'}
                        </span>
                      </td>
                      <td className="p-4 font-sans">
                        <div className="space-y-1">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">{it.quantity}×</span> {it.product_name_snapshot} (${it.unit_price_snapshot.toFixed(2)})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 font-sans">
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 uppercase">
                          <Check className="h-3 w-3" />
                          <span>{ord.status}</span>
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-[11px]">
                        {new Date(ord.created_at).toLocaleDateString()} {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900 dark:text-white text-sm">
                        ${ord.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                {selectedProductDetails.category} · {selectedProductDetails.sku}
              </span>
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedProductDetails.name}
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {selectedProductDetails.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-950/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Pricing Tier</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                    ${selectedProductDetails.price.toFixed(2)} / {selectedProductDetails.billing_interval || 'mo'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Available Inventory</span>
                  <span className="font-bold text-emerald-600">
                    {selectedProductDetails.stock_quantity} Seats Available
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Deployment</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Instant Cloud Provisioning
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Service Level Agreement</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    99.99% Uptime Guarantee
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setSelectedProductDetails(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleAddToCart(selectedProductDetails);
                    setSelectedProductDetails(null);
                  }}
                  disabled={selectedProductDetails.stock_quantity <= 0}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add to Active Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="h-full w-full max-w-md bg-white p-6 shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    AgentCart Active Cart
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Items List */}
              <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-3">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Your shopping cart is currently empty.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="flex-1 pr-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.product.name}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          ${item.product.price.toFixed(2)} each
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, -1)}
                            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs font-mono font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, 1)}
                            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-mono">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Sales Tax (8.25%)</span>
                    <span className="font-mono">${cartTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Total Due</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      ${cartTotal.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0070BA] hover:bg-[#005ea6] py-3 text-xs font-bold text-white shadow-md transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Checkout with PayPal Sandbox</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <PayPalCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={orderItemsForCheckout}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
};
