import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Eye, EyeOff, Check, X, Loader2, ShieldCheck, Truck, Tag, Headphones,
  Star, BadgeCheck,
} from 'lucide-react';

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak' };
  if (score <= 2) return { score: 2, label: 'Fair' };
  if (score <= 3) return { score: 3, label: 'Good' };
  return { score: 4, label: 'Strong' };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BENEFITS = [
  { Icon: Tag, title: 'Member pricing', desc: 'Unlock prices not shown to guests on select electronics.' },
  { Icon: Truck, title: 'Order tracking that works', desc: 'Real-time status from warehouse to your door, no guesswork.' },
  { Icon: BadgeCheck, title: 'Verified specs only', desc: 'Every listing checked against manufacturer data sheets.' },
  { Icon: Headphones, title: 'Priority support', desc: 'Skip the queue when something needs sorting out.' },
];

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const emailValid = email.length === 0 || EMAIL_RE.test(email);
  const passwordValid = password.length === 0 || password.length >= 8;
  const nameValid = name.trim().length === 0 || name.trim().length >= 2;

  const canSubmit =
    name.trim().length >= 2 &&
    EMAIL_RE.test(email) &&
    password.length >= 8 &&
    !loading;

  const markTouched = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, password: true });

    if (name.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const strengthBarColor = (i) => {
    if (i >= strength.score) return 'bg-border-line';
    if (strength.score <= 1) return 'bg-red-400';
    if (strength.score === 2) return 'bg-amber';
    if (strength.score === 3) return 'bg-teal/70';
    return 'bg-teal';
  };

  const strengthLabelColor =
    strength.score <= 1 ? 'text-red-400' : strength.score === 2 ? 'text-amber' : 'text-teal';

  return (
    <div className="min-h-screen bg-graphite relative overflow-hidden">
      {/* One continuous ambient field across the whole viewport instead of
          two separately-lit panels with a hard seam between them — this is
          what makes the page read as a single surface rather than two
          stitched-together halves. */}
      <div className="absolute -top-32 left-[8%] w-[560px] h-[560px] bg-teal/[0.09] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-[10%] w-[480px] h-[480px] bg-teal/[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] bg-teal/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* 12-column conceptual grid: left content carries 5 units of visual
          weight, the form carries 7 — proportioned so the form is the
          larger, dominant element rather than an equal-weight half. */}
      <div className="relative max-w-[1400px] mx-auto min-h-screen grid grid-cols-1 lg:grid-cols-12 items-center">

        {/* Left — brand storytelling, vertically centered so its midpoint
            lines up with the form's midpoint rather than spreading to the
            viewport edges (no justify-between, no hard divider). */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-center px-16 py-24">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-14">
            <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/30 flex items-center justify-center text-teal font-mono text-sm font-bold shadow-[0_0_20px_-4px_var(--tw-shadow-color)] shadow-teal/30">
              {'<>'}
            </div>
            <span className="font-display text-lg font-bold text-text-primary tracking-tight">Electronix</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-teal text-[11px] font-mono uppercase tracking-wider mb-4">
            <span className="w-1 h-1 rounded-full bg-teal" />
            Member benefits
          </span>
          <h1 className="font-display text-3xl font-bold text-text-primary leading-tight tracking-tight max-w-sm">
            Real specs. Real pricing. Zero guesswork.
          </h1>
          <p className="text-text-muted text-sm mt-3 leading-relaxed max-w-sm">
            Create an account to unlock everything Electronix members get by default.
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
            and a wider max-width so it reads as the page's primary
            element rather than a small card. */}
        <div className="lg:col-span-7 flex items-center justify-center px-6 sm:px-12 lg:px-20 py-16 lg:py-24">
          <div className="relative w-full max-w-md">

            <div className="text-center mb-8 lg:hidden">
              <div className="w-12 h-12 rounded-2xl bg-teal/10 border border-teal/30 flex items-center justify-center text-teal font-mono text-base font-bold mx-auto mb-4 shadow-[0_0_24px_-4px_var(--tw-shadow-color)] shadow-teal/30">
                {'<>'}
              </div>
              <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">Create your account</h1>
              <p className="text-text-muted text-sm mt-1.5 leading-relaxed">
                Join Electronix for verified specs, member pricing, and order tracking that actually works.
              </p>
            </div>

            <div className="hidden lg:block mb-8">
              <h2 className="font-display text-[28px] font-bold text-text-primary tracking-tight">Create your account</h2>
              <p className="text-text-muted text-sm mt-2">Takes less than a minute.</p>
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
                <label htmlFor="name" className="block text-text-muted text-xs font-medium mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => markTouched('name')}
                  required
                  placeholder="Full Name"
                  autoComplete="name"
                  className={`w-full px-4 py-3 rounded-lg bg-graphite border text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 transition-all ${
                    touched.name && !nameValid
                      ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400/20'
                      : 'border-border-line focus:border-teal focus:ring-teal/20'
                  }`}
                />
                {touched.name && !nameValid && (
                  <p className="text-red-400 text-xs mt-1.5">Please enter your full name</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-text-muted text-xs font-medium mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => markTouched('email')}
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`w-full px-4 py-3 rounded-lg bg-graphite border text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 transition-all ${
                      touched.email && !emailValid
                        ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400/20'
                        : 'border-border-line focus:border-teal focus:ring-teal/20'
                    }`}
                  />
                  {touched.email && email.length > 0 && emailValid && (
                    <Check size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-teal" strokeWidth={2.5} />
                  )}
                </div>
                {touched.email && !emailValid && (
                  <p className="text-red-400 text-xs mt-1.5">Please enter a valid email address</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-text-muted text-xs font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => markTouched('password')}
                    required
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 pr-11 rounded-lg bg-graphite border text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 transition-all ${
                      touched.password && !passwordValid
                        ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400/20'
                        : 'border-border-line focus:border-teal focus:ring-teal/20'
                    }`}
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

                {password.length > 0 && (
                  <div className="mt-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${strengthBarColor(i)}`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] mt-1.5 font-medium ${strengthLabelColor}`}>
                      {strength.label} password
                      {strength.score < 3 && (
                        <span className="text-text-muted font-normal"> — try adding numbers or symbols</span>
                      )}
                    </p>
                  </div>
                )}
                {touched.password && !passwordValid && (
                  <p className="text-red-400 text-xs mt-1.5">Password must be at least 8 characters</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-teal hover:bg-teal-dim text-graphite text-sm font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(20,184,166,0.4)] disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>

              <p className="text-text-muted text-[11px] text-center leading-relaxed pt-1">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>

            <div className="flex items-center justify-center gap-1.5 mt-6 text-text-muted/70 text-[11px]">
              <ShieldCheck size={13} className="text-teal/70" strokeWidth={1.75} />
              Your data is encrypted and never shared
            </div>

            <p className="text-center text-text-muted text-sm mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-teal hover:underline font-medium">
                Log in
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

export default Register;