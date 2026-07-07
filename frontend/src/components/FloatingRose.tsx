import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function FloatingRose() {
  const [balance, setBalance] = useState(0);
  const [prevBalance, setPrevBalance] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalance = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      try {
        const res = await api.get('/roses/balance', { params: { userId: user.id } });
        const newBalance = res.data.roses_balance;
        setPrevBalance(newBalance);
        setBalance(newBalance);
      } catch (err) {
        console.error(err);
      }
    };

    fetchBalance();

    const handleUpdate = () => fetchBalance();
    window.addEventListener('rose_balance_updated', handleUpdate);
    return () => window.removeEventListener('rose_balance_updated', handleUpdate);
  }, [prevBalance]);

  return (
    <div
      className="fixed top-4 right-4 md:top-6 md:right-6 z-[60] cursor-pointer group flex items-center gap-2 bg-neutral-100/90 hover:bg-neutral-200/90 border border-neutral-200 px-3.5 py-2 rounded-full transition-all duration-200 shadow-sm backdrop-blur-md"
      onClick={() => navigate('/store')}
    >
      <span className="text-base select-none">🌹</span>
      <span className="text-xs font-semibold text-neutral-800 tracking-tight select-none">Rose Boutique</span>
      <div className="flex items-center justify-center bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px]">
        {balance}
      </div>
    </div>
  );
}
