import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function FloatingRose() {
  const [balance, setBalance] = useState(0);
  const [prevBalance, setPrevBalance] = useState(0);
  const [burst, setBurst] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalance = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      try {
        const res = await api.get('/roses/balance', { params: { userId: user.id } });
        const newBalance = res.data.roses_balance;
        if (newBalance > prevBalance && prevBalance !== 0) {
          setBurst(true);
          setTimeout(() => setBurst(false), 1000);
        }
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
      className="fixed top-4 right-4 md:top-6 md:right-6 z-[60] cursor-pointer group"
      onClick={() => navigate('/store')}
      style={{ animation: 'fadeUp 0.5s 0.4s ease both' }}
    >
      {/* Burst particles */}
      {burst && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: '#FFD700',
                top: '50%',
                left: '50%',
                animation: `petalBurst 0.8s ease forwards`,
                transform: `rotate(${i * 60}deg)`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Outer glow ring */}
      <div
        className="absolute inset-[-6px] rounded-full"
        style={{
          background: 'transparent',
          border: '1px solid rgba(225,29,72,0.3)',
          animation: 'pulseGlow 3s ease-in-out infinite',
          boxShadow: '0 0 20px rgba(225,29,72,0.4), 0 0 40px rgba(225,29,72,0.15)',
        }}
      />

      {/* Floating button */}
      <div
        className="relative rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
        style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #7A0B2A 0%, #C41E3A 50%, #E11D48 100%)',
          border: '1.5px solid rgba(255,215,0,0.4)',
          boxShadow: '0 8px 24px rgba(225,29,72,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
          animation: 'float 5s ease-in-out infinite',
        }}
      >
        {/* Rose emoji */}
        <span style={{ fontSize: '20px', lineHeight: 1 }}>🌹</span>

        {/* Badge */}
        <div
          className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full font-bold text-[11px]"
          style={{
            background: 'linear-gradient(135deg, #D4AF37, #FFD700)',
            color: '#0a0008',
            border: '1.5px solid rgba(10,0,8,0.8)',
            boxShadow: '0 0 10px rgba(212,175,55,0.6)',
            animation: burst ? 'bounceIn 0.5s ease' : 'none',
          }}
        >
          {balance}
        </div>
      </div>

      {/* Tooltip */}
      <div
        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-x-2 group-hover:translate-x-0"
        style={{
          background: 'rgba(10,0,8,0.9)',
          border: '1px solid rgba(212,175,55,0.3)',
          color: '#FFF8F0',
          fontSize: '12px',
          fontWeight: 600,
          padding: '6px 12px',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
        }}
      >
        Rose Boutique
      </div>
    </div>
  );
}
