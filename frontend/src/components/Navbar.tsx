import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Heart, Bell, MessageCircle, Home, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const navItems = [
  { to: '/', icon: Home, label: 'Discover' },
  { to: '/interests', icon: Heart, label: 'Interests' },
  { to: '/requests', icon: Bell, label: 'Requests' },
  { to: '/chat', icon: MessageCircle, label: 'Chats' },
];

export default function Navbar() {
  const { unreadCount } = useSocket();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* ── MOBILE BOTTOM BAR ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className="mx-3 mb-3 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(10, 0, 8, 0.85)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 -4px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(225,29,72,0.08)',
          }}
        >
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map(({ to, icon: Icon, label }, i) => {
              const isActive = location.pathname === to;
              const isChatTab = to === '/chat';
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 relative"
                  style={{
                    opacity: mounted ? 1 : 0,
                    animation: `fadeUp 0.4s ease ${i * 0.06}s both`,
                  }}
                >
                  {/* Active background blob */}
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(225,29,72,0.25), rgba(212,175,55,0.1))',
                        border: '1px solid rgba(225,29,72,0.3)',
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div className="relative">
                    <Icon
                      className="w-5 h-5 relative z-10 transition-all duration-300"
                      style={{
                        color: isActive ? '#FFD700' : 'rgba(180,120,150,0.7)',
                        filter: isActive ? 'drop-shadow(0 0 6px rgba(255,215,0,0.6))' : 'none',
                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                        fill: isActive && (to === '/interests') ? '#FFD700' : 'none',
                      }}
                    />
                    {/* Notification badge */}
                    {isChatTab && unreadCount > 0 && (
                      <div
                        className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #E11D48, #C41E3A)',
                          color: 'white',
                          boxShadow: '0 0 8px rgba(225,29,72,0.6)',
                          animation: 'bounceIn 0.3s ease',
                        }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className="text-[10px] font-semibold relative z-10 transition-all duration-300"
                    style={{
                      color: isActive ? '#FFD700' : 'rgba(160,100,130,0.7)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── DESKTOP SIDEBAR ── */}
      <nav
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 z-50"
        style={{
          background: 'rgba(5, 0, 5, 0.92)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '4px 0 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Decorative orb */}
        <div
          className="absolute top-0 left-0 w-64 h-64 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 30% 20%, rgba(225,29,72,0.15) 0%, transparent 70%)',
          }}
        />

        <div className="flex flex-col h-full p-6 relative z-10">
          {/* Logo */}
          <div className="mb-10" style={{ animation: 'fadeUp 0.6s ease both' }}>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #9F1239, #E11D48)',
                  boxShadow: '0 0 16px rgba(225,29,72,0.5)',
                  animation: 'pulseGlow 3s ease-in-out infinite',
                }}
              >
                <Heart className="w-4 h-4 fill-current text-white" />
              </div>
              <div>
                <h1
                  className="text-2xl font-serif font-bold"
                  style={{ fontFamily: '"Cormorant Garamond", serif' }}
                >
                  <span className="gradient-text-gold">Varudu</span>
                </h1>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" style={{ color: '#D4AF37' }} />
                  <p
                    className="text-[9px] font-semibold uppercase tracking-[0.25em]"
                    style={{ color: '#D4AF37' }}
                  >
                    Premium
                  </p>
                </div>
              </div>
            </div>
            {/* Gold divider */}
            <div
              className="mt-4 h-px w-full"
              style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.5), transparent)' }}
            />
          </div>

          {/* Nav Items */}
          <div className="flex flex-col gap-1 flex-1">
            {navItems.map(({ to, icon: Icon, label }, i) => {
              const isActive = location.pathname === to;
              const isChatTab = to === '/chat';
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(225,29,72,0.2), rgba(212,175,55,0.08))'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(225,29,72,0.25)'
                      : '1px solid transparent',
                    animation: `fadeUp 0.5s ease ${0.1 + i * 0.08}s both`,
                  }}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                      style={{
                        background: 'linear-gradient(180deg, #FFD700, #E11D48)',
                        boxShadow: '0 0 10px rgba(225,29,72,0.6)',
                      }}
                    />
                  )}

                  <div className="relative flex-shrink-0">
                    <Icon
                      className="w-5 h-5 transition-all duration-300"
                      style={{
                        color: isActive ? '#FFD700' : 'rgba(160,100,130,0.6)',
                        filter: isActive ? 'drop-shadow(0 0 6px rgba(255,215,0,0.6))' : 'none',
                        fill: isActive && to === '/interests' ? '#FFD700' : 'none',
                      }}
                    />
                    {isChatTab && unreadCount > 0 && (
                      <div
                        className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #E11D48, #C41E3A)',
                          color: 'white',
                          boxShadow: '0 0 8px rgba(225,29,72,0.6)',
                        }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>

                  <span
                    className="text-sm font-semibold transition-all duration-300"
                    style={{
                      color: isActive ? '#FFF8F0' : 'rgba(160,100,130,0.6)',
                    }}
                  >
                    {label}
                  </span>

                  {/* Hover glow */}
                  {!isActive && (
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    />
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Bottom decoration */}
          <div
            className="h-px w-full mb-4"
            style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.3), transparent)' }}
          />
          <p
            className="text-[10px] text-center"
            style={{ color: 'rgba(120,80,100,0.5)', letterSpacing: '0.1em' }}
          >
            VARUDU © 2025
          </p>
        </div>
      </nav>
    </>
  );
}
