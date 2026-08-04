import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../api/productApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  Headphones, Cpu, Smartphone, Watch, Cable, Gamepad2,
  SlidersHorizontal, ChevronDown, X, Laptop, Camera,
  ChevronLeft, ChevronRight, Star, Heart, Package, Zap, ShieldCheck,
  Loader2, Check,
} from 'lucide-react';

function resolveImageSrc(src) {
  if (!src) return null;
  if (typeof src === 'string') return src;
  if (typeof src === 'object' && typeof src.url === 'string') return src.url;
  return null;
}

function ProductImage({ src, alt }) {
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
        <div className="absolute inset-0 bg-surface-hover overflow-hidden flex flex-col items-center justify-center gap-1.5">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <span className="w-1.5 h-1.5 bg-teal/50 rounded-full animate-pulse" />
          <span className="text-text-muted text-[11px]">Loading image…</span>
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
        className={`h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.06] ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}

function StarRating({ value = 0, size = 12 }) {
  const pct = Math.max(0, Math.min(5, value)) / 5 * 100;
  const gap = 2;
  const width = size * 5 + gap * 4;
  return (
    <span className="relative inline-flex" style={{ width, height: size }}>
      <span className="absolute inset-0 flex gap-0.5 text-border-line">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} strokeWidth={0} fill="currentColor" />
        ))}
      </span>
      <span
        className="absolute inset-0 flex gap-0.5 text-amber overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} strokeWidth={0} fill="currentColor" className="shrink-0" />
        ))}
      </span>
    </span>
  );
}

function HeroCarousel() {
  const slides = [
    { Icon: Headphones, tag: 'Audio', title: 'Sound that moves with you.', subtitle: 'Premium headphones and speakers.' },
    { Icon: Laptop, tag: 'Computing', title: 'Power for what you build.', subtitle: 'Monitors, peripherals, and gear for serious workstations.' },
    { Icon: Smartphone, tag: 'Mobile', title: 'Stay charged, stay connected.', subtitle: 'Chargers, stands, and accessories that just work.' },
    { Icon: Watch, tag: 'Wearables', title: 'Wear your next upgrade.', subtitle: 'Smartwatches and fitness tech with real specs.' },
    { Icon: Camera, tag: 'Gear', title: 'Capture it properly.', subtitle: 'Cameras and accessories for creators who care about quality.' },
  ];

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % slides.length);
      setProgressKey((k) => k + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goTo = (i, dir = 1) => {
    setDirection(dir);
    setIndex(((i % slides.length) + slides.length) % slides.length);
    setProgressKey((k) => k + 1);
  };

  const slide = slides[index];

  return (
    <section className="relative px-6 py-12 overflow-hidden border-b border-border-line">
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[560px] h-56 bg-teal/[0.12] rounded-full blur-3xl pointer-events-none transition-all duration-700" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-teal/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-xl mx-auto text-center">
        <div
          key={index}
          className={direction === 1 ? 'animate-[slideInRight_0.55s_cubic-bezier(0.22,1,0.36,1)]' : 'animate-[slideInLeft_0.55s_cubic-bezier(0.22,1,0.36,1)]'}
        >
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/30 flex items-center justify-center shadow-[0_0_24px_-4px_var(--tw-shadow-color)] shadow-teal/30">
              <slide.Icon className="w-7 h-7 text-teal" strokeWidth={1.6} />
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-teal uppercase tracking-wider mb-3">
            <span className="w-1 h-1 rounded-full bg-teal" />
            {slide.tag}
          </span>
          <h1 className="font-display text-[28px] md:text-4xl font-bold text-text-primary mb-2 leading-tight tracking-tight">
            {slide.title}
          </h1>
          <p className="text-text-muted text-sm md:text-[15px] max-w-md mx-auto leading-relaxed">{slide.subtitle}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > index ? 1 : -1)}
              className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
                i === index ? 'w-8 bg-border-line' : 'w-1.5 bg-border-line hover:bg-text-muted'
              }`}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
            >
              {i === index && (
                <span key={progressKey} className="absolute inset-y-0 left-0 bg-teal rounded-full animate-[fillBar_4s_linear_forwards]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fillBar { from { width: 0%; } to { width: 100%; } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </section>
  );
}

function AddToCartButton({ isAdding, justAdded, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={isAdding}
      aria-busy={isAdding}
      className={`flex-1 border text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
        justAdded
          ? 'bg-teal/15 border-teal text-teal animate-[addBounce_0.4s_ease-out]'
          : isAdding
          ? 'bg-surface-hover border-border-line text-text-muted'
          : 'bg-transparent hover:bg-surface-hover border-border-line hover:border-teal/60 text-text-primary'
      }`}
    >
      {isAdding ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Adding...
        </>
      ) : justAdded ? (
        <>
          <Check size={14} className="animate-[checkPop_0.3s_ease-out]" strokeWidth={2.5} />
          Added
        </>
      ) : (
        'Add to Cart'
      )}
    </button>
  );
}

function ProductCard({ product, isWishlisted, justAdded, isAdding, cartError, onNavigate, onToggleWishlist, onAddToCart, onBuyNow }) {
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const rating = product.ratingsAverage || 0;
  const reviewCount = product.ratingsCount || 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  return (
    <div
      onClick={onNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate();
        }
      }}
      className={`group relative bg-graphite rounded-2xl overflow-hidden cursor-pointer
        ring-1 ring-border-line
        shadow-[0_1px_2px_rgba(0,0,0,0.4)]
        transition-all duration-300 ease-out
        hover:ring-teal/40 hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.55),0_0_0_1px_rgba(20,184,166,0.08)]
        hover:-translate-y-1
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60
        ${justAdded ? 'ring-teal/50' : ''}`}
    >
      <div className="h-56 bg-surface-hover relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/[0.03] via-transparent to-black/[0.12] pointer-events-none z-[1]" />
        <ProductImage src={product.images?.[0]} alt={product.name} />

        <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="inline-flex items-center gap-1 bg-amber text-graphite text-[11px] font-bold px-2.5 py-1 rounded-full w-fit shadow-[0_4px_12px_-2px_rgba(0,0,0,0.35)]">
                <Zap size={10} strokeWidth={3} fill="currentColor" />
                {discountPct}% OFF
              </span>
            )}
            {isLowStock && (
              <span className="bg-graphite/85 backdrop-blur-md text-amber text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ring-1 ring-amber/30 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.35)]">
                Only {product.stock} left
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-graphite/85 backdrop-blur-md text-text-muted text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ring-1 ring-border-line shadow-[0_4px_12px_-2px_rgba(0,0,0,0.35)]">
                Out of stock
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`relative z-10 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 shrink-0 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.35)] ${
              isWishlisted
                ? 'bg-amber/25 text-amber ring-1 ring-amber/40'
                : 'bg-graphite/70 text-white/80 hover:text-amber ring-1 ring-white/10'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isWishlisted}
          >
            <Heart size={15} strokeWidth={2} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {justAdded && (
          <div className="absolute inset-0 z-[3] bg-teal/15 pointer-events-none animate-[flashFade_0.6s_ease-out]" />
        )}

        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-graphite/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3 pointer-events-none">
          <span className="text-graphite text-xs font-semibold bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            Quick view
          </span>
        </div>
      </div>

      <div className="relative p-5 bg-surface/40 backdrop-blur-xl border-t border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40 scale-110">
          <ProductImage src={product.images?.[0]} alt="" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface/30 via-surface/70 to-surface/90" />

        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-teal text-[10.5px] font-semibold uppercase tracking-wider">
            <span className="w-1 h-1 rounded-full bg-teal" />
            {product.category}
          </span>
          {reviewCount > 0 && (
            <span className="flex items-center gap-1.5 text-text-muted text-xs shrink-0">
              <StarRating value={rating} size={11} />
              <span className="text-text-muted/70">({reviewCount})</span>
            </span>
          )}
        </div>

        <h2 className="text-text-primary font-semibold text-[15px] mb-3 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-white transition-colors">
          {product.name}
        </h2>

        <div className="flex items-baseline gap-2 mb-1 flex-wrap min-w-0">
          <p className="font-display text-2xl text-text-primary font-bold tracking-tight truncate">
            ₹{(hasDiscount ? product.discountPrice : product.price).toLocaleString('en-IN')}
          </p>
          {hasDiscount && (
            <p className="text-text-muted text-sm line-through truncate">
              ₹{product.price.toLocaleString('en-IN')}
            </p>
          )}
        </div>
        {hasDiscount ? (
          <p className="text-amber text-[11px] font-medium mb-4">
            You save ₹{(product.price - product.discountPrice).toLocaleString('en-IN')}
          </p>
        ) : (
          <div className="mb-4" />
        )}

        <div
          onClick={(e) => e.stopPropagation()}
          className="pt-3.5 border-t border-white/[0.08]"
        >
          {cartError && (
            <p className="text-amber text-xs mb-2">{cartError}</p>
          )}
          {isOutOfStock ? (
            <button
              disabled
              className="w-full bg-surface-hover text-text-muted text-sm font-semibold py-2.5 rounded-xl cursor-not-allowed"
            >
              Out of Stock
            </button>
          ) : (
            <div className="flex gap-2">
              <AddToCartButton
                isAdding={isAdding}
                justAdded={justAdded}
                onClick={() => onAddToCart(product.id)}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBuyNow(product.id);
                }}
                disabled={isAdding}
                className="flex-1 bg-teal hover:bg-teal-dim text-graphite text-sm font-bold py-2.5 rounded-xl transition-all duration-200 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 shadow-[0_6px_16px_-4px_rgba(20,184,166,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal/0 via-teal to-teal/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <style>{`
        @keyframes addBounce { 0% { transform: scale(1); } 35% { transform: scale(1.06); } 100% { transform: scale(1); } }
        @keyframes checkPop { 0% { transform: scale(0.4) rotate(-10deg); opacity: 0; } 60% { transform: scale(1.15) rotate(4deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes flashFade { 0% { opacity: 0.9; } 100% { opacity: 0; } }
      `}</style>
    </div>
  );
}

function Home({ searchQuery = '' }) {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { addItem } = useCart();
  const { user } = useAuth();
  const [cartErrors, setCartErrors] = useState({});
  const [pendingAddIds, setPendingAddIds] = useState(new Set());

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [wishlist, setWishlist] = useState(new Set());
  const [addedId, setAddedId] = useState(null);

  const filterRef = useRef(null);
  const addToCartTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data.products);
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!showFilters) return;
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowFilters(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showFilters]);

  useEffect(() => {
    return () => {
      if (addToCartTimeoutRef.current) clearTimeout(addToCartTimeoutRef.current);
    };
  }, []);

  const categories = useMemo(
    () => ['all', ...new Set(products.map((p) => p.category))],
    [products]
  );
  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))],
    [products]
  );

  const activeFilterCount =
    (priceRange.min ? 1 : 0) + (priceRange.max ? 1 : 0) + selectedBrands.length + (minRating > 0 ? 1 : 0);

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const clearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSelectedBrands([]);
    setMinRating(0);
    setSortBy('newest');
  };

  const toggleWishlist = (id) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddToCart = async (id) => {
    if (!user) {
      navigate('/login', { state: { from: '/' } });
      return;
    }

    if (pendingAddIds.has(id)) return;

    setCartErrors((prev) => ({ ...prev, [id]: null }));
    setPendingAddIds((prev) => new Set(prev).add(id));

    try {
      await addItem(id, 1);

      if (addToCartTimeoutRef.current) clearTimeout(addToCartTimeoutRef.current);
      setAddedId(id);
      addToCartTimeoutRef.current = setTimeout(() => {
        setAddedId((curr) => (curr === id ? null : curr));
      }, 1400);
    } catch (err) {
      setCartErrors((prev) => ({
        ...prev,
        [id]: err.response?.data?.message || 'Could not add to cart',
      }));
    } finally {
      setPendingAddIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBuyNow = async (id) => {
    if (!user) {
      navigate('/login', { state: { from: '/' } });
      return;
    }

    if (pendingAddIds.has(id)) return;

    setCartErrors((prev) => ({ ...prev, [id]: null }));
    setPendingAddIds((prev) => new Set(prev).add(id));

    try {
      await addItem(id, 1);
      navigate('/checkout');
    } catch (err) {
      setCartErrors((prev) => ({
        ...prev,
        [id]: err.response?.data?.message || 'Could not proceed to checkout',
      }));
    } finally {
      setPendingAddIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products
      .filter((p) => category === 'all' || p.category === category)
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((p) => !priceRange.min || p.price >= Number(priceRange.min))
      .filter((p) => !priceRange.max || p.price <= Number(priceRange.max))
      .filter((p) => selectedBrands.length === 0 || selectedBrands.includes(p.brand))
      .filter((p) => (p.ratingsAverage || 0) >= minRating);

    if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => (b.ratingsAverage || 0) - (a.ratingsAverage || 0));
    } else {
      result = [...result].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return result;
  }, [products, category, searchQuery, priceRange, selectedBrands, minRating, sortBy]);

  return (
    <div className="min-h-screen bg-graphite">
      <HeroCarousel />

      <section className="px-6 py-12">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
          <h2 className="font-display text-2xl font-bold text-text-primary tracking-tight">
            {category === 'all' ? 'All products' : category}
            <span className="text-text-muted text-sm font-normal ml-2">({filteredProducts.length})</span>
          </h2>

          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                className={`px-4 py-1.5 rounded-md text-sm capitalize transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
                  category === cat
                    ? 'bg-teal text-graphite border-teal font-semibold shadow-[0_2px_12px_-2px_var(--tw-shadow-color)] shadow-teal/40'
                    : 'bg-surface text-text-muted border-border-line hover:border-teal hover:text-teal hover:-translate-y-px'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-teal/10 border-teal text-teal'
                  : 'bg-surface border-border-line text-text-muted hover:border-teal hover:text-teal'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-teal text-graphite text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilters && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-surface border border-border-line rounded-2xl shadow-2xl shadow-black/40 p-5 z-30 space-y-5 origin-top-left animate-[panelIn_0.18s_ease-out]">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-text-primary">Filters</h3>
                  <button onClick={() => setShowFilters(false)} className="text-text-muted hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-2">Price Range</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
                    />
                    <span className="text-text-muted text-sm">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-2">Minimum Rating</p>
                  <div className="flex gap-2">
                    {[0, 3, 4, 4.5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(r)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
                          minRating === r
                            ? 'bg-teal text-graphite border-teal'
                            : 'bg-graphite text-text-muted border-border-line hover:border-teal hover:text-teal'
                        }`}
                      >
                        {r === 0 ? 'Any' : (
                          <>
                            {r}
                            <Star size={10} strokeWidth={0} fill="currentColor" />+
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {brands.length > 0 && (
                  <div>
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-2">Brand</p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {brands.map((brand) => (
                        <label key={brand} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer hover:text-teal transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={() => toggleBrand(brand)}
                            className="w-4 h-4 rounded accent-teal cursor-pointer"
                          />
                          {brand}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-border-line">
                  <button
                    onClick={clearFilters}
                    className="flex-1 text-text-muted hover:text-text-primary text-sm font-medium py-2 rounded-lg border border-border-line transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 bg-teal hover:bg-teal-dim text-graphite text-sm font-semibold py-2 rounded-lg transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-surface border border-border-line text-text-primary text-sm rounded-lg pl-4 pr-9 py-2 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 cursor-pointer transition-all"
            >
              <option value="newest">Newest first</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest rated</option>
            </select>
            <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-surface ring-1 ring-border-line rounded-2xl overflow-hidden">
                <div className="h-56 bg-surface-hover relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                </div>
                <div className="p-5 space-y-2.5">
                  <div className="h-3 bg-surface-hover rounded w-1/3 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  </div>
                  <div className="h-4 bg-surface-hover rounded w-full relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  </div>
                  <div className="h-4 bg-surface-hover rounded w-2/3 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  </div>
                  <div className="h-6 bg-surface-hover rounded w-1/2 mt-1 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-amber">{error}</p>}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-24 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-surface border border-border-line flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-text-muted" strokeWidth={1.5} />
            </div>
            <p className="text-text-primary font-display text-xl mb-1.5">Nothing here yet</p>
            <p className="text-text-muted text-sm">Check back soon, or try adjusting your filters.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlist.has(product.id)}
              justAdded={addedId === product.id}
              isAdding={pendingAddIds.has(product.id)}
              cartError={cartErrors[product.id]}
              onNavigate={() => navigate(`/products/${product.id}`)}
              onToggleWishlist={toggleWishlist}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          ))}
        </div>
      </section>

      <style>{`
        @keyframes panelIn { from { opacity: 0; transform: scale(0.97) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}

export default Home;