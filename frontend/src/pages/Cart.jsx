import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  Trash2, Minus, Plus, ShoppingBag, Loader2, Lock,
  Truck, AlertTriangle, ChevronRight, Tag,
} from 'lucide-react';

const FREE_DELIVERY_THRESHOLD = 500;

function resolveImageSrc(src) {
  if (!src) return null;
  if (typeof src === 'string') return src;
  if (typeof src === 'object' && typeof src.url === 'string') return src.url;
  return null;
}

function CartItemImage({ src, alt }) {
  const resolvedSrc = resolveImageSrc(src);
  const [status, setStatus] = useState(resolvedSrc ? 'loading' : 'empty');

  if (status === 'empty') {
    return (
      <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">
        No image
      </div>
    );
  }

  return (
    <>
      {status === 'loading' && <div className="absolute inset-0 bg-surface-hover" />}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted text-[10px] bg-surface-hover">
          Unavailable
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

function CartItemRow({ item, isLast, isPending, onUpdate, onRemove, onNavigate }) {
  const [removing, setRemoving] = useState(false);
  const product = item.product;
  if (!product) return null;

  const price = product.discountPrice || product.price;
  const lineTotal = price * item.quantity;
  const atMaxStock = item.quantity >= product.stock;
  const exceedsStock = item.quantity > product.stock;
  const pending = isPending(product._id);

  const handleRemove = async () => {
    setRemoving(true);
    const result = await onRemove(product._id);
    if (!result?.success) setRemoving(false);
  };

  return (
    <div
      className={`grid grid-cols-[112px_1fr] gap-5 py-6 transition-opacity duration-300 ${
        !isLast ? 'border-b border-border-line' : ''
      } ${removing ? 'opacity-30' : 'opacity-100'}`}
    >
      {/* Larger, properly framed product image — the single biggest fix:
          a 112px ring-bordered square reads as a real product photo, not
          a thumbnail squeezed into a list row. */}
      <div
        onClick={() => onNavigate(product._id)}
        className="relative w-28 h-28 bg-surface-hover rounded-xl overflow-hidden shrink-0 cursor-pointer ring-1 ring-border-line"
      >
        <CartItemImage src={product.images?.[0]} alt={product.name} />
      </div>

      {/* Everything to the right sits on one explicit grid: name+remove on
          row 1, category on row 2, then a bottom row that pins the
          quantity stepper to the left and the price to the right at the
          same baseline — instead of price "floating" wherever it lands. */}
      <div className="flex flex-col min-h-28">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              onClick={() => onNavigate(product._id)}
              className="text-text-primary text-base font-semibold leading-snug cursor-pointer hover:text-teal transition-colors line-clamp-2"
            >
              {product.name}
            </p>
            <p className="text-text-muted text-xs mt-1 capitalize">{product.category}</p>
          </div>

          <button
            onClick={handleRemove}
            disabled={removing || pending}
            className="text-text-muted hover:text-amber transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 -mt-1 -mr-1 p-1.5 rounded-md hover:bg-surface-hover"
            aria-label="Remove from cart"
          >
            {removing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} strokeWidth={1.75} />}
          </button>
        </div>

        {exceedsStock && (
          <p className="flex items-center gap-1.5 text-amber text-xs mt-2">
            <AlertTriangle size={12} strokeWidth={2} />
            Only {product.stock} left in stock
          </p>
        )}

        <div className="flex-1" />

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex items-center bg-surface-hover rounded-lg overflow-hidden h-9 ring-1 ring-border-line">
            {pending && (
              <div className="absolute inset-0 bg-surface/85 flex items-center justify-center z-10">
                <Loader2 size={13} className="animate-spin text-teal" />
              </div>
            )}
            <button
              onClick={() => onUpdate(product._id, Math.max(1, item.quantity - 1))}
              disabled={pending || item.quantity <= 1}
              className="w-9 h-full flex items-center justify-center text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              <Minus size={13} />
            </button>
            <span className="w-9 text-text-primary text-sm font-semibold tabular-nums text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => !atMaxStock && onUpdate(product._id, item.quantity + 1)}
              disabled={atMaxStock || pending}
              className="w-9 h-full flex items-center justify-center text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="text-right shrink-0">
            {item.quantity > 1 && (
              <p className="text-text-muted text-xs leading-none mb-1 tabular-nums">
                ₹{price.toLocaleString('en-IN')} each
              </p>
            )}
            <p className="text-text-primary font-display font-bold text-lg tabular-nums tracking-tight">
              ₹{lineTotal.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cart() {
  const { cart, loading, error, itemCount, totalPrice, updateItem, removeItem, isPending } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);

  const hasStockIssue = cart.items.some(
    (item) => item.product && item.quantity > item.product.stock
  );

  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - totalPrice);
  const qualifiesForFreeDelivery = remainingForFreeDelivery === 0;
  const deliveryProgressPct = Math.min(100, (totalPrice / FREE_DELIVERY_THRESHOLD) * 100);

  const handleCheckout = () => {
    setCheckingOut(true);
    navigate('/checkout');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-graphite flex flex-col items-center justify-center gap-4 px-6 text-center">
        <ShoppingBag className="w-10 h-10 text-text-muted" strokeWidth={1.5} />
        <div>
          <p className="text-text-primary font-display text-xl mb-1">Log in to view your cart</p>
          <p className="text-text-muted text-sm">Your cart is saved to your account once you're logged in.</p>
        </div>
        <Link
          to="/login"
          state={{ from: '/cart' }}
          className="bg-teal hover:bg-teal-dim text-graphite font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          Log In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-graphite px-6 lg:px-12 py-10">
        <div className="w-full">
          <div className="h-7 w-40 bg-surface rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
            <div className="bg-surface ring-1 ring-border-line rounded-2xl px-6 divide-y divide-border-line">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-[112px_1fr] gap-5 py-6">
                  <div className="w-28 h-28 bg-surface-hover rounded-xl animate-pulse" />
                  <div className="space-y-2 py-1">
                    <div className="h-4 bg-surface-hover rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-surface-hover rounded w-1/4 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-72 bg-surface ring-1 ring-border-line rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-graphite flex flex-col items-center justify-center gap-4 px-6 text-center">
        <ShoppingBag className="w-10 h-10 text-text-muted" strokeWidth={1.5} />
        <div>
          <p className="text-text-primary font-display text-xl mb-1">Your cart is empty</p>
          <p className="text-text-muted text-sm">Browse the catalog and add something you like.</p>
        </div>
        <Link
          to="/"
          className="bg-teal hover:bg-teal-dim text-graphite font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-graphite px-6 lg:px-12 py-10 pb-28 lg:pb-10">
      <div className="w-full">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">
            Cart <span className="text-text-muted font-normal text-lg">({itemCount})</span>
          </h1>
        </div>

        {error && (
          <div role="alert" className="text-amber text-sm bg-amber/10 border border-amber/30 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {!qualifiesForFreeDelivery && (
          <div className="bg-surface ring-1 ring-border-line rounded-xl px-5 py-4 mb-6 flex items-center gap-4">
            <Truck size={18} className="text-teal shrink-0" strokeWidth={1.75} />
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-sm font-medium mb-2">
                Add ₹{remainingForFreeDelivery.toLocaleString('en-IN')} more for free delivery
              </p>
              <div className="h-1.5 bg-border-line rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal rounded-full transition-all duration-500"
                  style={{ width: `${deliveryProgressPct}%` }}
                />
              </div>
            </div>
          </div>
        )}
        {qualifiesForFreeDelivery && (
          <div className="bg-teal/10 ring-1 ring-teal/30 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
            <Truck size={18} className="text-teal shrink-0" strokeWidth={1.75} />
            <p className="text-teal text-sm font-medium">You've unlocked free delivery on this order</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
          {/* Real card depth: a soft layered shadow plus a ring, instead
              of a flat bordered rectangle — this single change does more
              for "premium" than any added decoration would. */}
          <div className="bg-surface ring-1 ring-border-line rounded-2xl px-6 divide-y divide-border-line shadow-[0_1px_3px_rgba(0,0,0,0.3),0_12px_24px_-12px_rgba(0,0,0,0.4)]">
            {cart.items.map((item, idx) => (
              <CartItemRow
                key={item.product?._id}
                item={item}
                isLast={idx === cart.items.length - 1}
                isPending={isPending}
                onUpdate={updateItem}
                onRemove={removeItem}
                onNavigate={(id) => navigate(`/products/${id}`)}
              />
            ))}
          </div>

          <div className="lg:sticky lg:top-10 h-fit">
            <div className="bg-surface ring-1 ring-border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.3),0_12px_24px_-12px_rgba(0,0,0,0.4)]">
              <h2 className="text-text-primary text-base font-bold mb-5">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Items ({itemCount})</span>
                  <span className="text-text-primary font-medium tabular-nums">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Delivery</span>
                  <span className={qualifiesForFreeDelivery ? 'text-teal font-medium' : 'text-text-muted'}>
                    {qualifiesForFreeDelivery ? 'Free' : 'At checkout'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Tax</span>
                  <span className="text-text-muted">At checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline mt-5 pt-5 border-t border-border-line">
                <span className="text-text-primary font-semibold">Order total</span>
                <span className="font-display text-2xl text-text-primary font-bold tabular-nums tracking-tight">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
              </div>

              {hasStockIssue && (
                <div className="flex items-start gap-2 text-amber text-xs bg-amber/10 ring-1 ring-amber/30 rounded-lg px-3 py-2.5 mt-4">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" strokeWidth={2} />
                  <span>Some items exceed available stock.</span>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={checkingOut || hasStockIssue}
                className="w-full bg-teal hover:bg-teal-dim text-graphite text-sm font-bold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-[0_8px_20px_-6px_rgba(20,184,166,0.45)] disabled:shadow-none"
              >
                {checkingOut ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Checkout
                    <ChevronRight size={16} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-4 text-text-muted text-xs">
                <Lock size={12} strokeWidth={2} />
                Secure checkout
              </div>
            </div>

            <div className="flex items-start gap-2.5 mt-4 px-2">
              <Tag size={14} className="text-text-muted mt-0.5 shrink-0" strokeWidth={1.75} />
              <p className="text-text-muted text-xs leading-relaxed">
                Have a promo code? You can apply it at checkout.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface ring-1 ring-border-line px-6 py-4 flex items-center justify-between gap-4 z-40 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.4)]">
        <div>
          <p className="text-text-muted text-[11px]">Order total</p>
          <p className="text-text-primary font-display text-lg font-bold tabular-nums">
            ₹{totalPrice.toLocaleString('en-IN')}
          </p>
        </div>
        <button
          onClick={handleCheckout}
          disabled={checkingOut || hasStockIssue}
          className="bg-teal hover:bg-teal-dim text-graphite text-sm font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {checkingOut ? <Loader2 size={15} className="animate-spin" /> : 'Checkout'}
        </button>
      </div>
    </div>
  );
}

export default Cart;