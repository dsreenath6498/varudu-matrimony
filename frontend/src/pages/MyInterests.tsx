import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { Heart, Clock, CheckCircle, MapPin } from 'lucide-react';

interface Interest {
  id: string;
  status: string;
  users: {
    id: string;
    name: string;
    age: number;
    photos: string[];
    place: string;
  };
}

export default function MyInterests() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterests = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      try {
        const response = await api.get('/interactions/my-interests', {
          params: { userId: user.id }
        });
        setInterests(response.data.interests);
      } catch (error) {
        console.error('Error fetching interests', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInterests();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col pb-24 md:pb-0 md:ml-64 transition-all"
      style={{ background: '#050005' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4"
        style={{
          background: 'rgba(5,0,5,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #7A0B2A, #E11D48)',
                boxShadow: '0 0 12px rgba(225,29,72,0.4)',
              }}
            >
              <Heart className="w-4 h-4 text-white fill-current" />
            </div>
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
              My Interests
            </h1>
          </div>
          {!loading && interests.length > 0 && (
            <p
              className="text-xs mt-0.5 ml-11"
              style={{ color: 'rgba(180,120,150,0.5)' }}
            >
              {interests.length} profile{interests.length !== 1 ? 's' : ''} you liked
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="space-y-3 mt-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden shimmer-skeleton"
                  style={{
                    height: '88px',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          ) : interests.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center mt-24 text-center"
              style={{ animation: 'fadeUp 0.6s ease both' }}
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
                style={{
                  background: 'rgba(225,29,72,0.07)',
                  border: '1px solid rgba(225,29,72,0.15)',
                  animation: 'pulseGlow 3s ease-in-out infinite',
                }}
              >
                <Heart className="w-10 h-10" style={{ color: 'rgba(225,29,72,0.4)' }} />
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  color: 'rgba(255,248,240,0.5)',
                }}
              >
                No interests yet
              </h3>
              <p className="text-sm" style={{ color: 'rgba(180,120,150,0.4)' }}>
                Go discover and like some profiles!
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {interests.map((interest, i) => (
                <div
                  key={interest.id}
                  className="rounded-2xl overflow-hidden flex items-center gap-4 p-4 transition-all duration-300 hover:scale-[1.01] cursor-default"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    animation: `fadeUp 0.5s ${i * 0.07}s ease both`,
                    opacity: 0,
                  }}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={interest.users.photos && interest.users.photos.length > 0 ? interest.users.photos[0] : 'https://via.placeholder.com/150'}
                      alt={interest.users.name}
                      className="w-16 h-16 rounded-xl object-cover"
                      style={{
                        border: interest.status === 'accepted'
                          ? '2px solid rgba(212,175,55,0.6)'
                          : '2px solid rgba(255,255,255,0.06)',
                      }}
                    />
                    {/* Status dot */}
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{
                        background: interest.status === 'accepted' ? '#22C55E' : '#F59E0B',
                        borderColor: '#050005',
                        boxShadow: interest.status === 'accepted'
                          ? '0 0 8px rgba(34,197,94,0.5)'
                          : '0 0 8px rgba(245,158,11,0.5)',
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-base truncate"
                      style={{ color: '#FFF8F0' }}
                    >
                      {interest.users.name}, {interest.users.age}
                    </h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(180,120,150,0.5)' }} />
                      <span className="text-xs truncate" style={{ color: 'rgba(180,120,150,0.5)' }}>
                        {interest.users.place}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {interest.status === 'pending' ? (
                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style={{
                          background: 'rgba(245,158,11,0.1)',
                          border: '1px solid rgba(245,158,11,0.25)',
                          color: '#F59E0B',
                        }}
                      >
                        <Clock className="w-3 h-3" />
                        Pending
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style={{
                          background: 'rgba(34,197,94,0.1)',
                          border: '1px solid rgba(34,197,94,0.25)',
                          color: '#4ADE80',
                          boxShadow: '0 0 12px rgba(34,197,94,0.15)',
                        }}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Accepted
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Navbar />
    </div>
  );
}
