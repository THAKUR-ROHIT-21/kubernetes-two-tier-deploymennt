import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, SearchX } from 'lucide-react';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-graphite flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-teal/[0.08] rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full text-center">
        <div className="relative mb-6">
          <p className="font-display text-[120px] font-bold text-surface leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-teal/10 border border-teal/30 flex items-center justify-center animate-[floatIcon_3s_ease-in-out_infinite]">
              <SearchX className="w-8 h-8 text-teal" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
          Page not found
        </h1>
        <p className="text-text-muted text-sm mb-8 leading-relaxed">
          The page you're looking for doesn't exist, may have been moved, or the link is incorrect.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 bg-surface-hover hover:bg-surface border border-border-line hover:border-teal/50 text-text-primary text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            Go Back
          </button>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 bg-teal hover:bg-teal-dim text-graphite text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-[0_4px_14px_-2px_rgba(20,184,166,0.4)]"
          >
            <Home size={16} strokeWidth={2} />
            Back to Home
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

export default NotFound;