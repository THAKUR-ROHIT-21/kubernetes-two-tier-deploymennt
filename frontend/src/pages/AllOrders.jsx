import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as orderApi from '../api/orderApi';
import { Package, ChevronRight, Loader2, ShoppingBag, RefreshCw } from 'lucide-react';

const STATUS_STYLES = {
  processing: { label: 'Processing', className: 'bg-amber/10 text-amber border-amber/30' },
  shipped: { label: 'Shipped', className: 'bg-teal/10 text-teal border-teal/30' },
  delivered: { label: 'Delivered', className: 'bg-teal/15 text-teal border-teal/40' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
};

const TAB_DOT_COLORS = {
  all: 'bg-text-muted',
  processing: 'bg-amber',
  shipped: 'bg-teal',
  delivered: 'bg-teal',
  cancelled: 'bg-rose-400',
};

function AllOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOrders = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError('');
    try {
      const data = await orderApi.getMyOrders();
      setOrders(data.orders);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Could not load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user]);

  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');

  const statusCounts = paidOrders.reduce((acc, o) => {
    acc[o.orderStatus] = (acc[o.orderStatus] || 0) + 1;
    return acc;
  }, {});

  const filteredOrders = paidOrders
    .filter((o) => statusFilter === 'all' || o.orderStatus === statusFilter)
    .filter((o) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const idMatch = String(o._id).toLowerCase().includes(query);
      const itemMatch = (o.OrderItems || []).some((item) => item.name.toLowerCase().includes(query));
      return idMatch || itemMatch;
    });

  const statusTabs = [
    { key: 'all', label: 'All', count: paidOrders.length },
    { key: 'processing', label: 'Processing', count: statusCounts.processing || 0 },
    { key: 'shipped', label: 'Shipped', count: statusCounts.shipped || 0 },
    { key: 'delivered', label: 'Delivered', count: statusCounts.delivered || 0 },
    { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled || 0 },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-graphite flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Package className="w-12 h-12 text-text-muted" strokeWidth={1.5} />
        <p className="text-text-primary font-display text-xl">Log in to view your orders</p>
        <Link to="/login" state={{ from: '/orders' }} className="bg-teal hover:bg-teal-dim text-graphite font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-graphite px-6 lg:px-12 py-10">
      <div className="w-full">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
          <h1 className="font-display text-2xl font-bold text-text-primary">Your Orders</h1>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-text-muted hover:text-teal text-xs font-medium border border-border-line hover:border-teal/50 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} strokeWidth={2} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
          <p className="text-text-muted text-sm">Track and manage everything you've ordered</p>
          {lastUpdated && (
            <p className="text-text-muted text-xs">
              Last updated at {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order ID or product name..."
          className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all mb-4"
        />

        <div className="flex gap-2 mb-6 flex-wrap">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                statusFilter === tab.key
                  ? 'bg-teal text-graphite border-teal font-semibold'
                  : 'bg-surface text-text-muted border-border-line hover:border-teal hover:text-teal'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === tab.key ? 'bg-graphite' : TAB_DOT_COLORS[tab.key]}`} />
              {tab.label} <span className="opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-amber text-sm bg-amber/10 border border-amber/30 rounded-lg px-4 py-2.5 mb-5">
            {error}
          </p>
        )}

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-surface border border-border-line rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-16 bg-surface border border-border-line rounded-2xl">
            <ShoppingBag className="w-10 h-10 text-text-muted mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-text-primary font-medium mb-1">
              {orders.length === 0 ? 'No orders yet' : 'No orders match your search'}
            </p>
            <p className="text-text-muted text-sm mb-4">
              {orders.length === 0 ? 'Once you place an order, it will show up here.' : 'Try a different search or filter.'}
            </p>
            {orders.length === 0 && (
              <Link to="/" className="text-teal text-sm font-medium hover:underline">
                Browse Products
              </Link>
            )}
          </div>
        )}

        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const status = STATUS_STYLES[order.orderStatus] || STATUS_STYLES.processing;
            const items = order.OrderItems || [];
            const previewItems = items.slice(0, 3);
            const extraCount = items.length - previewItems.length;
            const isCancelled = order.orderStatus === 'cancelled';

            return (
              <button
                key={order._id}
                onClick={() => navigate(`/order-success/${order._id}`)}
                className={`w-full text-left bg-surface border border-border-line hover:border-teal/40 rounded-2xl p-5 transition-colors ${
                  isCancelled ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <p className="text-text-primary font-semibold text-sm">
                      Order #{String(order._id).padStart(8, '0')}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                      {' · '}
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                {isCancelled && (
                  <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-500/20 rounded-lg px-3 py-2.5 mb-3">
                    <span className="text-rose-400 text-sm mt-0.5">↩</span>
                    <p className="text-rose-300/90 text-xs leading-relaxed">
                      Your full payment will be refunded to your original payment method within 2–3 business days, if eligible.
                    </p>
                  </div>
                )}

                <div className="space-y-2 mb-3">
                  {previewItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-surface-hover rounded-lg overflow-hidden shrink-0">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary text-sm font-medium truncate">{item.name}</p>
                        <p className="text-text-muted text-xs">
                          Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <p className="text-text-primary text-sm font-semibold shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                  {extraCount > 0 && (
                    <p className="text-text-muted text-xs pl-[60px]">
                      +{extraCount} more item{extraCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border-line">
                  <span className="font-display text-text-primary font-bold">
                    ₹{order.totalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="flex items-center gap-1 text-teal text-xs font-medium">
                    View details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AllOrders;