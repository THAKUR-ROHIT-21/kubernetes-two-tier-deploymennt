import { useState, useRef, useEffect, useMemo } from 'react';
import { createProduct, bulkCreateProducts, getProducts } from '../api/productApi';
import { getAllOrdersAdmin, updateOrderStatusAdmin, getSalesAnalytics } from '../api/orderApi';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_STYLES = {
  processing: 'bg-amber/10 text-amber border-amber/30',
  shipped: 'bg-teal/10 text-teal border-teal/30',
  delivered: 'bg-teal/15 text-teal border-teal/40',
  cancelled: 'bg-surface-hover text-text-muted border-border-line',
};

const PRODUCT_STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'in-stock', label: 'In Stock' },
  { key: 'low-stock', label: 'Low Stock' },
  { key: 'out-of-stock', label: 'Out of Stock' },
];

const PRODUCT_STATUS_LABELS = {
  'in-stock': 'In stock',
  'low-stock': 'Low stock',
  'out-of-stock': 'Out of stock',
};

const getProductStatus = (stock) => {
  const qty = Number(stock);
  if (qty === 0) return 'out-of-stock';
  if (qty <= 5) return 'low-stock';
  return 'in-stock';
};

const PAGE_SIZE = 8;

function PaginationBar({ currentPage, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3.5 border-t border-border-line">
      <p className="text-text-muted text-xs">
        Showing <span className="text-text-primary font-medium">{start}–{end}</span> of{' '}
        <span className="text-text-primary font-medium">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted border border-border-line hover:border-teal hover:text-teal disabled:opacity-30 disabled:hover:border-border-line disabled:hover:text-text-muted disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-text-muted text-xs">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors ${
                p === currentPage
                  ? 'bg-teal text-graphite font-semibold'
                  : 'text-text-muted border border-border-line hover:border-teal hover:text-teal'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted border border-border-line hover:border-teal hover:text-teal disabled:opacity-30 disabled:hover:border-border-line disabled:hover:text-text-muted disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-surface border border-border-line rounded-lg px-3 py-2 shadow-xl shadow-black/30">
      <p className="text-text-muted text-xs mb-1">{label}</p>
      <p className="text-teal text-sm font-bold">₹{payload[0].value.toLocaleString('en-IN')}</p>
    </div>
  );
}

function ProductManagementDashboard() {
  const [activeTab, setActiveTab] = useState('products');

  // ===== Products state =====
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', price: '', category: '', stock: '',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [tableSearch, setTableSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productPage, setProductPage] = useState(1);
  const jsonInputRef = useRef(null);

  // ===== Orders state =====
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [orderError, setOrderError] = useState('');
  const [orderPage, setOrderPage] = useState(1);

  // ===== Analytics state =====
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsRange, setAnalyticsRange] = useState(7);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await getProducts();
      setProducts(data.products || []);
    } catch {
      // table stays empty
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await getAllOrdersAdmin();
      setOrders(data.orders || []);
    } catch {
      setOrderError('Could not load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAnalytics = async (days) => {
    setAnalyticsLoading(true);
    try {
      const data = await getSalesAnalytics(days);
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchAnalytics(analyticsRange);
  }, [analyticsRange]);

  // Reset to page 1 whenever a filter/search changes, so the user never
  // lands on an empty page that simply doesn't exist for the new filter set.
  useEffect(() => {
    setProductPage(1);
  }, [tableSearch, productStatusFilter]);

  useEffect(() => {
    setOrderPage(1);
  }, [orderSearch, orderStatusFilter]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const processFiles = (fileList) => {
    const files = Array.from(fileList).slice(0, 5);
    setImageFiles(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleImageChange = (e) => processFiles(e.target.files);
  const handleDrop = (e) => { e.preventDefault(); setDragActive(false); processFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      imageFiles.forEach((file) => data.append('images', file));
      await createProduct(data);
      setSuccess('Product added successfully!');
      setFormData({ name: '', sku: '', description: '', price: '', category: '', stock: '' });
      setImageFiles([]); setPreviews([]);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleJsonUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(''); setSuccess(''); setBulkLoading(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const productsArray = Array.isArray(parsed) ? parsed : parsed.products;
      if (!Array.isArray(productsArray)) throw new Error('JSON must be an array of products');
      const result = await bulkCreateProducts(productsArray);
      setSuccess(`${result.count} products imported successfully!`);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to import JSON');
    } finally {
      setBulkLoading(false);
      e.target.value = '';
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    setOrderError('');
    try {
      await updateOrderStatusAdmin(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (err) {
      setOrderError(err.response?.data?.message || 'Could not update status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const Spinner = ({ className = 'h-4 w-4' }) => (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  const FieldInput = ({ icon, ...props }) => (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">
        {icon}
      </span>
      <input
        {...props}
        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted/60 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all text-sm"
      />
    </div>
  );

  const stats = useMemo(() => {
    const total = products.length;
    const inventoryValue = products.reduce((sum, p) => sum + Number(p.price) * Number(p.stock), 0);
    const avgPrice = total > 0 ? products.reduce((sum, p) => sum + Number(p.price), 0) / total : 0;
    const outOfStock = products.filter((p) => Number(p.stock) === 0).length;
    return [
      { label: 'Total Products', value: total.toLocaleString('en-IN'), icon: '▢' },
      { label: 'Inventory Value', value: `₹${inventoryValue.toLocaleString('en-IN')}`, icon: '₹' },
      { label: 'Avg. Price', value: `₹${Math.round(avgPrice).toLocaleString('en-IN')}`, icon: '∑' },
      { label: 'Out of Stock', value: outOfStock.toLocaleString('en-IN'), icon: '⚠' },
    ];
  }, [products]);

  const categoryBreakdown = useMemo(() => {
    if (products.length === 0) return [];
    const counts = {};
    products.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    const total = products.length;
    return Object.entries(counts)
      .map(([name, count]) => ({ name, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);
  }, [products]);

  const recentActivity = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4)
      .map((p) => ({
        name: p.name, sku: p.sku,
        time: new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      }));
  }, [products]);

  const productStatusCounts = useMemo(() => {
    return products.reduce((acc, p) => {
      const status = getProductStatus(p.stock);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => productStatusFilter === 'all' || getProductStatus(p.stock) === productStatusFilter)
      .filter((p) => {
        if (!tableSearch.trim()) return true;
        const q = tableSearch.toLowerCase();
        const statusLabel = PRODUCT_STATUS_LABELS[getProductStatus(p.stock)].toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          statusLabel.includes(q)
        );
      });
  }, [products, tableSearch, productStatusFilter]);

  const productTotalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, productPage]);

  const orderStatusCounts = useMemo(() => {
    return orders.reduce((acc, o) => {
      acc[o.orderStatus] = (acc[o.orderStatus] || 0) + 1;
      return acc;
    }, {});
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter)
      .filter((o) => {
        if (!orderSearch.trim()) return true;
        const q = orderSearch.toLowerCase();
        const idMatch = String(o.id).includes(q);
        const userMatch = o.User?.name?.toLowerCase().includes(q) || o.User?.email?.toLowerCase().includes(q);
        const itemMatch = (o.OrderItems || []).some((it) => it.name.toLowerCase().includes(q));
        return idMatch || userMatch || itemMatch;
      });
  }, [orders, orderSearch, orderStatusFilter]);

  const orderTotalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, orderPage]);

  const TABS = [
    { key: 'products', label: 'Add Product' },
    { key: 'all-products', label: 'All Products' },
    { key: 'orders', label: 'Orders' },
    { key: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-graphite px-6 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-amber/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-muted text-sm">Manage your catalog and track every order, all in one place.</p>
        </div>

        <div className="flex gap-2 mb-8 bg-surface border border-border-line rounded-full p-1 w-fit flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-teal text-graphite shadow-[0_2px_10px_-2px_rgba(20,184,166,0.4)]'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {tab.label}
              {tab.key === 'all-products' && products.length > 0 && (
                <span className="ml-1.5 opacity-70">({products.length})</span>
              )}
              {tab.key === 'orders' && orders.length > 0 && (
                <span className="ml-1.5 opacity-70">({orders.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* ============ ADD PRODUCT TAB ============ */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/30 flex items-center justify-center text-teal font-display font-bold">
                    +
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-text-primary leading-tight">New Product</h2>
                    <p className="text-text-muted text-xs">Add a single item to your catalog</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => jsonInputRef.current?.click()}
                  disabled={bulkLoading}
                  className="flex items-center gap-2 text-xs font-medium text-text-muted border border-border-line hover:border-teal hover:text-teal px-3 py-2 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {bulkLoading ? <Spinner /> : <span>⤴</span>}
                  {bulkLoading ? 'Importing' : 'Upload Bulk Product JSON'}
                </button>
                <input ref={jsonInputRef} type="file" accept="application/json" onChange={handleJsonUpload} className="hidden" />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-amber text-sm bg-amber/10 border border-amber/30 rounded-lg px-3 py-2.5 mb-4">
                  <span>⚠</span><p>{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2 text-teal text-sm bg-teal/10 border border-teal/30 rounded-lg px-3 py-2.5 mb-4">
                  <span>✓</span><p>{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="bg-surface border border-border-line rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                <div className="p-5 space-y-3 border-b border-border-line">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-teal/70 mb-1">Basic Info</p>
                  <FieldInput icon="◆" name="name" placeholder="Product name" value={formData.name} onChange={handleChange} required />
                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput icon="#" name="sku" placeholder="SKU" value={formData.sku} onChange={handleChange} required />
                    <FieldInput icon="▢" name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
                  </div>
                  <textarea
                    name="description"
                    placeholder="Description — what makes this product worth buying?"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full p-3 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted/60 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all text-sm resize-none"
                  />
                </div>

                <div className="p-5 space-y-3 border-b border-border-line">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-teal/70 mb-1">Pricing & Stock</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput icon="₹" name="price" type="number" placeholder="Price" value={formData.price} onChange={handleChange} required />
                    <FieldInput icon="∑" name="stock" type="number" placeholder="Stock qty" value={formData.stock} onChange={handleChange} required />
                  </div>
                </div>

                <div className="p-5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-teal/70 mb-3">Media</p>
                  <label
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition-colors ${
                      dragActive ? 'border-teal bg-teal/5' : 'border-border-line hover:border-teal/50 hover:bg-surface-hover'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-graphite border border-border-line flex items-center justify-center text-teal shrink-0">
                      ⤓
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary text-sm font-medium">
                        <span className="text-teal">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-text-muted text-xs">PNG or JPG, up to 5MB each, max 5 images</p>
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </label>

                  {previews.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {previews.map((src, i) => (
                        <img key={i} src={src} alt={`preview-${i}`} className="w-14 h-14 object-cover rounded-lg border border-border-line" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-5 bg-graphite/40 border-t border-border-line">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-teal hover:bg-teal-dim text-graphite py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {loading && <Spinner />}
                    {loading ? 'Adding Product...' : 'Add Product to Catalog'}
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-surface border border-border-line rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-teal text-sm">{stat.icon}</span>
                    </div>
                    <p className="font-display text-xl font-bold text-text-primary">{stat.value}</p>
                    <p className="text-text-muted text-xs mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-surface border border-border-line rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-teal/70 mb-3">Stock by Category</p>
                {categoryBreakdown.length === 0 ? (
                  <p className="text-text-muted text-xs">No products yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {categoryBreakdown.map((cat) => (
                      <div key={cat.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-muted capitalize">{cat.name}</span>
                          <span className="text-text-primary font-medium">{cat.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-graphite rounded-full overflow-hidden">
                          <div className="h-full bg-teal rounded-full" style={{ width: `${cat.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-surface border border-border-line rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-teal/70 mb-3">Recently Added</p>
                {recentActivity.length === 0 ? (
                  <p className="text-text-muted text-xs">No products yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((item) => (
                      <div key={item.sku} className="flex items-center justify-between">
                        <div>
                          <p className="text-text-primary text-sm font-medium">{item.name}</p>
                          <p className="text-text-muted text-xs font-mono">{item.sku}</p>
                        </div>
                        <span className="text-text-muted text-xs">{item.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ ALL PRODUCTS TAB ============ */}
        {activeTab === 'all-products' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-surface border border-border-line rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-teal text-sm">{stat.icon}</span>
                  </div>
                  <p className="font-display text-xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-text-muted text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-surface border border-border-line rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
              <div className="p-5 border-b border-border-line flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-text-primary">All Products</h2>
                  <p className="text-text-muted text-xs">{filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} in catalog</p>
                </div>
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search by name, SKU, category, or status..."
                  className="px-3.5 py-2 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted/60 text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all w-full sm:w-72"
                />
              </div>

              <div className="px-5 py-3 border-b border-border-line flex gap-2 flex-wrap">
                {PRODUCT_STATUS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setProductStatusFilter(f.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      productStatusFilter === f.key
                        ? 'bg-teal text-graphite border-teal font-semibold'
                        : 'bg-graphite text-text-muted border-border-line hover:border-teal hover:text-teal'
                    }`}
                  >
                    {f.label} {f.key !== 'all' && `(${productStatusCounts[f.key] || 0})`}
                  </button>
                ))}
              </div>

              {productsLoading ? (
                <div className="p-8 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-surface-hover rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-text-primary font-medium mb-1">
                    {products.length === 0 ? 'No products yet' : 'No products match your filters'}
                  </p>
                  <p className="text-text-muted text-sm">
                    {products.length === 0 ? 'Add your first product from the "Add Product" tab.' : 'Try a different search term or status filter.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-line text-left">
                          <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium">Product</th>
                          <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium">SKU</th>
                          <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium">Category</th>
                          <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium text-right">Price</th>
                          <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium text-right">Stock</th>
                          <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProducts.map((p) => {
                          const status = getProductStatus(p.stock);
                          const statusBadgeClass =
                            status === 'out-of-stock'
                              ? 'bg-surface-hover text-text-muted border-border-line'
                              : status === 'low-stock'
                              ? 'bg-amber/10 text-amber border-amber/30'
                              : 'bg-teal/10 text-teal border-teal/30';
                          return (
                            <tr key={p.id} className="border-b border-border-line/50 last:border-0 hover:bg-surface-hover transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-graphite border border-border-line overflow-hidden shrink-0">
                                    {p.images?.[0] && (
                                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                  <span className="text-text-primary font-medium truncate max-w-[180px]">{p.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-text-muted font-mono text-xs">{p.sku}</td>
                              <td className="px-5 py-3 text-text-muted capitalize">{p.category}</td>
                              <td className="px-5 py-3 text-text-primary font-medium text-right">
                                ₹{Number(p.price).toLocaleString('en-IN')}
                              </td>
                              <td className="px-5 py-3 text-text-primary text-right">{p.stock}</td>
                              <td className="px-5 py-3 text-center">
                                <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${statusBadgeClass}`}>
                                  {PRODUCT_STATUS_LABELS[status]}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <PaginationBar
                    currentPage={productPage}
                    totalPages={productTotalPages}
                    onPageChange={setProductPage}
                    totalItems={filteredProducts.length}
                    pageSize={PAGE_SIZE}
                  />
                </>
              )}
            </div>
          </>
        )}

        {/* ============ ORDERS TAB ============ */}
        {activeTab === 'orders' && (
          <div className="bg-surface border border-border-line rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
            <div className="p-5 border-b border-border-line flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-text-primary">All Orders</h2>
                <p className="text-text-muted text-xs">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</p>
              </div>
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by order ID, customer, or product..."
                className="px-3.5 py-2 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted/60 text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all w-full sm:w-80"
              />
            </div>

            <div className="px-5 py-3 border-b border-border-line flex gap-2 flex-wrap">
              {['all', ...ORDER_STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => setOrderStatusFilter(s)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-colors border ${
                    orderStatusFilter === s
                      ? 'bg-teal text-graphite border-teal font-semibold'
                      : 'bg-graphite text-text-muted border-border-line hover:border-teal hover:text-teal'
                  }`}
                >
                  {s} {s !== 'all' && `(${orderStatusCounts[s] || 0})`}
                </button>
              ))}
            </div>

            {orderError && (
              <div className="px-5 py-3">
                <p className="text-amber text-sm bg-amber/10 border border-amber/30 rounded-lg px-3 py-2.5">
                  {orderError}
                </p>
              </div>
            )}

            {ordersLoading ? (
              <div className="p-8 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-surface-hover rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-text-primary font-medium mb-1">No orders found</p>
                <p className="text-text-muted text-sm">Try a different filter or search term.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-line text-left">
                        <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium">Order</th>
                        <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium">Customer</th>
                        <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium">Items</th>
                        <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium text-right">Total</th>
                        <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium">Payment</th>
                        <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.map((order) => {
                        const items = order.OrderItems || [];
                        const isUpdating = updatingOrderId === order.id;
                        return (
                          <tr key={order.id} className="border-b border-border-line/50 last:border-0 hover:bg-surface-hover transition-colors">
                            <td className="px-5 py-3">
                              <p className="text-text-primary font-medium">#{String(order.id).padStart(8, '0')}</p>
                              <p className="text-text-muted text-xs mt-0.5">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </td>
                            <td className="px-5 py-3">
                              <p className="text-text-primary text-sm">{order.User?.name || '—'}</p>
                              <p className="text-text-muted text-xs">{order.User?.email || ''}</p>
                            </td>
                            <td className="px-5 py-3 text-text-muted">
                              {items.length} item{items.length !== 1 ? 's' : ''}
                            </td>
                            <td className="px-5 py-3 text-text-primary font-medium text-right">
                              ₹{Number(order.totalPrice).toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border capitalize ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-teal/10 text-teal border-teal/30'
                                  : order.paymentStatus === 'failed'
                                  ? 'bg-amber/10 text-amber border-amber/30'
                                  : 'bg-surface-hover text-text-muted border-border-line'
                              }`}>
                                {order.paymentStatus}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <select
                                value={order.orderStatus}
                                disabled={isUpdating}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className={`text-xs font-medium capitalize px-2.5 py-1.5 rounded-lg border bg-graphite focus:outline-none focus:ring-1 focus:ring-teal/30 transition-colors disabled:opacity-50 ${
                                  STATUS_STYLES[order.orderStatus] || STATUS_STYLES.processing
                                }`}
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s} value={s} className="bg-graphite text-text-primary">
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <PaginationBar
                  currentPage={orderPage}
                  totalPages={orderTotalPages}
                  onPageChange={setOrderPage}
                  totalItems={filteredOrders.length}
                  pageSize={PAGE_SIZE}
                />
              </>
            )}
          </div>
        )}

        {/* ============ ANALYTICS TAB ============ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-text-primary">Sales Analytics</h2>
                <p className="text-text-muted text-xs">Revenue trends and top performers</p>
              </div>
              <div className="flex gap-2 bg-surface border border-border-line rounded-full p-1">
                {[7, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setAnalyticsRange(d)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      analyticsRange === d
                        ? 'bg-teal text-graphite font-semibold'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            {analyticsLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-surface-hover rounded-xl animate-pulse" />
                  ))}
                </div>
                <div className="h-72 bg-surface-hover rounded-2xl animate-pulse" />
              </div>
            ) : !analytics ? (
              <div className="p-10 text-center bg-surface border border-border-line rounded-2xl">
                <p className="text-text-primary font-medium mb-1">Could not load analytics</p>
                <p className="text-text-muted text-sm">Try switching the time range or refresh the page.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-surface border border-border-line rounded-xl p-5">
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1.5">Total Revenue</p>
                    <p className="font-display text-2xl font-bold text-teal">
                      ₹{analytics.totalRevenue.toLocaleString('en-IN')}
                    </p>
                    <p className="text-text-muted text-[11px] mt-1">Last {analyticsRange} days</p>
                  </div>
                  <div className="bg-surface border border-border-line rounded-xl p-5">
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1.5">Orders</p>
                    <p className="font-display text-2xl font-bold text-text-primary">
                      {analytics.totalOrders.toLocaleString('en-IN')}
                    </p>
                    <p className="text-text-muted text-[11px] mt-1">Paid orders</p>
                  </div>
                  <div className="bg-surface border border-border-line rounded-xl p-5">
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1.5">Avg. Order Value</p>
                    <p className="font-display text-2xl font-bold text-text-primary">
                      ₹{analytics.avgOrderValue.toLocaleString('en-IN')}
                    </p>
                    <p className="text-text-muted text-[11px] mt-1">Per order</p>
                  </div>
                </div>

                <div className="bg-surface border border-border-line rounded-2xl p-5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-teal/70 mb-4">Revenue Trend</p>
                  {analytics.chartData.every((d) => d.revenue === 0) ? (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-text-muted text-sm">No revenue in this period yet</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={analytics.chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                          dataKey="label"
                          stroke="#71717a"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          interval={analyticsRange === 30 ? 4 : 0}
                        />
                        <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} width={50} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#14b8a6"
                          strokeWidth={2}
                          fill="url(#revenueGradient)"
                          dot={{ r: 3, fill: '#14b8a6', strokeWidth: 0 }}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-surface border border-border-line rounded-2xl p-5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-teal/70 mb-4">Top Selling Products</p>
                  {analytics.topProducts.length === 0 ? (
                    <p className="text-text-muted text-sm">No sales in this period yet</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.topProducts.map((p, i) => (
                        <div key={p.name} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-teal/10 text-teal text-xs font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-text-primary text-sm font-medium truncate">{p.name}</p>
                            <p className="text-text-muted text-xs">{p.unitsSold} units sold</p>
                          </div>
                          <p className="text-text-primary text-sm font-semibold shrink-0">
                            ₹{Math.round(p.revenue).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductManagementDashboard;