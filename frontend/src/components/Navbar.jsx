import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Search, Bell, Plus, ChevronDown, LogOut, User, ShieldCheck, ShoppingCart, Package, MapPin } from 'lucide-react';

function Navbar({ searchQuery, onSearchChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { itemCount: cartCount } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [cartBump, setCartBump] = useState(false);
  const menuRef = useRef(null);
  const prevCartCountRef = useRef(cartCount);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/contact', label: 'Contact Us' },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (cartCount !== prevCartCountRef.current) {
      setCartBump(true);
      const timer = setTimeout(() => setCartBump(false), 400);
      prevCartCountRef.current = cartCount;
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
    }
  };

  const displayCartCount = cartCount > 99 ? '99+' : cartCount;

  return (
    <nav className="bg-graphite/80 backdrop-blur-md border-b border-border-line px-6 py-3 sticky top-0 z-50 flex items-center justify-between gap-4">
      <Link to="/" className="flex items-center gap-2 group shrink-0">
        <div className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/30 flex items-center justify-center text-teal font-mono text-sm font-bold group-hover:bg-teal/20 group-hover:border-teal/50 transition-all">
          {'<>'}
        </div>
        <span className="font-display text-lg font-bold text-text-primary hidden sm:inline tracking-tight">Electronix</span>
      </Link>

      <div className="flex-1 max-w-md mx-2">
        <div className="relative group">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none group-focus-within:text-teal transition-colors"
            strokeWidth={2}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-surface border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
          />
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-1 bg-surface border border-border-line rounded-full p-1 shrink-0">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-teal text-graphite shadow-[0_2px_10px_-2px_var(--tw-shadow-color)] shadow-teal/40'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          to="/cart"
          className={`relative w-9 h-9 rounded-full bg-surface border border-border-line flex items-center justify-center text-text-muted hover:text-teal hover:border-teal/50 transition-all duration-200 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
            cartBump ? 'animate-[cartBump_0.4s_ease-out] border-teal text-teal' : ''
          }`}
          aria-label={cartCount > 0 ? `Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}` : 'Cart'}
        >
          <ShoppingCart size={16} strokeWidth={2} className={cartBump ? 'animate-[cartShake_0.4s_ease-out]' : ''} />
          {cartCount > 0 && (
            <span
              className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-teal text-graphite text-[10px] font-bold flex items-center justify-center ring-2 ring-graphite ${
                cartBump ? 'animate-[badgePop_0.4s_ease-out]' : ''
              }`}
            >
              {displayCartCount}
            </span>
          )}
        </Link>

        <button
          className="relative w-9 h-9 rounded-full bg-surface border border-border-line flex items-center justify-center text-text-muted hover:text-teal hover:border-teal/50 transition-all duration-200 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={2} />
          <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-amber rounded-full ring-2 ring-graphite" />
        </button>

        {isAdmin && (
          <Link
            to="/manage-product"
            className="hidden sm:inline-flex items-center gap-1.5 bg-teal hover:bg-teal-dim text-graphite px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 whitespace-nowrap active:scale-95 shadow-[0_4px_14px_-2px_rgba(20,184,166,0.4)]"
          >
            <Plus size={15} strokeWidth={2.5} />
            Manage Product
          </Link>
        )}

        {!user && (
          <Link
            to="/login"
            className="border border-border-line hover:border-teal text-text-primary hover:text-teal px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 whitespace-nowrap hover:bg-teal/5"
          >
            Login
          </Link>
        )}

        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
                menuOpen
                  ? 'bg-surface border-teal/50'
                  : 'bg-transparent border-transparent hover:bg-surface hover:border-border-line'
              }`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="relative w-8 h-8 rounded-full bg-gradient-to-br from-teal to-teal-dim flex items-center justify-center text-graphite font-bold text-sm shrink-0 shadow-[0_2px_8px_-1px_rgba(20,184,166,0.5)]">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden md:flex flex-col items-start leading-none">
                <span className="flex items-center gap-1.5">
                  <span className="text-text-primary text-sm font-medium">{user.name.split(' ')[0]}</span>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-0.5 bg-amber/15 text-amber text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ring-1 ring-amber/30">
                      <ShieldCheck size={9} strokeWidth={2.5} />
                      Admin
                    </span>
                  )}
                </span>
              </span>
              <ChevronDown
                size={14}
                className={`hidden md:block text-text-muted transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-surface border border-border-line rounded-2xl shadow-2xl shadow-black/40 py-2 z-50 origin-top-right animate-[menuIn_0.15s_ease-out]">
                <div className="px-4 py-2.5 border-b border-border-line/70 mb-1">
                  <div className="flex items-center gap-2">
                    <p className="text-text-primary text-sm font-semibold truncate">{user.name}</p>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-0.5 bg-amber/15 text-amber text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ring-1 ring-amber/30 shrink-0">
                        <ShieldCheck size={9} strokeWidth={2.5} />
                        Admin
                      </span>
                    )}
                  </div>
                  {user.email && (
                    <p className="text-text-muted text-xs truncate mt-0.5">{user.email}</p>
                  )}
                </div>

                <Link
                  to="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <ShoppingCart size={15} className="text-text-muted" strokeWidth={1.75} />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-auto bg-teal/15 text-teal text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {displayCartCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/orders"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <Package size={15} className="text-text-muted" strokeWidth={1.75} />
                  Your Orders
                </Link>

                <Link
                  to="/addresses"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <MapPin size={15} className="text-text-muted" strokeWidth={1.75} />
                  Addresses
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 mt-1 border-t border-border-line/70 text-sm text-amber hover:bg-amber/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <LogOut size={15} strokeWidth={1.75} />
                  {loggingOut ? 'Logging out...' : 'Log out'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes menuIn { from { opacity: 0; transform: scale(0.96) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes cartBump { 0% { transform: scale(1); } 30% { transform: scale(1.15); } 60% { transform: scale(0.95); } 100% { transform: scale(1); } }
        @keyframes cartShake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-12deg); } 75% { transform: rotate(12deg); } }
        @keyframes badgePop { 0% { transform: scale(0.5); opacity: 0.5; } 50% { transform: scale(1.4); } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </nav>
  );
}

export default Navbar;