import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { UserPlus, MapPin, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Request {
  id: string;
  status: string;
  interaction_type: string;
  attached_message: string;
  users: {
    id: string;
    name: string;
    age: number;
    photos: string[];
    place: string;
  };
}

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roses' | 'standard'>('roses');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    try {
      const response = await api.get('/interactions/requests', {
        params: { userId: user.id }
      });
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching requests', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (interestId: string) => {
    setAcceptingId(interestId);
    try {
      await api.post('/interactions/accept', { interestId });
      setRequests(requests.filter(req => req.id !== interestId));
      navigate('/chat');
    } catch (error) {
      alert('Error accepting request');
    } finally {
      setAcceptingId(null);
    }
  };

  const displayedRequests = requests.filter(req => {
    if (activeTab === 'roses') {
      return req.interaction_type === 'rose' || req.interaction_type === 'rose_message';
    } else {
      return req.interaction_type === 'standard' || !req.interaction_type;
    }
  });

  const roseCount = requests.filter(r => r.interaction_type === 'rose' || r.interaction_type === 'rose_message').length;
  const standardCount = requests.filter(r => r.interaction_type === 'standard' || !r.interaction_type).length;

  return (
    <div
      className="min-h-screen flex flex-col pb-24 md:pb-0 md:ml-64 transition-all"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <h1
            className="text-2xl font-bold mb-4"
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              background: 'linear-gradient(135deg, #FFD700, #D4AF37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Requests
          </h1>

          {/* Premium Tab Switcher */}
          <div
            className="relative flex p-1 rounded-2xl"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
            }}
          >
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-xl transition-all duration-300"
              style={{
                left: activeTab === 'roses' ? '4px' : 'calc(50% + 4px)',
                width: 'calc(50% - 8px)',
                background: activeTab === 'roses'
                  ? 'linear-gradient(135deg, rgba(212,138,133,0.25), rgba(181,101,93,0.15))'
                  : 'var(--bg-surface)',
                border: activeTab === 'roses'
                  ? '1px solid rgba(212,138,133,0.3)'
                  : '1px solid var(--glass-border)',
                boxShadow: activeTab === 'roses' ? '0 0 20px rgba(225,29,72,0.2)' : 'none',
              }}
            />

            <button
              onClick={() => setActiveTab('roses')}
              className="relative flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 z-10"
              style={{
                color: activeTab === 'roses' ? '#FDA4AF' : 'rgba(180,120,150,0.4)',
              }}
            >
              <span style={{ fontSize: '14px' }}>🌹</span>
              The Rose Room
              {roseCount > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: 'rgba(225,29,72,0.3)',
                    color: '#FDA4AF',
                  }}
                >
                  {roseCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('standard')}
              className="relative flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 z-10"
              style={{
                color: activeTab === 'standard' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Standard
              {standardCount > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,248,240,0.6)',
                  }}
                >
                  {standardCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="space-y-3 mt-4">
              {[1, 2].map(i => (
                <div key={i} className="rounded-2xl shimmer-skeleton" style={{ height: '120px' }} />
              ))}
            </div>
          ) : displayedRequests.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center mt-24 text-center"
              style={{ animation: 'fadeUp 0.6s ease both' }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(225,29,72,0.07)',
                  border: '1px solid rgba(225,29,72,0.12)',
                }}
              >
                <span style={{ fontSize: '32px', opacity: 0.4 }}>
                  {activeTab === 'roses' ? '🌹' : '👋'}
                </span>
              </div>
              <p
                className="text-lg font-semibold"
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  color: 'rgba(255,248,240,0.35)',
                }}
              >
                No {activeTab} requests yet
              </p>
              {activeTab === 'roses' && (
                <p className="text-sm mt-1" style={{ color: 'rgba(180,120,150,0.3)' }}>
                  Premium matches will appear here
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {displayedRequests.map((req, i) => {
                const isRose = req.interaction_type === 'rose';
                const isRoseMsg = req.interaction_type === 'rose_message';
                const hasPremium = isRose || isRoseMsg;

                return (
                  <div
                    key={req.id}
                    className="rounded-2xl p-4 transition-all duration-300"
                    style={{
                      background: hasPremium
                        ? 'linear-gradient(135deg, rgba(212,138,133,0.08), rgba(168,134,85,0.05))'
                        : 'var(--glass-bg)',
                      border: hasPremium
                        ? '1px solid rgba(168,134,85,0.2)'
                        : '1px solid var(--glass-border)',
                      boxShadow: hasPremium
                        ? '0 8px 30px rgba(212,138,133,0.1), inset 0 1px 0 rgba(168,134,85,0.05)'
                        : 'var(--shadow-card)',
                      animation: `fadeUp 0.5s ${i * 0.08}s ease both`,
                      opacity: 0,
                    }}
                  >
                    {/* Premium badge */}
                    {hasPremium && (
                      <div
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
                        style={{
                          background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(225,29,72,0.15))',
                          border: '1px solid rgba(212,175,55,0.3)',
                          color: '#D4AF37',
                          animation: 'borderShimmer 2.5s ease-in-out infinite',
                        }}
                      >
                        <span>🌹</span>
                        {isRoseMsg ? 'Rose & Note' : 'Sent you a Rose!'}
                      </div>
                    )}

                    {/* Profile row */}
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={req.users.photos[0] || 'https://via.placeholder.com/150'}
                        alt={req.users.name}
                        className="rounded-xl object-cover flex-shrink-0"
                        style={{
                          width: '60px',
                          height: '60px',
                          border: hasPremium ? '2px solid rgba(212,175,55,0.4)' : '2px solid rgba(255,255,255,0.06)',
                        }}
                      />
                      <div className="min-w-0">
                        <h3
                          className="font-semibold text-base"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {req.users.name}, {req.users.age}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(180,120,150,0.5)' }} />
                          <span className="text-xs" style={{ color: 'rgba(180,120,150,0.5)' }}>
                            {req.users.place}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Attached message */}
                    {isRoseMsg && req.attached_message && (
                      <div
                        className="mb-3 p-3 rounded-xl italic text-sm"
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--text-primary)',
                          fontFamily: '"Cormorant Garamond", serif',
                          fontSize: '15px',
                        }}
                      >
                        "{req.attached_message}"
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(req.id)}
                        disabled={acceptingId === req.id}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
                        style={hasPremium ? {
                          background: 'linear-gradient(135deg, #7A0B2A, #E11D48)',
                          color: 'white',
                          border: '1px solid rgba(255,100,120,0.3)',
                          boxShadow: '0 6px 20px rgba(225,29,72,0.3)',
                        } : {
                          background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))',
                          color: '#4ADE80',
                          border: '1px solid rgba(34,197,94,0.3)',
                        }}
                      >
                        {acceptingId === req.id ? (
                          <span
                            className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full"
                            style={{ animation: 'spinSlow 0.8s linear infinite' }}
                          />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: 'rgba(180,120,150,0.5)',
                        }}
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Navbar />
    </div>
  );
}
