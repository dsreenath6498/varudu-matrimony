import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Flower2 } from 'lucide-react';

export default function FloatingRose() {
  const [balance, setBalance] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalance = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      try {
        const res = await api.get('/roses/balance', { params: { userId: user.id } });
        setBalance(res.data.roses_balance);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchBalance();
    
    // Listen for balance updates (custom event)
    const handleUpdate = () => fetchBalance();
    window.addEventListener('rose_balance_updated', handleUpdate);
    return () => window.removeEventListener('rose_balance_updated', handleUpdate);
  }, []);

  return (
    <div 
      className="fixed top-20 right-4 md:right-8 z-50 cursor-pointer group"
      onClick={() => navigate('/store')}
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity"></div>
        
        {/* Floating Button */}
        <div className="relative bg-gradient-to-r from-red-700 to-rose-600 border-2 border-amber-300 rounded-full p-3 shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
          <Flower2 className="w-6 h-6 text-amber-100" />
          
          {/* Badge */}
          <div className="absolute -top-2 -right-2 bg-amber-400 text-red-900 text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
            {balance}
          </div>
        </div>
      </div>
    </div>
  );
}
