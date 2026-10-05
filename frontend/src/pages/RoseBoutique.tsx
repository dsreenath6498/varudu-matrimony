import { useEffect, useState } from 'react';
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

  const loadCashfree = () => {
    return new Promise((resolve) => {
      if ((window as any).Cashfree) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    fetchData();

    // Check for return redirect from Cashfree
    const queryParams = new URLSearchParams(window.location.search);
    const orderIdParam = queryParams.get('order_id');
    const userStr = localStorage.getItem('user');

    if (orderIdParam && userStr) {
      const user = JSON.parse(userStr);
      api.post('/roses/cashfree-verify', { userId: user.id, amount: 1, orderId: orderIdParam })
        .then(() => {
          alert('Cashfree Payment Verified Successfully!');
          fetchData();
          // Clean URL parameter
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => {
          console.error('Redirect Verification Error:', err);
        });
    }
  }, []);

  const handleBuy = async (amount: number) => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user')!);
    try {
      const res = await api.post('/roses/cashfree-order', { userId: user.id, amount });
      const { paymentSessionId, orderId, mock, env } = res.data;

      if (mock) {
        await api.post('/roses/cashfree-verify', { userId: user.id, amount, mock: true, orderId });
        alert('Mock Cashfree Payment Successful! Roses added.');
        fetchData();
        setLoading(false);
        return;
      }

      const resLoad = await loadCashfree();
      if (!resLoad || !(window as any).Cashfree) {
        alert('Cashfree SDK failed to load.');
        setLoading(false);
        return;
      }

      const cashfree = (window as any).Cashfree({
        mode: env === 'production' ? 'production' : 'sandbox',
      });

      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: '_modal',
      };

      cashfree.checkout(checkoutOptions).then(async (result: any) => {
        if (result.error) {
          console.error('Cashfree Checkout Error:', result.error);
          alert(result.error.message || 'Payment cancelled or failed');
          setLoading(false);
          return;
        }

        if (!result.redirect) {
          try {
            await api.post('/roses/cashfree-verify', { userId: user.id, amount, orderId });
            alert('Cashfree Payment Successful! Roses added to your account.');
            fetchData();
          } catch (err: any) {
            alert(err.response?.data?.error || 'Verification Failed');
          } finally {
            setLoading(false);
          }
        }
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to initialize Cashfree payment');
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

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div
      className="min-h-screen flex flex-col pb-24 md:pb-0 md:ml-44 bg-white"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 bg-white border-b border-neutral-200"
      >
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 flex items-center justify-center transition-all bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
          style={{
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-neutral-900 font-sans">
          The Rose Boutique
        </h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Balance Card */}
          <div
            className="rounded-3xl p-8 text-center bg-white border border-neutral-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] font-sans"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
              Your Balance
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl select-none">🌹</span>
              <span className="text-5xl font-extrabold text-neutral-900 tracking-tight font-sans">
                {balance}
              </span>
            </div>
            <p className="text-xs mt-3 text-neutral-400">
              Roses never expire · Use them wisely
            </p>
          </div>

          {/* Buy Roses */}
          <div className="font-sans">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-neutral-900">
              <span>🌹</span>
              Buy Roses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rosePacks.map((pack, index) => (
                <div
                  key={index}
                  onClick={() => !loading && handleBuy(pack.roses)}
                  className="relative rounded-2xl p-6 bg-white border border-neutral-200/80 shadow-sm cursor-pointer hover:border-neutral-400 transition-all duration-200 flex flex-col justify-between min-h-[160px]"
                >
                  {pack.badge && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black text-white">
                      {pack.badge}
                    </div>
                  )}

                  <div className="flex items-center justify-center mb-3">
                    {pack.roses === 1 ? (
                      <span className="text-3xl select-none">🌹</span>
                    ) : pack.roses === 5 ? (
                      <div className="flex -space-x-2">
                        {['🌹', '🌹', '🌹'].map((r, i) => (
                          <span key={i} className="text-2xl select-none">{r}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex -space-x-2">
                        {['🌹', '🌹', '🌹', '🌹', '🌹'].map((r, i) => (
                          <span key={i} className="text-xl select-none">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-center text-xs text-neutral-800 mb-1">
                      {pack.label}
                    </h3>
                    <p className="text-center font-extrabold text-xl text-neutral-900">
                      {pack.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Earn Free Roses */}
          <div className="font-sans">
            <h2 className="text-base font-bold mb-4 text-neutral-900">
              Earn Free Roses
            </h2>
            <div className="space-y-3">

              {/* Daily Drop */}
              <button
                onClick={() => handleAction('claim-free')}
                disabled={!canClaimFree || loading}
                className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border text-neutral-800 disabled:opacity-40"
                style={{
                  background: canClaimFree ? '#E9F7EF' : '#FFFFFF',
                  borderColor: canClaimFree ? '#A2D9CE' : '#E8E8ED',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-neutral-100 border border-neutral-200"
                  >
                    <Gift className="w-5 h-5 text-neutral-800" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-xs text-neutral-900">Daily Drop</h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Claim 1 free rose every 48 hours
                    </p>
                  </div>
                </div>
                <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-black text-white">
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
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-neutral-200/80 hover:bg-neutral-50 transition-all duration-200 text-neutral-800 disabled:opacity-40"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-neutral-100 border border-neutral-200"
                  >
                    <PlaySquare className="w-5 h-5 text-neutral-800" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-xs text-neutral-900">Watch a Short Video</h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Help support the app
                    </p>
                  </div>
                </div>
                <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-black text-white">
                  +1 🌹
                </span>
              </button>

              {/* Refer a Friend */}
              <div
                className="flex items-center justify-between p-4 rounded-2xl bg-white border border-neutral-200/80"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-neutral-100 border border-neutral-200"
                  >
                    <Users className="w-5 h-5 text-neutral-800" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-xs text-neutral-900">Refer a Friend</h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      They get 1, you get 2!
                    </p>
                  </div>
                </div>
                <button
                  onClick={copyReferral}
                  className="font-sans font-semibold text-xs px-3 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1 bg-black text-white hover:bg-neutral-900"
                  style={{
                    background: copiedCode ? '#E9F7EF' : '#1D1D1F',
                    border: copiedCode ? '1px solid #A2D9CE' : 'none',
                    color: copiedCode ? '#27AE60' : '#FFFFFF',
                  }}
                >
                  {copiedCode ? '✓ Copied!' : (referralCode || '...')}
                </button>
              </div>
            </div>
          </div>

          {/* Rose Ledger */}
          <div className="font-sans pb-10">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-neutral-900">
              <TrendingUp className="w-4 h-4 text-neutral-800" />
              Rose Ledger
            </h2>
            <div
              className="rounded-3xl overflow-hidden bg-white border border-neutral-200/80 shadow-sm"
            >
              {transactions.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 font-sans">
                  <p className="text-xs">No transactions yet</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50/50 transition-all font-sans"
                    >
                      <div className="text-left">
                        <p className="font-semibold text-xs text-neutral-900">
                          {tx.description}
                        </p>
                        <p className="text-[10px] mt-0.5 text-neutral-400">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div
                        className="font-bold text-xs px-2.5 py-0.5 rounded-full border"
                        style={{
                          background: tx.amount > 0 ? '#E9F7EF' : '#FDEBD0',
                          borderColor: tx.amount > 0 ? '#A2D9CE' : '#F5CBA7',
                          color: tx.amount > 0 ? '#27AE60' : '#E67E22',
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
