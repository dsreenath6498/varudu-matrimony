import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { Flower2, PlaySquare, Users, CheckCircle2, ArrowLeft } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export default function RoseBoutique() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [canClaimFree, setCanClaimFree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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

      // Dispatch event to update FloatingRose everywhere
      window.dispatchEvent(new Event('rose_balance_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        // Fallback testing flow if no razorpay keys
        await api.post('/roses/buy-verify', { userId: user.id, amount, mock: true });
        alert('Mock Payment Successful! Roses added.');
        fetchData();
        setLoading(false);
        return;
      }

      const resLoad = await loadRazorpay();
      if (!resLoad) {
        alert('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      const options = {
        key: keyId,
        amount: amountPaise,
        currency: 'INR',
        name: 'Varudu Matrimony',
        description: `Purchase ${amount} Rose(s)`,
        image: 'https://cdn-icons-png.flaticon.com/512/864/864685.png', // Rose icon
        order_id: orderId,
        handler: async function (response: any) {
          try {
            await api.post('/roses/buy-verify', {
              userId: user.id,
              amount,
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
        prefill: {
          name: user.name,
          contact: user.phone_number || "9999999999"
        },
        theme: {
          color: '#E11D48' // Rose color
        }
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

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col pb-16 md:pb-0 md:ml-64 transition-all">
      <div className="p-4 bg-gradient-to-r from-red-900 via-rose-900 to-amber-900 shadow-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-amber-300 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-serif font-bold text-amber-300">The Rose Boutique</h1>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Balance Header */}
          <div className="bg-white rounded-3xl p-6 text-center border-2 border-rose-200 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/floral-flourish.png')] mix-blend-multiply"></div>
            <h2 className="text-rose-900 font-bold uppercase tracking-widest text-sm mb-2">Your Balance</h2>
            <div className="flex justify-center items-center gap-3">
              <Flower2 className="w-10 h-10 text-red-600 drop-shadow-md" />
              <span className="text-6xl font-serif font-bold text-slate-800">{balance}</span>
            </div>
            <p className="text-slate-500 mt-2 text-sm">Roses never expire.</p>
          </div>

          {/* Premium Store */}
          <div>
            <h2 className="font-serif font-bold text-xl text-rose-900 mb-4 flex items-center gap-2">
              <Flower2 className="w-5 h-5 text-amber-500" /> Buy Roses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Single */}
              <div onClick={() => handleBuy(1)} className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm cursor-pointer hover:shadow-md hover:border-amber-300 transition text-center group">
                <Flower2 className="w-8 h-8 mx-auto text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-slate-800">A Single Rose</h3>
                <p className="text-2xl font-bold text-rose-900 mt-2">₹100</p>
              </div>
              {/* Boutique */}
              <div onClick={() => handleBuy(5)} className="bg-gradient-to-br from-rose-100 to-amber-50 rounded-2xl p-6 border-2 border-amber-400 shadow-md cursor-pointer hover:shadow-lg transition text-center relative group">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Save 30%</div>
                <div className="flex justify-center -space-x-2 mb-2 group-hover:scale-110 transition-transform">
                  <Flower2 className="w-8 h-8 text-red-500" />
                  <Flower2 className="w-8 h-8 text-red-600" />
                  <Flower2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="font-bold text-slate-800">The Boutique (5)</h3>
                <p className="text-2xl font-bold text-rose-900 mt-2">₹350</p>
              </div>
              {/* Grand Gesture */}
              <div onClick={() => handleBuy(20)} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700 shadow-md cursor-pointer hover:shadow-lg transition text-center group">
                <div className="flex justify-center -space-x-1 mb-2 group-hover:scale-110 transition-transform">
                  <Flower2 className="w-8 h-8 text-amber-500" />
                  <Flower2 className="w-8 h-8 text-amber-400" />
                  <Flower2 className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="font-bold text-amber-400">Grand Gesture (20)</h3>
                <p className="text-2xl font-bold text-white mt-2">₹1,150</p>
              </div>
            </div>
          </div>

          {/* Earn Free Roses */}
          <div>
            <h2 className="font-serif font-bold text-xl text-rose-900 mb-4">Earn Free Roses</h2>
            <div className="space-y-3">
              
              <button 
                onClick={() => handleAction('claim-free')}
                disabled={!canClaimFree || loading}
                className="w-full bg-white rounded-2xl p-4 border border-rose-100 flex items-center justify-between disabled:opacity-50 hover:bg-rose-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full"><Flower2 className="w-6 h-6 text-green-600" /></div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800">Daily Drop</h3>
                    <p className="text-sm text-slate-500">Claim 1 Free Rose every 48 hours</p>
                  </div>
                </div>
                <div className="font-bold text-green-600">+1 Rose</div>
              </button>

              <button 
                onClick={() => {
                  alert("Playing Sample Ad...");
                  setTimeout(() => handleAction('watch-ad'), 2000);
                }}
                disabled={loading}
                className="w-full bg-white rounded-2xl p-4 border border-rose-100 flex items-center justify-between hover:bg-rose-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full"><PlaySquare className="w-6 h-6 text-blue-600" /></div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800">Watch a short video</h3>
                    <p className="text-sm text-slate-500">Help support the app</p>
                  </div>
                </div>
                <div className="font-bold text-blue-600">+1 Rose</div>
              </button>

              <div className="w-full bg-white rounded-2xl p-4 border border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full"><Users className="w-6 h-6 text-purple-600" /></div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800">Refer a Friend</h3>
                    <p className="text-sm text-slate-500">They get 1, you get 2!</p>
                  </div>
                </div>
                <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-700">
                  {referralCode || 'Loading...'}
                </div>
              </div>

            </div>
          </div>

          {/* Rose Ledger (History) */}
          <div>
            <h2 className="font-serif font-bold text-xl text-rose-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-500" /> Rose Ledger
            </h2>
            <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-sm">
              {transactions.length === 0 ? (
                <div className="text-center text-slate-500 py-4">
                  No transactions yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between border-b border-rose-50 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-slate-800">{tx.description}</p>
                        <p className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                      <div className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
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
