import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Eye, EyeOff, X, Loader2, ShieldCheck, Truck, Tag, Headphones,
  Star, BadgeCheck,
} from 'lucide-react';

const BENEFITS = [
  { Icon: Tag, title: 'Member pricing', desc: 'Unlock prices not shown to guests on select electronics.' },
  { Icon: Truck, title: 'Order tracking that works', desc: 'Real-time status from warehouse to your door, no guesswork.' },
  { Icon: BadgeCheck, title: 'Verified specs only', desc: 'Every listing checked against manufacturer data sheets.' },
  { Icon: Headphones, title: 'Priority support', desc: 'Skip the queue when something needs sorting out.' },
];

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-graphite relative overflow-hidden">
      {/* One continuous ambient field across the whole viewport — left and
          right read as a single lit surface, not two stitched panels. */}
      <div className="absolute -top-32 left-[8%] w-[560px] h-[560px] bg-teal/[0.09] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-[10%] w-[480px] h-[480px] bg-teal/[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] bg-teal/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* 12-column grid: left content carries 5 units, the form carries 7 —
          the form is the larger, dominant element, not an equal half. */}
      <div className="relative max-w-[1400px] mx-auto min-h-screen grid grid-cols-1 lg:grid-cols-12 items-center">

        {/* Left — brand storytelling, vertically centered so its midpoint
            lines up with the form's midpoint. */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-center px-16 py-24">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-14">
            <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/30 flex items-center justify-center text-teal font-mono text-sm font-bold shadow-[0_0_20px_-4px_var(--tw-shadow-color)] shadow-teal/30">
              {'<>'}
            </div>
            <span className="font-display text-lg font-bold text-text-primary tracking-tight">Electronix</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-teal text-[11px] font-mono uppercase tracking-wider mb-4">
            <span className="w-1 h-1 rounded-full bg-teal" />
            Welcome back
          </span>
          <h1 className="font-display text-3xl font-bold text-text-primary leading-tight tracking-tight max-w-sm">
            Right where you left off.
          </h1>
          <p className="text-text-muted text-sm mt-3 leading-relaxed max-w-sm">
            Log in to pick up your cart, track active orders, and keep your member pricing.
          </p>

          <div className="mt-12 space-y-6">
            {BENEFITS.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-surface/60 border border-border-line/70 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-teal" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-text-primary text-sm font-semibold">{title}</p>
                  <p className="text-text-muted text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-surface/60 border border-border-line/70 rounded-2xl p-5 max-w-sm">
            <div className="flex items-center gap-1 mb-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={13} className="text-amber" fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <p className="text-text-primary text-sm leading-relaxed">
              "Switched from two other electronics sites just for the verified spec sheets. Never going back."
            </p>
            <p className="text-text-muted text-xs mt-2.5">Priya M. — verified buyer</p>
          </div>
        </div>

        {/* Right — the form, given more horizontal room (7 of 12 columns)
            and a wider max-width so it reads as the page's primary element. */}
        <div className="lg:col-span-7 flex items-center justify-center px-6 sm:px-12 lg:px-20 py-16 lg:py-24">
          <div className="relative w-full max-w-md">

            <div className="text-center mb-8 lg:hidden">
              <div className="w-12 h-12 rounded-2xl bg-teal/10 border border-teal/30 flex items-center justify-center text-teal font-mono text-base font-bold mx-auto mb-4 shadow-[0_0_24px_-4px_var(--tw-shadow-color)] shadow-teal/30">
                {'<>'}
              </div>
              <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">Welcome back</h1>
              <p className="text-text-muted text-sm mt-1.5 leading-relaxed">
                Log in to your Electronix account to continue.
              </p>
            </div>

            <div className="hidden lg:block mb-8">
              <h2 className="font-display text-[28px] font-bold text-text-primary tracking-tight">Welcome back</h2>
              <p className="text-text-muted text-sm mt-2">Log in to your Electronix account.</p>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 text-amber text-sm bg-amber/10 border border-amber/30 rounded-xl px-4 py-3 mb-5 animate-[fadeIn_0.2s_ease-out]"
              >
                <X size={15} className="shrink-0 mt-0.5" strokeWidth={2.5} />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="bg-surface border border-border-line rounded-2xl p-8 space-y-5 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.5)]"
            >
              <div>
                <label htmlFor="email" className="block text-text-muted text-xs font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-text-muted text-xs font-medium">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-teal text-xs font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 rounded"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-11 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-teal transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal hover:bg-teal-dim text-graphite text-sm font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(20,184,166,0.4)] disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log In'
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 mt-6 text-text-muted/70 text-[11px]">
              <ShieldCheck size={13} className="text-teal/70" strokeWidth={1.75} />
              Your data is encrypted and never shared
            </div>

            <p className="text-center text-text-muted text-sm mt-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-teal hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default Login;