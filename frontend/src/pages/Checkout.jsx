import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import * as addressApi from '../api/addressApi';
import * as orderApi from '../api/orderApi';
import {
  MapPin, Plus, Loader2, ShieldCheck, AlertTriangle, Check, Lock,
  Package, Truck,
} from 'lucide-react';

function resolveImageSrc(src) {
  if (!src) return null;
  if (typeof src === 'string') return src;
  if (typeof src === 'object' && typeof src.url === 'string') return src.url;
  return null;
}

function CheckoutItemImage({ src, alt }) {
  const resolvedSrc = resolveImageSrc(src);
  const [status, setStatus] = useState(resolvedSrc ? 'loading' : 'empty');

  if (status === 'empty') {
    return (
      <div className="w-full h-full flex items-center justify-center text-text-muted">
        <Package size={16} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <>
      {status === 'loading' && <div className="absolute inset-0 bg-surface-hover" />}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted bg-surface-hover">
          <Package size={16} strokeWidth={1.5} />
        </div>
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}

function Checkout() {
  const { user } = useAuth();
  const { cart, totalPrice, itemCount, refreshCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchAddresses = async () => {
      try {
        const data = await addressApi.getAddresses();
        setAddresses(data.addresses);
        const defaultAddr = data.addresses.find((a) => a.isDefault);
        setSelectedAddressId(defaultAddr?._id || data.addresses[0]?._id || null);
      } catch (err) {
        setError('Could not load addresses');
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, [user]);

  const shippingPrice = totalPrice >= 999 ? 0 : 49;
  const grandTotal = totalPrice + shippingPrice;

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }

    setError('');
    setPlacing(true);

    try {
      const data = await orderApi.createRazorpayOrder(selectedAddressId);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: 'Electronix',
        description: `Order for ${itemCount} item${itemCount !== 1 ? 's' : ''}`,
        handler: async (response) => {
          try {
            const verifyData = await orderApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: data.orderId,
            });
            await refreshCart();
            navigate(`/order-success/${verifyData.order._id}`);
          } catch (err) {
            setError('Payment verification failed. If money was deducted, it will be refunded.');
            setPlacing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#00D9C0',
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      };

      const razorpayCheckout = new window.Razorpay(options);
      razorpayCheckout.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start checkout');
      setPlacing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-graphite flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-text-primary font-display text-xl">Log in to checkout</p>
        <Link to="/login" state={{ from: '/checkout' }} className="bg-teal hover:bg-teal-dim text-graphite font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
          Log In
        </Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-graphite flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-text-primary font-display text-xl">Your cart is empty</p>
        <Link to="/" className="bg-teal hover:bg-teal-dim text-graphite font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-graphite px-6 lg:px-12 py-10 pb-32 lg:pb-10">
      <div className="w-full">
        <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight mb-1">Checkout</h1>
        <p className="text-text-muted text-sm mb-8">{itemCount} item{itemCount !== 1 ? 's' : ''} · ₹{grandTotal.toLocaleString('en-IN')}</p>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 text-amber text-sm bg-amber/10 ring-1 ring-amber/30 rounded-xl px-4 py-3 mb-6">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
          <div className="space-y-8">

            {/* Step 1 — Delivery Address */}
            <div className="bg-surface ring-1 ring-border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.3),0_12px_24px_-12px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal/15 text-teal text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <h2 className="text-text-primary text-base font-bold">Delivery Address</h2>
                </div>
                <Link to="/addresses" className="flex items-center gap-1 text-teal text-xs font-medium hover:underline shrink-0">
                  <Plus size={13} strokeWidth={2} />
                  Add New
                </Link>
              </div>

              {loadingAddresses && (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-24 bg-surface-hover rounded-xl animate-pulse" />
                  ))}
                </div>
              )}

              {!loadingAddresses && addresses.length === 0 && (
                <div className="text-center py-10 bg-surface-hover rounded-xl">
                  <MapPin className="w-8 h-8 text-text-muted mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-text-primary text-sm font-medium mb-1">No saved addresses</p>
                  <Link to="/addresses" className="text-teal text-sm hover:underline">Add an address to continue</Link>
                </div>
              )}

              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr._id;
                  return (
                    <label
                      key={addr._id}
                      className={`flex items-start gap-3 rounded-xl p-4 cursor-pointer transition-all duration-200 ring-1 ${
                        isSelected
                          ? 'ring-teal bg-teal/[0.06]'
                          : 'ring-border-line hover:ring-teal/40 bg-surface-hover/40'
                      }`}
                    >
                      <span
                        className={`relative w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-teal' : 'border-border-line'
                        }`}
                      >
                        {isSelected && <span className="w-2 h-2 rounded-full bg-teal" />}
                      </span>
                      <input
                        type="radio"
                        name="address"
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addr._id)}
                        className="sr-only"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-text-primary font-semibold text-sm">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-teal text-[10px] font-semibold bg-teal/10 px-1.5 py-0.5 rounded-full">Default</span>
                          )}
                        </div>
                        <p className="text-text-primary text-sm">{addr.fullName}</p>
                        <p className="text-text-muted text-xs mt-0.5 leading-relaxed">
                          {addr.street}, {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        <p className="text-text-muted text-xs">{addr.phone}</p>
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-teal shrink-0" strokeWidth={2.5} />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Step 2 — Order Items */}
            <div className="bg-surface ring-1 ring-border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.3),0_12px_24px_-12px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-6 h-6 rounded-full bg-teal/15 text-teal text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <h2 className="text-text-primary text-base font-bold">Items ({itemCount})</h2>
              </div>

              <div className="divide-y divide-border-line">
                {cart.items.map((item) => {
                  const unitPrice = item.product?.discountPrice || item.product?.price || 0;
                  const lineTotal = unitPrice * item.quantity;
                  return (
                    <div key={item.product?._id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="relative w-14 h-14 bg-surface-hover rounded-lg overflow-hidden shrink-0 ring-1 ring-border-line">
                        <CheckoutItemImage src={item.product?.images?.[0]} alt={item.product?.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary text-sm font-medium truncate">{item.product?.name}</p>
                        <p className="text-text-muted text-xs mt-0.5">
                          Qty {item.quantity} {item.quantity > 1 && `· ₹${unitPrice.toLocaleString('en-IN')} each`}
                        </p>
                      </div>
                      <p className="text-text-primary text-sm font-semibold tabular-nums shrink-0">
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 3 — Order Summary / Payment */}
          <div className="lg:sticky lg:top-10 h-fit">
            <div className="bg-surface ring-1 ring-border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.3),0_12px_24px_-12px_rgba(0,0,0,0.4)]">
              <h2 className="text-text-primary text-base font-bold mb-5">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="text-text-primary font-medium tabular-nums">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Truck size={13} className="text-teal/70" strokeWidth={1.75} />
                    Shipping
                  </span>
                  <span className={shippingPrice === 0 ? 'text-teal font-medium' : 'text-text-primary font-medium'}>
                    {shippingPrice === 0 ? 'Free' : `₹${shippingPrice}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline mt-5 pt-5 border-t border-border-line">
                <span className="text-text-primary font-semibold">Total</span>
                <span className="font-display text-2xl text-text-primary font-bold tabular-nums tracking-tight">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddressId}
                className="w-full flex items-center justify-center gap-2 bg-teal hover:bg-teal-dim text-graphite text-sm font-bold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-[0_8px_20px_-6px_rgba(20,184,166,0.45)] disabled:shadow-none"
              >
                {placing && <Loader2 className="w-4 h-4 animate-spin" />}
                {placing ? 'Processing...' : `Pay ₹${grandTotal.toLocaleString('en-IN')}`}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-4 text-text-muted text-xs">
                <ShieldCheck size={13} className="text-teal/70" strokeWidth={1.75} />
                Payments secured by Razorpay
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-4 text-text-muted/70 text-[11px]">
              <Lock size={11} strokeWidth={2} />
              256-bit encrypted connection
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky pay bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface ring-1 ring-border-line px-6 py-4 flex items-center justify-between gap-4 z-40 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.4)]">
        <div>
          <p className="text-text-muted text-[11px]">Total</p>
          <p className="text-text-primary font-display text-lg font-bold tabular-nums">
            ₹{grandTotal.toLocaleString('en-IN')}
          </p>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={placing || !selectedAddressId}
          className="flex items-center justify-center gap-2 bg-teal hover:bg-teal-dim text-graphite text-sm font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {placing && <Loader2 size={15} className="animate-spin" />}
          {placing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </div>
  );
}

export default Checkout;