import React, { useEffect, useState } from 'react';
import TinderCard from 'react-tinder-card';
import api from '../api';
import Navbar from '../components/Navbar';
import { MapPin, Info, LogOut, MessageSquareHeart, Flower2, X, Heart } from 'lucide-react';
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
  const navigate = useNavigate();

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

  const swiped = async (direction: string, receiverId: string, interactionType = 'standard', attachedMessage = null) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    const isInterested = direction === 'right';

    try {
      await api.post('/interactions/swipe', {
        senderId: user.id,
        receiverId,
        isInterested,
        interactionType,
        attachedMessage
      });
      // Fire event so floating rose updates its balance
      if (interactionType !== 'standard') {
        window.dispatchEvent(new Event('rose_balance_updated'));
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error recording swipe');
      console.error('Error recording swipe', error);
    }
  };

  const outOfFrame = (name: string) => {
    console.log(name + ' left the screen!');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // State for the Note Modal
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
    <div className="min-h-screen bg-rose-50 flex flex-col md:ml-64 transition-all">
      <div className="p-4 bg-gradient-to-r from-red-900 via-rose-900 to-amber-900 shadow-md flex items-center justify-between sticky top-0 z-10 border-b-2 border-amber-500 md:hidden">
        <h1 className="text-2xl font-serif font-bold text-amber-300">Varudu</h1>
        <button onClick={handleLogout} className="text-amber-100 hover:text-amber-400 transition flex flex-col items-center">
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-semibold">Logout</span>
        </button>
      </div>
      
      {/* Desktop logout button since header is hidden */}
      <div className="hidden md:flex justify-end p-4 absolute top-0 right-0 z-20">
        <button onClick={handleLogout} className="text-rose-900 hover:text-rose-700 transition flex items-center gap-2 bg-white/50 px-4 py-2 rounded-xl backdrop-blur shadow-sm">
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Logout</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden relative min-h-[calc(100vh-4rem)] md:min-h-screen bg-black">
        {loading ? (
          <div className="animate-pulse flex flex-col items-center z-10">
            <Flower2 className="w-12 h-12 text-rose-500 mb-4 opacity-50" />
            <div className="text-rose-300 font-serif">Finding your perfect match...</div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center text-rose-300 z-10 p-8 flex flex-col items-center">
            <div className="w-24 h-24 bg-rose-900/50 rounded-full flex items-center justify-center mb-6 border border-rose-500/30 shadow-[0_0_30px_rgba(225,29,72,0.3)]">
              <Heart className="w-10 h-10 text-rose-400" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">You're all caught up!</h2>
            <p className="text-rose-200/80 max-w-sm">We're searching the stars for more compatible matches. Check back soon.</p>
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full">
            {profiles.map((profile) => (
              <TinderCard
                className="absolute w-full h-full swipe-card cursor-grab active:cursor-grabbing"
                key={profile.id}
                onSwipe={(dir) => swiped(dir, profile.id)}
                onCardLeftScreen={() => outOfFrame(profile.name)}
                preventSwipe={['up', 'down']}
              >
                <div 
                  className="w-full h-full relative bg-cover bg-center"
                  style={{ backgroundImage: `url(${profile.photos && profile.photos.length > 0 ? profile.photos[0] : 'https://via.placeholder.com/600x800?text=No+Photo'})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/90"></div>
                  
                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 pb-32 md:pb-40 text-amber-50">
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-lg mb-1">{profile.name}, {profile.age}</h2>
                        <div className="flex items-center text-amber-200/90 text-sm md:text-base font-medium">
                          <MapPin className="w-4 h-4 mr-1 text-amber-400" />
                          {profile.place}
                        </div>
                      </div>
                      <button className="bg-white/10 p-3 rounded-full backdrop-blur-md border border-white/20 hover:bg-white/20 transition shadow-lg">
                        <Info className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </TinderCard>
            ))}
          </div>
        )}
      </div>

      {/* Glassmorphism Floating Action Buttons */}
      <div className="fixed md:absolute bottom-20 md:bottom-12 left-0 right-0 flex justify-center gap-4 z-40 px-4 pointer-events-none">
        <div className="pointer-events-auto flex justify-center gap-4 items-center bg-black/20 backdrop-blur-xl p-3 md:p-4 rounded-full border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => {
              if(profiles.length > 0) swiped('left', profiles[profiles.length-1].id);
            }}
            className="bg-white/10 p-4 md:p-5 rounded-full border border-white/20 text-slate-300 hover:text-rose-400 hover:bg-white/20 hover:scale-110 transition-all"
          >
            <X className="w-7 h-7 md:w-8 md:h-8" />
          </button>
          
          <button 
            onClick={() => {
              if(profiles.length > 0) swiped('right', profiles[profiles.length-1].id, 'standard');
            }}
            className="bg-white/10 p-4 md:p-5 rounded-full border border-white/20 text-emerald-400 hover:text-emerald-300 hover:bg-white/20 hover:scale-110 transition-all"
          >
            <Heart className="w-7 h-7 md:w-8 md:h-8" />
          </button>
          
          <button 
            onClick={() => {
              if(profiles.length > 0) swiped('right', profiles[profiles.length-1].id, 'rose');
            }}
            className="bg-gradient-to-tr from-red-600 to-rose-400 p-4 md:p-5 rounded-full shadow-[0_0_20px_rgba(225,29,72,0.6)] text-white hover:scale-110 transition-all flex items-center justify-center relative group"
          >
            <Flower2 className="w-7 h-7 md:w-8 md:h-8 group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-2 -right-2 bg-amber-400 text-red-900 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full border-2 border-rose-600 shadow-sm">1</div>
          </button>

          <button 
            onClick={handleNoteClick}
            className="bg-gradient-to-tr from-amber-500 to-yellow-300 p-4 md:p-5 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] text-red-900 hover:scale-110 transition-all flex items-center justify-center relative group"
          >
            <MessageSquareHeart className="w-7 h-7 md:w-8 md:h-8 group-hover:-translate-y-1 transition-transform" />
            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full border-2 border-amber-500 shadow-sm">3</div>
          </button>
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && activeProfileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border-2 border-amber-300 relative">
            <h3 className="text-xl font-serif font-bold text-red-900 mb-2 flex items-center gap-2">
              <Flower2 className="w-5 h-5 text-amber-500" /> Send a Note
            </h3>
            <p className="text-sm text-slate-500 mb-4">Cost: 3 Roses. Bypass the queue and send a direct message with your request.</p>
            <textarea
              className="w-full bg-rose-50 border border-rose-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none h-24 mb-4 text-slate-700"
              placeholder="Write something romantic or funny..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              maxLength={140}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowNoteModal(false)}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowNoteModal(false);
                  swiped('right', activeProfileId, 'rose_message', noteText);
                  setNoteText('');
                }}
                className="flex-1 bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition shadow-lg"
              >
                Send Note
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar />
    </div>
  );
}
