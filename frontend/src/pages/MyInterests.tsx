import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { Heart, Clock, CheckCircle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Interest {
  id: string;
  status: string;
  users: {
    id: string;
    name: string;
    age: number;
    photos: string[];
    place: string;
    face_verified?: boolean;
  };
}

export default function MyInterests() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    <div className="min-h-screen flex flex-col pt-16 bg-transparent font-sans text-[#1D1D1F]">
      
      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          


          {/* Skeleton loading state */}
          {loading ? (
            <div className="space-y-3 mt-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden shimmer-skeleton bg-neutral-50 border border-neutral-150"
                  style={{
                    height: '88px',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          ) : interests.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeUp">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-neutral-100 border border-neutral-200">
                <Heart className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="text-lg font-bold text-black tracking-tight mb-1">
                No interests yet
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                Send likes to compatible profiles in Discover feed to start matching.
              </p>
              <button
                onClick={() => navigate('/discover')}
                className="mt-6 px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-full shadow-sm transition-all"
              >
                Find Matches
              </button>
            </div>
          ) : (
            /* Interests List Cards */
            <div className="space-y-3 mt-4">
              {interests.map((interest, i) => (
                <div
                  key={interest.id}
                  className="rounded-3xl overflow-hidden flex items-center gap-4 p-4 border border-[#5C3A21]/20 bg-white/40 backdrop-blur-md hover:bg-white/60 hover:shadow-md transition-all duration-200 text-left cursor-default animate-fadeUp"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={interest.users.photos && interest.users.photos.length > 0 ? interest.users.photos[0] : 'https://via.placeholder.com/150'}
                      alt={interest.users.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-[#5C3A21]/20"
                    />
                    {/* Level 1 checkmark badge on avatar */}
                    {interest.users.face_verified && (
                      <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-[#0071E3] text-white rounded-full flex items-center justify-center border border-white text-[8px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-sm text-[#2C2825] truncate flex items-center gap-1.5">
                      {interest.users.name}, <span className="font-normal text-[#5C5245]">{interest.users.age}</span>
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-[#7A6B5D] font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#7A6B5D]" />
                      <span className="text-xs truncate">{interest.users.place}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {interest.status === 'pending' ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/50 border border-[#5C3A21]/20 text-[#7A6B5D]">
                        <Clock className="w-3 h-3 text-[#7A6B5D]" />
                        Pending
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 border border-green-500/30 text-green-700">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        Matched
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
