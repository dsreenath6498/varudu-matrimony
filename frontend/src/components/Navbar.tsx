import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Heart, Compass, MessageCircle, Home, User } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/interests', icon: Heart, label: 'Interests' },
  { to: '/chat', icon: MessageCircle, label: 'Chats' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Navbar({ hideMobileBottom = false }: { hideMobileBottom?: boolean }) {
  const { unreadCount } = useSocket();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* ── MOBILE BOTTOM BAR ── */}
      {!hideMobileBottom && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-t border-neutral-200/40 py-4 flex justify-around shadow-sm"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {navItems.map(({ to, icon: Icon }) => {
          const isActive = location.pathname === to;
          const isChatTab = to === '/chat';
          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center transition-all duration-200"
              style={{
                opacity: mounted ? 1 : 0,
              }}
            >
              <div className="relative">
                <Icon
                  className="w-5.5 h-5.5 transition-opacity duration-200"
                  style={{
                    color: '#1D1D1F',
                    opacity: isActive ? 0.95 : 0.25,
                    strokeWidth: isActive ? 2.5 : 2,
                    fill: isActive && to === '/interests' ? '#1D1D1F' : 'none',
                  }}
                />
                {isChatTab && unreadCount > 0 && (
                  <div
                    className="absolute -top-1 -right-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-full text-[8px] font-bold bg-[#0071E3] text-white"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>
      )}

      {/* ── DESKTOP TRANSPARENT SIDEBAR ── */}
      <nav
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-44 z-50 bg-transparent select-none pointer-events-none"
      >
        {/* Only contents are pointer-interactive, background is click-through */}
        <div className="flex flex-col h-full py-8 px-6 text-left relative z-10 pointer-events-auto">
          {/* Logo / Branding in Italic */}
          <div className="mb-14 text-center md:text-left pl-1">
            <h1 className="text-xl font-serif italic font-medium tracking-tight text-neutral-900">
              shubamasthu
            </h1>
          </div>

          {/* Nav Items (Centered, light outlines underneath branding, lower opacity) */}
          <div className="flex flex-col items-center gap-7 flex-1">
            {navItems.map(({ to, icon: Icon }) => {
              const isActive = location.pathname === to;
              const isChatTab = to === '/chat';
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="relative flex items-center justify-center py-1 transition-all duration-200"
                >
                  <Icon
                    className="w-5.5 h-5.5 transition-opacity duration-200"
                    style={{
                      color: '#1D1D1F',
                      opacity: isActive ? 0.95 : 0.25,
                      strokeWidth: isActive ? 2.5 : 2,
                      fill: isActive && to === '/interests' ? '#1D1D1F' : 'none',
                    }}
                  />
                  {isChatTab && unreadCount > 0 && (
                    <div
                      className="absolute -top-1 left-4 flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-full text-[8px] font-bold bg-[#0071E3] text-white"
                    >
                      {unreadCount}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
