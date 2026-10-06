import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Compass, Sparkles, MessageCircle, Home, User } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/interests', icon: Heart, label: 'Interests' },
  { to: '/store', icon: Sparkles, label: 'Boutique' },
  { to: '/chat', icon: MessageCircle, label: 'Chats' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Navbar({ hideMobileBottom: _hideMobileBottom }: { hideMobileBottom?: boolean }) {
  const { unreadCount } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = !!localStorage.getItem('user');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Deep warm brown outline color
  const brownColor = '#4A2E19';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end px-3 sm:px-6 md:px-12 py-3 sm:py-5 bg-transparent select-none pointer-events-none">
      {isAuthenticated ? (
        /* Horizontal Nav Icons Floating Directly on Background Image without any white container block */
        <div className="flex items-center gap-3 sm:gap-6 md:gap-8 pointer-events-auto bg-transparent p-0 border-none shadow-none select-none">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            const isChatTab = to === '/chat';
            return (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={`relative flex items-center justify-center p-1.5 sm:p-2 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-[#5C3A21]/15 scale-105' : 'hover:bg-[#5C3A21]/10'
                }`}
                style={{
                  opacity: mounted ? 1 : 0,
                }}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className="w-5.5 h-5.5 sm:w-6 sm:h-6 transition-all duration-200"
                    style={{
                      color: brownColor,
                      strokeWidth: 2, // Lighter, clean outline for mobile
                      opacity: isActive ? 0.95 : 0.75,
                      fill: isActive && to === '/interests' ? brownColor : 'none',
                    }}
                  />
                  {isChatTab && unreadCount > 0 && (
                    <div
                      className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[15px] h-4 px-1 rounded-full text-[9px] font-bold bg-[#C59B63] text-white shadow-sm"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>
      ) : (
        /* Login / Signup Nav Options when Unauthenticated (Matching design screenshot) */
        <div className="flex items-center gap-2.5 sm:gap-6 md:gap-8 pointer-events-auto font-sans">
          <button 
            onClick={() => alert("Varudu Matrimony connects individuals with meaningful matches.")}
            className="text-xs sm:text-sm font-medium text-[#4A2E19] hover:text-[#2C1A0D] transition-colors px-1"
          >
            About
          </button>
          <button 
            onClick={() => alert("Contact Support: support@varudu.com")}
            className="text-xs sm:text-sm font-medium text-[#4A2E19] hover:text-[#2C1A0D] transition-colors px-1"
          >
            Help
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-xs sm:text-sm font-semibold text-[#4A2E19] hover:underline transition-all px-1"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#4A2E19] hover:bg-[#3A2312] text-white font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95"
          >
            Sign Up
          </button>
        </div>
      )}
    </nav>
  );
}

