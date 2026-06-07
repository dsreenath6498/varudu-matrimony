import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { PlaySquare, Users, ArrowLeft, TrendingUp, Gift } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

interface RosePack {
  roses: number;
  price: string;
  label: string;
  badge?: string;
  style: 'basic' | 'featured' | 'premium';
}

const rosePacks: RosePack[] = [
  {
    roses: 1,
    price: '₹100',
    label: 'A Single Rose',
    style: 'basic',
  },
  {
    roses: 5,
    price: '₹350',
    label: 'The Bouquet',
    badge: 'Save 30%',
    style: 'featured',
  },
  {
    roses: 20,
    price: '₹1,150',
    label: 'Grand Gesture',
    badge: 'Most Popular',
    style: 'premium',
  },
];

export default function RoseBoutique() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [canClaimFree, setCanClaimFree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiltStyle, setTiltStyle] = useState<Record<number, React.CSSProperties>>({});
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchData = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    try {
      const res = await api.get('/roses/balance', { params: { userId: user.id } });
      setBalance(res.data.roses_balance);
      setReferralCode(res.data.referral_code);
      setCanClaimFree(res.data.can_claim_free);
      const histRes = await api.get('/roses/history', { params: { userId: user.id } });
      setTransactions(histRes.data.transactions);
      window.dispatchEvent(new Event('rose_balance_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuy = async (amount: number) => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user')!);
    try {
      const res = await api.post('/roses/buy-order', { userId: user.id, amount });
      const { orderId, amount: amountPaise, keyId, mock } = res.data;
      if (mock) {
        await api.post('/roses/buy-verify', { userId: user.id, amount, mock: true });
        alert('Mock Payment Successful! Roses added.');
        fetchData();
        setLoading(false);
        return;
      }
      const resLoad = await loadRazorpay();
      if (!resLoad) {
        alert('Razorpay SDK failed to load.');
        setLoading(false);
        return;
      }
      const options = {
        key: keyId,
        amount: amountPaise,
        currency: 'INR',
        name: 'Varudu Matrimony',
        description: `Purchase ${amount} Rose(s)`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            await api.post('/roses/buy-verify', {
              userId: user.id, amount,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            alert('Payment Successful! Roses added to your account.');
            fetchData();
          } catch (err: any) {
            alert(err.response?.data?.error || 'Verification Failed');
          }
        },
        prefill: { name: user.name, contact: user.phone_number || '9999999999' },
        theme: { color: '#E11D48' },
      };
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (endpoint: string, data = {}) => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user')!);
    try {
      await api.post(`/roses/${endpoint}`, { userId: user.id, ...data });
      alert('Success! Roses added to your account.');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    setTiltStyle(prev => ({
      ...prev,
      [index]: { transform: `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) scale(1.02)` },
    }));
  };

  const handleMouseLeave = (index: number) => {
    setTiltStyle(prev => ({
      ...prev,
      [index]: { transform: 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)', transition: 'transform 0.5s ease' },
    }));
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div
      className="min-h-screen flex flex-col pb-24 md:pb-0 md:ml-64 transition-all"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(212,175,55,0.7)',
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            background: 'linear-gradient(135deg, #FFD700, #D4AF37)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          The Rose Boutique
        </h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Balance Card */}
          <div
            className="relative rounded-3xl p-8 text-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(122,11,42,0.3), rgba(225,29,72,0.15), rgba(212,175,55,0.1))',
              border: '1px solid rgba(212,175,55,0.2)',
              boxShadow: '0 20px 60px rgba(225,29,72,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
              animation: 'fadeUp 0.6s ease both',
            }}
          >
            {/* Top shimmer */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)' }}
            />
            {/* Decorative orbs */}
            <div
              className="absolute w-40 h-40 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(225,29,72,0.2) 0%, transparent 70%)',
                top: '-20px', left: '-20px',
              }}
            />
            <div
              className="absolute w-32 h-32 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
                bottom: '-10px', right: '-10px',
              }}
            />

            <p
              className="text-xs font-bold uppercase tracking-[0.25em] mb-3 relative"
              style={{ color: 'rgba(212,175,55,0.6)' }}
            >
              Your Balance
            </p>
            <div className="flex items-center justify-center gap-3 relative">
              <span style={{ fontSize: '36px', animation: 'float 4s ease-in-out infinite' }}>🌹</span>
              <span
                className="font-bold relative"
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: '72px',
                  lineHeight: 1,
                  background: 'linear-gradient(135deg, #FFD700, #D4AF37, #FFF8F0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: 'none',
                }}
              >
                {balance}
              </span>
            </div>
            <p className="text-xs mt-3 relative" style={{ color: 'rgba(180,120,150,0.5)' }}>
              Roses never expire · Use them wisely
            </p>
          </div>

          {/* Buy Roses */}
          <div style={{ animation: 'fadeUp 0.6s 0.1s ease both' }}>
            <h2
              className="text-xl font-bold mb-4 flex items-center gap-2"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                color: 'var(--text-primary)',
              }}
            >
              <span>🌹</span>
              Buy Roses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rosePacks.map((pack, index) => (
                <div
                  key={index}
                  onMouseMove={(e) => handleMouseMove(e, index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  onClick={() => !loading && handleBuy(pack.roses)}
                  className="relative rounded-2xl p-6 cursor-pointer overflow-hidden transition-all duration-300"
                  style={{
                    ...(tiltStyle[index] || {}),
                    background: pack.style === 'premium'
                      ? 'linear-gradient(135deg, var(--bg-surface), var(--bg-raised), var(--bg-base))'
                      : pack.style === 'featured'
                      ? 'linear-gradient(135deg, rgba(212,138,133,0.15), rgba(168,134,85,0.08))'
                      : 'var(--bg-surface)',
                    border: pack.style === 'premium'
                      ? '1px solid rgba(168,134,85,0.35)'
                      : pack.style === 'featured'
                      ? '1px solid rgba(168,134,85,0.25)'
                      : '1px solid var(--glass-border)',
                    boxShadow: pack.style === 'premium'
                      ? '0 20px 50px rgba(168,134,85,0.15), inset 0 1px 0 rgba(168,134,85,0.1)'
                      : pack.style === 'featured'
                      ? '0 15px 40px rgba(212,138,133,0.15)'
                      : 'var(--shadow-card)',
                    animation: pack.style === 'featured' ? 'borderShimmer 2.5s ease-in-out infinite' : 'none',
                  }}
                >
                  {/* Top shimmer for all cards */}
                  <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{
                      background: pack.style === 'premium'
                        ? 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)'
                        : pack.style === 'featured'
                        ? 'linear-gradient(90deg, transparent, rgba(225,29,72,0.4), transparent)'
                        : 'transparent',
                    }}
                  />

                  {pack.badge && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        background: pack.style === 'premium'
                          ? 'linear-gradient(135deg, #D4AF37, #FFD700)'
                          : 'linear-gradient(135deg, #7A0B2A, #E11D48)',
                        color: pack.style === 'premium' ? '#0a0008' : 'white',
                        boxShadow: pack.style === 'premium'
                          ? '0 4px 12px rgba(212,175,55,0.4)'
                          : '0 4px 12px rgba(225,29,72,0.4)',
                      }}
                    >
                      {pack.badge}
                    </div>
                  )}

                  <div className="flex items-center justify-center mb-3">
                    {pack.roses === 1 ? (
                      <span style={{ fontSize: '32px', animation: 'float 5s ease-in-out infinite' }}>🌹</span>
                    ) : pack.roses === 5 ? (
                      <div className="flex -space-x-2">
                        {['🌹', '🌹', '🌹'].map((r, i) => (
                          <span key={i} style={{ fontSize: '24px', animation: `float ${4 + i * 0.5}s ease-in-out ${i * 0.3}s infinite` }}>{r}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex -space-x-2">
                        {['🌹', '🌹', '🌹', '🌹', '🌹'].map((r, i) => (
                          <span key={i} style={{ fontSize: '20px', animation: `float ${4 + i * 0.3}s ease-in-out ${i * 0.2}s infinite` }}>{r}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <h3
                    className="font-bold text-center mb-1"
                    style={{
                      color: pack.style === 'premium' ? '#D4AF37' : 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  >
                    {pack.label}
                  </h3>
                  <p
                    className="text-center font-bold"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: '28px',
                      color: pack.style === 'premium' ? '#FFD700' : '#FDA4AF',
                    }}
                  >
                    {pack.price}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Earn Free Roses */}
          <div style={{ animation: 'fadeUp 0.6s 0.2s ease both' }}>
            <h2
              className="text-xl font-bold mb-4"
              style={{ fontFamily: '"Cormorant Garamond", serif', color: 'var(--text-primary)' }}
            >
              Earn Free Roses
            </h2>
            <div className="space-y-3">

              {/* Daily Drop */}
              <button
                onClick={() => handleAction('claim-free')}
                disabled={!canClaimFree || loading}
                className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01] disabled:opacity-40"
                style={{
                  background: canClaimFree ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                  border: canClaimFree ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: canClaimFree ? '0 0 20px rgba(34,197,94,0.08)' : 'none',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.2)',
                    }}
                  >
                    <Gift className="w-5 h-5" style={{ color: '#4ADE80' }} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Daily Drop</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(180,120,150,0.5)' }}>
                      Claim 1 free rose every 48 hours
                    </p>
                  </div>
                </div>
                <span
                  className="font-bold text-sm px-3 py-1.5 rounded-xl"
                  style={{
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    color: '#4ADE80',
                  }}
                >
                  +1 🌹
                </span>
              </button>

              {/* Watch Ad */}
              <button
                onClick={() => {
                  alert('Playing Sample Ad...');
                  setTimeout(() => handleAction('watch-ad'), 2000);
                }}
                disabled={loading}
                className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01] disabled:opacity-40"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(59,130,246,0.1)',
                      border: '1px solid rgba(59,130,246,0.2)',
                    }}
                  >
                    <PlaySquare className="w-5 h-5" style={{ color: '#60A5FA' }} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Watch a Short Video</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(180,120,150,0.5)' }}>
                      Help support the app
                    </p>
                  </div>
                </div>
                <span
                  className="font-bold text-sm px-3 py-1.5 rounded-xl"
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    color: '#60A5FA',
                  }}
                >
                  +1 🌹
                </span>
              </button>

              {/* Refer a Friend */}
              <div
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(168,85,247,0.1)',
                      border: '1px solid rgba(168,85,247,0.2)',
                    }}
                  >
                    <Users className="w-5 h-5" style={{ color: '#C084FC' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Refer a Friend</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(180,120,150,0.5)' }}>
                      They get 1, you get 2!
                    </p>
                  </div>
                </div>
                <button
                  onClick={copyReferral}
                  className="font-mono font-bold text-xs px-3 py-2 rounded-xl transition-all duration-300 flex items-center gap-1.5"
                  style={{
                    background: copiedCode ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                    border: copiedCode ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    color: copiedCode ? '#4ADE80' : 'rgba(212,175,55,0.7)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {copiedCode ? '✓ Copied!' : (referralCode || '...')}
                </button>
              </div>
            </div>
          </div>

          {/* Rose Ledger */}
          <div style={{ animation: 'fadeUp 0.6s 0.3s ease both' }}>
            <h2
              className="text-xl font-bold mb-4 flex items-center gap-2"
              style={{ fontFamily: '"Cormorant Garamond", serif', color: 'var(--text-primary)' }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: '#D4AF37' }} />
              Rose Ledger
            </h2>
            <div
              className="rounded-3xl overflow-hidden relative"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)' }}
              />
              {transactions.length === 0 ? (
                <div className="text-center py-10" style={{ color: 'rgba(180,120,150,0.3)' }}>
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {transactions.map((tx, i) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-5 py-4 transition-all duration-300 hover:bg-white/[0.02]"
                      style={{ animation: `fadeUp 0.4s ${i * 0.05}s ease both` }}
                    >
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {tx.description}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(180,120,150,0.4)' }}>
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div
                        className="font-bold text-sm px-3 py-1 rounded-xl"
                        style={{
                          background: tx.amount > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(225,29,72,0.1)',
                          border: `1px solid ${tx.amount > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(225,29,72,0.2)'}`,
                          color: tx.amount > 0 ? '#4ADE80' : '#FDA4AF',
                        }}
                      >
                        {tx.amount > 0 ? '+' : ''}{tx.amount} 🌹
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      <Navbar />
    </div>
  );
}
