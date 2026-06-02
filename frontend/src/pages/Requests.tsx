import React, { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { UserPlus, Flower2 } from 'lucide-react';
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
    try {
      await api.post('/interactions/accept', { interestId });
      // Remove from list
      setRequests(requests.filter(req => req.id !== interestId));
      // Navigate to chat
      navigate('/chat');
    } catch (error) {
      alert('Error accepting request');
    }
  };

  const displayedRequests = requests.filter(req => {
    if (activeTab === 'roses') {
      return req.interaction_type === 'rose' || req.interaction_type === 'rose_message';
    } else {
      return req.interaction_type === 'standard' || !req.interaction_type;
    }
  });

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col pb-16 md:pb-0 md:ml-64 transition-all">
      <div className="p-4 bg-gradient-to-r from-red-900 via-rose-900 to-amber-900 shadow-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-serif font-bold text-amber-300 mb-4">Requests</h1>
          
          {/* Toggle Switch */}
          <div className="flex bg-rose-950/50 p-1 rounded-2xl border border-rose-800/50">
            <button 
              onClick={() => setActiveTab('roses')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition ${
                activeTab === 'roses' ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow' : 'text-rose-300 hover:text-white'
              }`}
            >
              <Flower2 className="w-4 h-4" /> The Rose Room
            </button>
            <button 
              onClick={() => setActiveTab('standard')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition ${
                activeTab === 'standard' ? 'bg-white text-rose-900 shadow' : 'text-rose-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Standard ({requests.filter(r => r.interaction_type === 'standard' || !r.interaction_type).length})
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-white/50 h-32 rounded-2xl"></div>
              ))}
            </div>
          ) : displayedRequests.length === 0 ? (
            <div className="text-center text-rose-400 mt-20">
              <Flower2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-serif">No {activeTab} requests right now.</p>
              {activeTab === 'roses' && <p className="text-sm mt-2">Premium matches will appear here.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedRequests.map((req) => {
                const isRose = req.interaction_type === 'rose';
                const isRoseMsg = req.interaction_type === 'rose_message';
                const hasPremium = isRose || isRoseMsg;

                return (
                  <div key={req.id} className={`p-4 rounded-2xl shadow-sm transition ${
                    hasPremium 
                      ? 'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-500 shadow-red-200' 
                      : 'bg-white border border-rose-100 hover:shadow-md'
                  }`}>
                    {hasPremium && (
                      <div className="flex items-center gap-2 mb-3 bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full w-fit">
                        <Flower2 className="w-4 h-4 text-red-600" />
                        {isRoseMsg ? 'Sent you a Rose & Note!' : 'Sent you a Rose!'}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={req.users.photos[0] || 'https://via.placeholder.com/150'} 
                        alt={req.users.name}
                        className={`w-16 h-16 rounded-full object-cover border-2 ${hasPremium ? 'border-red-500' : 'border-amber-200'}`}
                      />
                      <div>
                        <h3 className="font-bold text-slate-800">{req.users.name}, {req.users.age}</h3>
                        <p className="text-sm text-slate-500">{req.users.place}</p>
                      </div>
                    </div>

                    {isRoseMsg && req.attached_message && (
                      <div className="mb-4 bg-white p-3 rounded-xl border border-red-200 text-slate-700 italic shadow-sm">
                        "{req.attached_message}"
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAccept(req.id)}
                        className={`flex-1 font-bold py-2 rounded-xl shadow transition flex items-center justify-center gap-2 ${
                          hasPremium
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:opacity-90'
                            : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-red-900 hover:shadow-md'
                        }`}
                      >
                        Accept
                      </button>
                      <button className="flex-1 bg-slate-100 text-slate-600 font-bold py-2 rounded-xl hover:bg-slate-200 transition">
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
