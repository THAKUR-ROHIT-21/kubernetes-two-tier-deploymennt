import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById, getProducts } from '../api/productApi';
import { useCart } from '../context/CartContext';
import {
  ChevronLeft, Heart, Share2, Check, Minus, Plus,
  ShieldCheck, Lock, BadgeCheck, Star, Truck,
} from 'lucide-react';

function resolveImageSrc(src) {
  if (!src) return null;
  if (typeof src === 'string') return src;
  if (typeof src === 'object' && typeof src.url === 'string') return src.url;
  return null;
}

function ProductImage({ src, alt, className = '' }) {
  const resolvedSrc = resolveImageSrc(src);
  const imgRef = useRef(null);
  const [status, setStatus] = useState(resolvedSrc ? 'loading' : 'empty');

  useEffect(() => {
    if (!resolvedSrc) {
      setStatus('empty');
      return;
    }

    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setStatus('loaded');
    } else {
      setStatus('loading');
    }
  }, [resolvedSrc]);

  if (status === 'empty') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-text-muted">
        <span className="text-lg opacity-50">▢</span>
        <span className="text-xs">No image available</span>
      </div>
    );
  }

  return (
    <>
      {status === 'loading' && (
        <div className="absolute inset-0 bg-surface-hover overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <span className="w-1.5 h-1.5 bg-teal/50 rounded-full animate-pulse" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-text-muted bg-surface-hover">
          <span className="text-lg opacity-50">⚠</span>
          <span className="text-xs">Image unavailable</span>
        </div>
      )}
      <img
        ref={imgRef}
        src={resolvedSrc}
        alt={alt}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`${className} transition-opacity duration-500 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}

function StarRating({ value = 0, size = 13 }) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  const gap = 2; // px, matches Tailwind's gap-0.5
  const width = size * 5 + gap * 4;
  return (
    <span className="relative inline-flex" style={{ width, height: size }}>
      <span className="absolute inset-0 flex gap-0.5 text-border-line">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} strokeWidth={0} fill="currentColor" />
        ))}
      </span>
      <span className="absolute inset-0 flex gap-0.5 text-amber overflow-hidden" style={{ width: `${pct}%` }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} strokeWidth={0} fill="currentColor" className="shrink-0" />
        ))}
      </span>
    </span>
  );
}

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, error: cartError } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [qtyAtMax, setQtyAtMax] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const requestIdRef = useRef(0);
  const copiedTimeoutRef = useRef(null);
  const cartTimeoutRef = useRef(null);
  const qtyMaxTimeoutRef = useRef(null);

  useEffect(() => {
    const thisRequestId = ++requestIdRef.current;

    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      // Reset all per-product UI state immediately so stale state from the
      // previous product never bleeds into the next one while loading.
      setProduct(null);
      setRelated([]);
      setActiveImage(0);
      setQuantity(1);
      setWishlisted(false);
      setCopied(false);
      setShareError(false);
      setAddedToCart(false);
      setQtyAtMax(false);
      setActionError('');

      try {
        const data = await getProductById(id);
        if (requestIdRef.current !== thisRequestId) return; // stale response, ignore

        setProduct(data.product);

        try {
          const allProducts = await getProducts();
          if (requestIdRef.current !== thisRequestId) return;
          const sameCategory = allProducts.products
            .filter((p) => p.category === data.product.category && p.id !== data.product.id)
            .slice(0, 4);
          setRelated(sameCategory);
        } catch {
          if (requestIdRef.current === thisRequestId) setRelated([]);
        }
      } catch (err) {
        if (requestIdRef.current !== thisRequestId) return;
        setError('Product not found');
      } finally {
        if (requestIdRef.current === thisRequestId) setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current);
      if (qtyMaxTimeoutRef.current) clearTimeout(qtyMaxTimeoutRef.current);
    };
  }, []);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setShareError(false);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError(true);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setShareError(false), 2000);
    }
  };

  const handleAddToCart = async () => {
    setActionError('');
    try {
      await addItem(product.id, quantity);
      setAddedToCart(true);
      if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current);
      cartTimeoutRef.current = setTimeout(() => setAddedToCart(false), 1600);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not add to cart');
    }
  };

  const handleBuyNow = async () => {
    setActionError('');
    setBuyNowLoading(true);
    try {
      await addItem(product.id, quantity);
      navigate('/checkout');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not proceed to checkout');
    } finally {
      setBuyNowLoading(false);
    }
  };

  const increment = () => {
    if (!product) return;
    setQuantity((q) => {
      if (q >= product.stock) {
        setQtyAtMax(true);
        if (qtyMaxTimeoutRef.current) clearTimeout(qtyMaxTimeoutRef.current);
        qtyMaxTimeoutRef.current = setTimeout(() => setQtyAtMax(false), 900);
        return q;
      }
      return q + 1;
    });
  };

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));

  if (loading) {
    return (
      <div className="min-h-screen bg-graphite px-6 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-96 bg-surface border border-border-line rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
          </div>
          <div className="space-y-4">
            <div className="h-3 bg-surface rounded w-1/5 relative overflow-hidden"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" /></div>
            <div className="h-8 bg-surface rounded w-3/4 relative overflow-hidden"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" /></div>
            <div className="h-5 bg-surface rounded w-1/3 relative overflow-hidden"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" /></div>
            <div className="h-10 bg-surface rounded w-1/2 relative overflow-hidden"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" /></div>
            <div className="h-24 bg-surface rounded relative overflow-hidden"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" /></div>
            <div className="h-12 bg-surface rounded relative overflow-hidden"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" /></div>
          </div>
        </div>
        <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-graphite flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-text-primary font-display text-xl">{error || 'Product not found'}</p>
        <p className="text-text-muted text-sm max-w-sm">
          The item you're looking for may have been removed or the link is incorrect.
        </p>
        <Link to="/" className="text-teal text-sm hover:underline mt-2 inline-flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to catalog
        </Link>
      </div>
    );
  }

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const rating = product.ratingsAverage || 0;
  const reviewCount = product.ratingsCount || 0;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const images = product.images && product.images.length > 0 ? product.images : [null];
  const hasDescription = Boolean(product.description && product.description.trim().length > 0);

  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + 4);
  const deliveryLabel = deliveryDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const specs = [
    { label: 'Category', value: product.category },
    { label: 'Brand', value: product.brand || '—' },
    { label: 'SKU', value: product.sku },
    { label: 'Stock', value: `${product.stock} units` },
  ];

  return (
    <div className="min-h-screen bg-graphite">
      <div className="px-6 pt-6 max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-text-muted hover:text-teal text-sm flex items-center gap-1 transition-colors group"
        >
          <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

        <div>
          <div className="relative bg-surface border border-border-line rounded-2xl overflow-hidden h-96 flex items-center justify-center">
            {hasDiscount && (
              <span className="absolute top-4 left-4 z-10 bg-amber text-graphite text-xs font-bold px-2.5 py-1 rounded-md shadow-lg shadow-black/20">
                -{discountPct}% OFF
              </span>
            )}

            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={() => setWishlisted((w) => !w)}
                className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-200 active:scale-90 ${
                  wishlisted ? 'bg-amber/20 text-amber border border-amber/40' : 'bg-graphite/60 text-text-muted hover:text-amber border border-transparent'
                }`}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={wishlisted}
              >
                <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-graphite/60 backdrop-blur-sm flex items-center justify-center text-text-muted hover:text-teal transition-colors relative active:scale-90"
                aria-label="Share product"
              >
                <Share2 size={15} strokeWidth={2} />
                {(copied || shareError) && (
                  <span
                    role="status"
                    aria-live="polite"
                    className={`absolute -bottom-9 right-0 border text-[11px] px-2.5 py-1 rounded-md whitespace-nowrap shadow-lg animate-[fadeUp_0.15s_ease-out] ${
                      shareError
                        ? 'bg-surface border-amber/40 text-amber'
                        : 'bg-surface border-border-line text-text-primary'
                    }`}
                  >
                    {shareError ? 'Couldn\u2019t copy link' : 'Link copied!'}
                  </span>
                )}
              </button>
            </div>

            <ProductImage
              src={images[activeImage]}
              alt={product.name}
              className="w-full h-full object-cover absolute inset-0"
            />
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-3" role="tablist" aria-label="Product images">
              {images.map((img, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={activeImage === i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 relative shrink-0 ${
                    activeImage === i ? 'border-teal' : 'border-border-line hover:border-teal/50'
                  }`}
                >
                  {img ? (
                    <img
                      src={resolveImageSrc(img) || ''}
                      alt={`${product.name} thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-hover flex items-center justify-center text-text-muted text-[10px]">
                      N/A
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 bg-surface border border-border-line rounded-2xl p-5">
            <h2 className="font-display text-sm font-bold text-text-primary mb-3 uppercase tracking-wide">Specifications</h2>
            <div className="space-y-2.5">
              {specs.map((spec) => (
                <div key={spec.label} className="flex justify-between gap-4 text-sm border-b border-border-line/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-text-muted capitalize shrink-0">{spec.label}</span>
                  <span className="text-text-primary font-medium capitalize text-right break-words">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-teal text-xs font-medium uppercase tracking-wide mb-2">{product.category}</p>
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2 leading-tight break-words">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {reviewCount > 0 ? (
              <span className="flex items-center gap-1.5 bg-teal/10 text-teal text-sm font-semibold px-2.5 py-1 rounded-md">
                <StarRating value={rating} size={12} />
                <span className="text-teal">{rating.toFixed(1)}</span>
                <span className="text-teal/70">({reviewCount} reviews)</span>
              </span>
            ) : (
              <span className="text-text-muted text-sm">No ratings yet</span>
            )}
            <span className="text-text-muted text-xs font-mono border-l border-border-line pl-3">SKU: {product.sku}</span>
          </div>

          <div className="flex items-baseline gap-3 mb-1 flex-wrap">
            <p className="font-display text-4xl font-bold text-text-primary tracking-tight">
              ₹{(hasDiscount ? product.discountPrice : product.price).toLocaleString('en-IN')}
            </p>
            {hasDiscount && (
              <p className="text-text-muted text-lg line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </p>
            )}
          </div>
          {hasDiscount ? (
            <p className="text-amber text-sm font-medium mb-5">
              You save ₹{(product.price - product.discountPrice).toLocaleString('en-IN')} ({discountPct}%)
            </p>
          ) : (
            <div className="mb-5" />
          )}

          <div className="mb-4">
            {isOutOfStock ? (
              <span className="text-text-muted text-sm border border-border-line px-3 py-1.5 rounded-full inline-block">
                Out of stock
              </span>
            ) : isLowStock ? (
              <span className="text-amber text-sm border border-amber/30 bg-amber/10 px-3 py-1.5 rounded-full inline-block">
                Only {product.stock} left in stock — order soon
              </span>
            ) : (
              <span className="text-teal text-sm border border-teal/30 bg-teal/10 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                <Check size={13} strokeWidth={2.5} />
                In stock ({product.stock} available)
              </span>
            )}
          </div>

          {!isOutOfStock && (
            <div className="flex items-center gap-2.5 text-sm text-text-muted mb-6 bg-surface border border-border-line rounded-xl px-4 py-3">
              <Truck size={16} className="text-teal shrink-0" strokeWidth={1.75} />
              <span>Estimated delivery by <span className="text-text-primary font-medium">{deliveryLabel}</span></span>
            </div>
          )}

          {hasDescription && (
            <div className="mb-6">
              <h2 className="font-display text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">Description</h2>
              <p className="text-text-muted text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {!isOutOfStock && (
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex items-center border border-border-line rounded-xl overflow-hidden">
                <button
                  onClick={decrement}
                  disabled={quantity <= 1}
                  className="px-3 py-2.5 text-text-muted hover:text-teal disabled:opacity-30 disabled:hover:text-text-muted disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="px-4 text-text-primary font-medium text-sm min-w-[2rem] text-center tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={increment}
                  disabled={quantity >= product.stock}
                  className={`px-3 py-2.5 text-text-muted hover:text-teal disabled:opacity-30 disabled:hover:text-text-muted disabled:cursor-not-allowed transition-colors ${
                    qtyAtMax ? 'animate-[shake_0.3s_ease-in-out]' : ''
                  }`}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className={`text-xs transition-colors ${qtyAtMax ? 'text-amber' : 'text-text-muted'}`}>
                {qtyAtMax ? `Max ${product.stock} available` : `${product.stock} available`}
              </span>
            </div>
          )}

          {actionError && (
            <p className="text-amber text-sm bg-amber/10 border border-amber/30 rounded-lg px-3 py-2.5 mb-4">
              {actionError}
            </p>
          )}

          <div className="flex gap-3">
            {isOutOfStock ? (
              <button disabled className="w-full bg-surface-hover text-text-muted text-sm font-semibold py-3 rounded-xl cursor-not-allowed">
                Out of Stock
              </button>
            ) : (
              <>
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 border text-sm font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
                    addedToCart
                      ? 'bg-teal/15 border-teal text-teal'
                      : 'bg-surface-hover hover:bg-surface border-border-line hover:border-teal text-text-primary'
                  }`}
                >
                  {addedToCart ? (<><Check size={16} /> Added to Cart</>) : 'Add to Cart'}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={buyNowLoading}
                  className="flex-1 bg-teal hover:bg-teal-dim text-graphite text-sm font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                >
                  {buyNowLoading ? 'Processing...' : 'Buy Now'}
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-border-line">
            <div className="flex flex-col items-center text-center gap-1.5">
              <BadgeCheck size={20} className="text-teal" strokeWidth={1.75} />
              <p className="text-text-muted text-[11px]">Genuine product</p>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <Lock size={20} className="text-teal" strokeWidth={1.75} />
              <p className="text-text-muted text-[11px]">Secure checkout</p>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <ShieldCheck size={20} className="text-teal" strokeWidth={1.75} />
              <p className="text-text-muted text-[11px]">Listed specs verified</p>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="px-6 py-12 max-w-6xl mx-auto border-t border-border-line">
          <h2 className="font-display text-xl font-bold text-text-primary mb-6">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/products/${item.id}`)}
                className="group bg-surface border border-border-line rounded-xl overflow-hidden hover:border-teal/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal/5 transition-all duration-300 cursor-pointer"
              >
                <div className="h-36 bg-surface-hover relative overflow-hidden">
                  <ProductImage
                    src={item.images?.[0]}
                    alt={item.name}
                    className="h-full w-full object-cover absolute inset-0 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="text-text-primary text-sm font-medium truncate">{item.name}</p>
                  <p className="font-display text-base text-text-primary font-bold mt-1">
                    ₹{item.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }
      `}</style>
    </div>
  );
}

export default ProductDetail;