import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as orderApi from '../api/orderApi';
import { CheckCircle2, Loader2, MapPin, Copy, Check, Package, Truck, Home as HomeIcon, Sparkles } from 'lucide-react';
import { playSuccessSound } from '../utils/playSuccessSound';

const TIMELINE_STEPS = [
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: HomeIcon },
];

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  const colors = ['#14b8a6', '#f59e0b', '#ffffff', '#5eead4'];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const duration = 1.6 + Math.random() * 1.2;
        const size = 5 + Math.random() * 5;
        const color = colors[i % colors.length];
        const rotateStart = Math.random() * 360;
        return (
          <span
            key={i}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 1.6,
              backgroundColor: color,
              animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
              transform: `rotate(${rotateStart}deg)`,
              opacity: 0,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(70vh) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
  const fetchOrder = async () => {
    try {
      const data = await orderApi.getOrderById(id);
      setOrder(data.order);

      const celebrationKey = `order-celebrated-${id}`;
      const alreadyCelebrated = sessionStorage.getItem(celebrationKey);

      if (data.order?.paymentStatus === 'paid' && !alreadyCelebrated) {
        playSuccessSound();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2800);
        sessionStorage.setItem(celebrationKey, 'true');
      }
    } catch (err) {
      setError('Order not found');
    } finally {
      setLoading(false);
    }
  };
  fetchOrder();
}, [id]);

  const handleCopyId = () => {
    if (!order) return;
    navigator.clipboard.writeText(String(order.id).padStart(8, '0'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-graphite flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-graphite flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-text-primary font-display text-xl">{error || 'Order not found'}</p>
        <Link to="/" className="text-teal text-sm hover:underline">← Back to home</Link>
      </div>
    );
  }

  const items = order.OrderItems || [];
  const currentStepIndex = Math.max(0, TIMELINE_STEPS.findIndex((s) => s.key === order.orderStatus));
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <div className="min-h-screen bg-graphite px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-72 bg-teal/[0.1] rounded-full blur-3xl pointer-events-none" />
      {showConfetti && <Confetti />}

      <div className="max-w-2xl mx-auto relative">
        <div className="text-center mb-8 animate-[fadeSlideUp_0.5s_ease-out]">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-teal/20 animate-[pulseRing_1.8s_ease-out_infinite]" />
            <div className="absolute inset-0 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center">
              <CheckCircle2
                className="w-10 h-10 text-teal animate-[checkPop_0.5s_cubic-bezier(0.22,1.5,0.36,1)_0.15s_both]"
                strokeWidth={1.75}
              />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber animate-[sparkleTwinkle_1.4s_ease-in-out_infinite]" strokeWidth={1.5} />
          </div>

          <h1 className="font-display text-3xl font-bold text-text-primary mb-2 tracking-tight">
            {isCancelled ? 'Order cancelled' : 'Order placed!'}
          </h1>
          <p className="text-text-muted text-sm mb-3">
            {isCancelled ? 'This order has been cancelled.' : 'Confirmation sent to your account'}
          </p>

          <button
            onClick={handleCopyId}
            className="inline-flex items-center gap-2 bg-surface border border-border-line hover:border-teal/50 rounded-full px-4 py-1.5 text-xs font-mono text-text-muted hover:text-teal transition-all duration-200 active:scale-95"
          >
            Order #{String(order.id).padStart(8, '0')}
            {copied ? (
              <Check size={13} className="text-teal" strokeWidth={2.5} />
            ) : (
              <Copy size={13} strokeWidth={2} />
            )}
          </button>
        </div>

        {!isCancelled && (
          <div className="bg-surface border border-border-line rounded-2xl p-6 mb-5 animate-[fadeSlideUp_0.5s_ease-out_0.1s_both]">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-[18px] left-[18px] right-[18px] h-[2px] bg-border-line -z-0" />
              <div
                className="absolute top-[18px] left-[18px] h-[2px] bg-teal transition-all duration-700 ease-out -z-0"
                style={{
                  width: currentStepIndex === 0 ? '0%' : currentStepIndex === 1 ? 'calc(50% - 18px)' : 'calc(100% - 36px)',
                }}
              />
              {TIMELINE_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isDone = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isDone
                          ? 'bg-teal border-teal text-graphite'
                          : 'bg-graphite border-border-line text-text-muted'
                      } ${isCurrent ? 'animate-[currentStepPulse_1.6s_ease-in-out_infinite]' : ''}`}
                    >
                      <StepIcon size={15} strokeWidth={2} />
                    </div>
                    <span className={`text-[11px] font-medium ${isDone ? 'text-text-primary' : 'text-text-muted'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-surface border border-border-line rounded-2xl p-5 mb-5 animate-[fadeSlideUp_0.5s_ease-out_0.2s_both]">
          <h2 className="font-display text-sm font-bold text-text-primary mb-4 uppercase tracking-wide">
            Items ({items.length})
          </h2>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 animate-[fadeSlideUp_0.4s_ease-out_both]"
                style={{ animationDelay: `${0.25 + i * 0.06}s` }}
              >
                <div className="w-12 h-12 bg-surface-hover rounded-lg overflow-hidden shrink-0 ring-1 ring-border-line">
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-medium truncate">{item.name}</p>
                  <p className="text-text-muted text-xs">Qty: {item.quantity}</p>
                </div>
                <p className="text-text-primary text-sm font-semibold">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border-line space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Subtotal</span>
              <span className="text-text-primary">₹{Number(order.itemsPrice).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Shipping</span>
              <span className="text-text-primary">
                {Number(order.shippingPrice) === 0 ? 'Free' : `₹${order.shippingPrice}`}
              </span>
            </div>
            <div className="flex justify-between font-semibold mt-1 pt-1">
              <span className="text-text-primary">Total Paid</span>
              <span className="font-display text-lg text-teal">₹{Number(order.totalPrice).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border-line rounded-2xl p-5 mb-8 animate-[fadeSlideUp_0.5s_ease-out_0.3s_both]">
          <h2 className="font-display text-sm font-bold text-text-primary mb-3 uppercase tracking-wide flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal" />
            Delivery Address
          </h2>
          <p className="text-text-primary text-sm font-medium">{order.shippingFullName}</p>
          <p className="text-text-muted text-sm mt-0.5">
            {order.shippingStreet}, {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
          </p>
          <p className="text-text-muted text-sm">{order.shippingPhone}</p>
        </div>

        <div className="flex gap-3 animate-[fadeSlideUp_0.5s_ease-out_0.4s_both]">
          <Link
            to="/orders"
            className="flex-1 text-center bg-surface-hover hover:bg-surface border border-border-line text-text-primary text-sm font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
          >
            View All Orders
          </Link>
          <Link
            to="/"
            className="flex-1 text-center bg-teal hover:bg-teal-dim text-graphite text-sm font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-[0_4px_14px_-2px_rgba(20,184,166,0.4)]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.9); opacity: 0.6; }
          70% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes checkPop {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sparkleTwinkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.3) rotate(15deg); opacity: 0.6; }
        }
        @keyframes currentStepPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(20, 184, 166, 0); }
        }
      `}</style>
    </div>
  );
}

export default OrderSuccess;