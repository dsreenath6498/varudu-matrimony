import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { Heart, Clock, CheckCircle, MapPin, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col pb-24 md:pb-0 md:ml-44 bg-white font-sans text-[#1D1D1F]">
      
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-white border-b border-neutral-150">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="rounded-full p-2.5 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                My Interests
              </h1>
              {!loading && interests.length > 0 && (
                <p className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider mt-0.5">
                  {interests.length} profile{interests.length !== 1 ? 's' : ''} liked
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

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
                  className="rounded-2xl overflow-hidden flex items-center gap-4 p-4 border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 text-left cursor-default animate-fadeUp"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={interest.users.photos && interest.users.photos.length > 0 ? interest.users.photos[0] : 'https://via.placeholder.com/150'}
                      alt={interest.users.name}
                      className="w-14 h-14 rounded-xl object-cover border border-neutral-150"
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
                    <h3 className="font-extrabold text-sm text-neutral-900 truncate flex items-center gap-1.5">
                      {interest.users.name}, <span className="font-normal text-neutral-500">{interest.users.age}</span>
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-neutral-400 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-neutral-300" />
                      <span className="text-xs truncate">{interest.users.place}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {interest.status === 'pending' ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-50 border border-neutral-200/50 text-neutral-500">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        Pending
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 border border-blue-100 text-[#0071E3]">
                        <CheckCircle className="w-3 h-3" />
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
