import { useEffect, useState, useRef } from 'react';
import TinderCard from 'react-tinder-card';
import api from '../api';
import Navbar from '../components/Navbar';
import { MapPin, Info, LogOut, MessageSquareHeart, X, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  name: string;
  age: number;
  place: string;
  photos: string[];
}

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const navigate = useNavigate();
  const cardRefs = useRef<Record<string, any>>({});
  const pendingInteraction = useRef({ type: 'standard', message: null as string | null });

  useEffect(() => {
    const fetchFeed = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      try {
        const response = await api.get('/profile/feed', {
          params: { userId: user.id, interestedIn: user.interested_in }
        });
        setProfiles(response.data.profiles);
      } catch (error) {
        console.error('Error fetching feed', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const swiped = async (direction: string, receiverId: string) => {
    const { type: interactionType, message: attachedMessage } = pendingInteraction.current;
    pendingInteraction.current = { type: 'standard', message: null }; // Reset

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const isInterested = direction === 'right';
    setSwipeDirection(direction);
    setTimeout(() => setSwipeDirection(null), 600);
    try {
      await api.post('/interactions/swipe', {
        senderId: user.id,
        receiverId,
        isInterested,
        interactionType,
        attachedMessage
      });
      if (interactionType !== 'standard') {
        window.dispatchEvent(new Event('rose_balance_updated'));
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error recording swipe');
    }
  };

  const outOfFrame = (profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  const swipeButton = async (dir: string, profileId: string, type = 'standard', message: string | null = null) => {
    pendingInteraction.current = { type, message };
    if (cardRefs.current[profileId]) {
      await cardRefs.current[profileId].swipe(dir);
    } else {
      swiped(dir, profileId);
      outOfFrame(profileId);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const handleNoteClick = () => {
    if (profiles.length > 0) {
      setActiveProfileId(profiles[profiles.length - 1].id);
      setShowNoteModal(true);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col md:ml-64 transition-all"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Mobile Header */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
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
          Varudu
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(180,120,150,0.7)',
            fontSize: '12px',
          }}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="font-semibold">Logout</span>
        </button>
      </div>

      {/* Desktop Logout - Moved to avoid Rose Boutique overlap */}
      <div className="hidden md:flex justify-end p-4 absolute top-0 right-24 z-20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-muted)',
            backdropFilter: 'blur(10px)',
            fontSize: '13px',
          }}
        >
          <LogOut className="w-4 h-4" />
          <span className="font-semibold">Logout</span>
        </button>
      </div>

      {/* Swipe Indicator Overlay */}
      {swipeDirection && (
        <div
          className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center"
          style={{
            background: swipeDirection === 'right'
              ? 'radial-gradient(circle at center, rgba(34,197,94,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(225,29,72,0.15) 0%, transparent 70%)',
            animation: 'fadeIn 0.1s ease both',
          }}
        >
          <div
            className="rounded-full p-6"
            style={{
              background: swipeDirection === 'right'
                ? 'rgba(34,197,94,0.2)'
                : 'rgba(225,29,72,0.2)',
              border: `3px solid ${swipeDirection === 'right' ? 'rgba(34,197,94,0.6)' : 'rgba(225,29,72,0.6)'}`,
              animation: 'bounceIn 0.3s ease',
            }}
          >
            {swipeDirection === 'right'
              ? <Heart className="w-16 h-16" style={{ color: '#22C55E', fill: '#22C55E' }} />
              : <X className="w-16 h-16" style={{ color: '#E11D48' }} />
            }
          </div>
        </div>
      )}

      {/* Card Stack Area */}
      <div
        className="flex-1 flex flex-col items-center justify-center overflow-hidden relative"
        style={{ minHeight: 'calc(100vh - 4rem)' }}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-4 z-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(225,29,72,0.1)',
                border: '1px solid rgba(225,29,72,0.2)',
                animation: 'pulseGlow 2s ease-in-out infinite',
              }}
            >
              <span style={{ fontSize: '28px', animation: 'float 2s ease-in-out infinite' }}>🌹</span>
            </div>
            <div>
              <p
                className="text-center font-medium"
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  color: 'rgba(212,175,55,0.7)',
                  fontSize: '18px',
                }}
              >
                Finding your perfect match...
              </p>
              <div className="flex justify-center gap-1.5 mt-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: '#E11D48',
                      animation: `heartbeat 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <div
            className="text-center z-10 p-8 flex flex-col items-center"
            style={{ animation: 'fadeUp 0.6s ease both' }}
          >
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
              style={{
                background: 'rgba(225,29,72,0.08)',
                border: '1px solid rgba(225,29,72,0.2)',
                animation: 'pulseGlow 3s ease-in-out infinite',
              }}
            >
              <Heart className="w-12 h-12" style={{ color: '#E11D48', opacity: 0.6 }} />
            </div>
            <h2
              className="text-3xl font-bold mb-2"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                background: 'linear-gradient(135deg, #FFD700, #D4AF37)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              You're all caught up!
            </h2>
            <p className="max-w-xs text-sm leading-relaxed" style={{ color: 'rgba(180,120,150,0.6)' }}>
              We're searching the stars for more compatible matches. Check back soon.
            </p>
          </div>
        ) : (
          <div className="relative w-[90vw] max-w-[420px] h-[68vh] max-h-[650px] mx-auto mt-4 md:mt-8 perspective-1000">
            {profiles.map((profile) => (
              <TinderCard
                ref={(el) => (cardRefs.current[profile.id] = el)}
                className="absolute inset-0 swipe-card cursor-grab active:cursor-grabbing"
                key={profile.id}
                onSwipe={(dir) => swiped(dir, profile.id)}
                onCardLeftScreen={() => outOfFrame(profile.id)}
                preventSwipe={['up', 'down']}
              >
                <div
                  className="w-full h-full relative bg-cover bg-center rounded-[32px] overflow-hidden"
                  style={{
                    backgroundImage: `url(${profile.photos && profile.photos.length > 0 ? profile.photos[0] : 'https://via.placeholder.com/600x800?text=No+Photo'})`,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.12)'
                  }}
                >
                  {/* Gradient overlays */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.95) 100%)',
                    }}
                  />
                  {/* Top edge vignette */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.4) 0%, transparent 60%)',
                    }}
                  />

                  {/* Profile Info */}
                  <div
                    className="absolute bottom-0 left-0 right-0 p-6"
                    style={{ paddingBottom: 'calc(140px + env(safe-area-inset-bottom))' }}
                  >
                    {/* Name + Age */}
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <h2
                          className="font-bold mb-1"
                          style={{
                            fontFamily: '"Cormorant Garamond", serif',
                            fontSize: 'clamp(32px, 6vw, 48px)',
                            color: 'white',
                            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
                            lineHeight: 1.1,
                          }}
                        >
                          {profile.name}, <span style={{ color: '#FFD700', fontWeight: 400 }}>{profile.age}</span>
                        </h2>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" style={{ color: 'rgba(255,215,0,0.8)' }} />
                          <span
                            className="text-sm font-medium"
                            style={{ color: 'rgba(255,248,240,0.8)' }}
                          >
                            {profile.place}
                          </span>
                        </div>
                      </div>
                      <button
                        className="rounded-full p-3 flex-shrink-0 transition-all duration-300 hover:scale-110"
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.15)',
                        }}
                      >
                        <Info className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {/* Subtle separator */}
                    <div
                      className="h-px w-20 mt-3"
                      style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.6), transparent)' }}
                    />
                  </div>
                </div>
              </TinderCard>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div
        className="fixed bottom-20 md:bottom-10 left-0 right-0 flex justify-center z-40 px-4 pointer-events-none"
        style={{ marginLeft: '0', paddingLeft: '0' }}
      >
        <div
          className="pointer-events-auto flex justify-center gap-3 md:gap-4 items-center px-5 py-3 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Pass */}
          <button
            onClick={() => { if (profiles.length > 0) swipeButton('left', profiles[profiles.length - 1].id, 'standard'); }}
            className="rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              width: '56px',
              height: '56px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,80,80,0.2)',
              color: 'rgba(255,100,100,0.7)',
            }}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Like */}
          <button
            onClick={() => { if (profiles.length > 0) swipeButton('right', profiles[profiles.length - 1].id, 'standard'); }}
            className="rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.15))',
              border: '1px solid rgba(34,197,94,0.4)',
              color: '#4ADE80',
              boxShadow: '0 0 20px rgba(34,197,94,0.2)',
              animation: 'heartbeat 3s ease-in-out infinite',
            }}
          >
            <Heart className="w-7 h-7" style={{ fill: 'rgba(74,222,128,0.3)' }} />
          </button>

          {/* Rose */}
          <button
            onClick={() => { if (profiles.length > 0) swipeButton('right', profiles[profiles.length - 1].id, 'rose'); }}
            className="rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 relative"
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #7A0B2A, #E11D48)',
              border: '1px solid rgba(255,100,120,0.3)',
              color: 'white',
              animation: 'pulseGlow 3s ease-in-out infinite',
              boxShadow: '0 0 20px rgba(225,29,72,0.5)',
            }}
          >
            <span style={{ fontSize: '22px' }}>🌹</span>
            <div
              className="absolute -top-1.5 -right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #FFD700)',
                color: '#0a0008',
                border: '1px solid rgba(10,0,8,0.6)',
              }}
            >
              1
            </div>
          </button>

          {/* Note */}
          <button
            onClick={handleNoteClick}
            className="rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 relative"
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(255,215,0,0.1))',
              border: '1px solid rgba(212,175,55,0.35)',
              color: '#D4AF37',
              boxShadow: '0 0 15px rgba(212,175,55,0.15)',
            }}
          >
            <MessageSquareHeart className="w-6 h-6" />
            <div
              className="absolute -top-1.5 -right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #E11D48, #C41E3A)',
                color: 'white',
                border: '1px solid rgba(10,0,8,0.6)',
              }}
            >
              3
            </div>
          </button>
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && activeProfileId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease both',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowNoteModal(false); }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 relative overflow-hidden"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-card)',
              animation: 'slideInScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
            }}
          >
            {/* Top shimmer */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)' }}
            />

            <h3
              className="text-xl font-bold mb-1 flex items-center gap-2"
              style={{ fontFamily: '"Cormorant Garamond", serif', color: 'var(--text-primary)' }}
            >
              <span>🌹</span>
              Send a Note
            </h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(180,120,150,0.6)' }}>
              Costs 3 Roses · Bypass the queue with a direct message
            </p>

            <textarea
              className="w-full rounded-xl p-4 resize-none h-28 mb-4 outline-none transition-all duration-300"
              placeholder="Write something heartfelt..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              maxLength={140}
              style={{
                background: 'var(--bg-deep)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(212,175,55,0.4)';
                e.target.style.background = 'rgba(212,175,55,0.03)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                e.target.style.background = 'rgba(255,255,255,0.04)';
              }}
            />
            <p className="text-xs text-right mb-4" style={{ color: 'rgba(120,80,100,0.5)' }}>
              {noteText.length}/140
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(180,120,150,0.7)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  swipeButton('right', activeProfileId, 'rose_message', noteText);
                  setNoteText('');
                }}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #7A0B2A, #E11D48)',
                  color: 'white',
                  border: '1px solid rgba(255,100,120,0.3)',
                  boxShadow: '0 6px 20px rgba(225,29,72,0.3)',
                }}
              >
                Send Note 🌹
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar />
    </div>
  );
}
