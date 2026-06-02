import React, { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { Heart, Clock, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-rose-50 flex flex-col pb-16 md:pb-0 md:ml-64 transition-all">
      <div className="p-4 bg-gradient-to-r from-red-900 via-rose-900 to-amber-900 shadow-md sticky top-0 z-10 border-b-2 border-amber-500">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-serif font-bold text-amber-300">My Interests</h1>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/50 h-24 rounded-2xl"></div>
              ))}
            </div>
          ) : interests.length === 0 ? (
            <div className="text-center text-rose-300 mt-20">
              <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>You haven't liked anyone yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interests.map((interest) => (
                <div key={interest.id} className="bg-white rounded-xl shadow-sm border border-rose-100 p-4 flex items-center gap-4 hover:shadow-md transition">
                  <img 
                    src={interest.users.photos && interest.users.photos.length > 0 ? interest.users.photos[0] : 'https://via.placeholder.com/150'} 
                    alt={interest.users.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-200"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-lg">{interest.users.name}, {interest.users.age}</h3>
                    <p className="text-sm text-slate-500">{interest.users.place}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    {interest.status === 'pending' ? (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Accepted
                      </span>
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
