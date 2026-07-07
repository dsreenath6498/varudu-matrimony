import { useEffect, useState, useRef } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { MapPin, Info, LogOut, MessageSquareHeart, X, Heart, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface FamilyDetails {
  father_name?: string;
  father_job?: string;
  father_expired?: boolean;
  mother_name?: string;
  mother_job?: string;
  mother_expired?: boolean;
  family_type?: string;
  family_status?: string;
  brothers?: number;
  sisters?: number;
}

interface Profile {
  id: string;
  name: string;
  age: number;
  place: string;
  photos: string[];
  face_verified?: boolean;
  phone_visible?: boolean;
  phone_unlocked?: boolean;
  phone_number?: string | null;
  dob?: string;
  tob?: string;
  pob?: string;
  family_details?: FamilyDetails;
}

export default function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'stack' | 'reels'>('reels');
  const [photoIndices, setPhotoIndices] = useState<Record<string, number>>({});
  
  // Custom interaction states for animations
  const [likedProfiles, setLikedProfiles] = useState<Record<string, boolean>>({});
  const [passedProfiles, setPassedProfiles] = useState<Record<string, boolean>>({});
  const [likedHearts, setLikedHearts] = useState<Record<string, boolean>>({});
  
  // Details slide-out / drawer states
  const [activeShowMoreProfileId, setActiveShowMoreProfileId] = useState<string | null>(null);
  const [unlockedPhones, setUnlockedPhones] = useState<Record<string, string>>({});
  const [unlockLoadingId, setUnlockLoadingId] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extract query filters
  const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();
  const minAge = parseInt(searchParams.get('minAge') || '18');
  const maxAge = parseInt(searchParams.get('maxAge') || '60');
  const selectedCity = (searchParams.get('city') || '').trim().toLowerCase();
  const isFiltering = !!(searchQuery || minAge > 18 || maxAge < 60 || selectedCity);

  const pendingInteraction = useRef({ type: 'standard', message: null as string | null });

  // Note Modal States
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

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

  const executeInteraction = async (dir: 'left' | 'right', profileId: string, type = 'standard', message: string | null = null) => {
    pendingInteraction.current = { type, message };
    
    // Close detail drawer if active
    if (activeShowMoreProfileId === profileId) {
      setActiveShowMoreProfileId(null);
    }

    // Set immediate visual state
    if (dir === 'right') {
      setLikedProfiles(prev => ({ ...prev, [profileId]: true }));
    } else {
      setPassedProfiles(prev => ({ ...prev, [profileId]: true }));
    }

    // Trigger API call
    await swiped(dir, profileId);
    
    // Animate out of list
    setTimeout(() => {
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      // Clean states
      setLikedProfiles(prev => { const copy = { ...prev }; delete copy[profileId]; return copy; });
      setPassedProfiles(prev => { const copy = { ...prev }; delete copy[profileId]; return copy; });
    }, 600);
  };

  const handleUnlockPhone = async (targetUserId: string) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    setUnlockLoadingId(targetUserId);
    try {
      const res = await api.post('/profile/unlock-phone', {
        userId: user.id,
        targetUserId
      });
      if (res.data.success) {
        setUnlockedPhones(prev => ({ ...prev, [targetUserId]: res.data.phoneNumber }));
        
        // Also update profiles local array
        setProfiles(prev => prev.map(p => {
          if (p.id === targetUserId) {
            return { ...p, phone_unlocked: true, phone_number: res.data.phoneNumber };
          }
          return p;
        }));

        window.dispatchEvent(new Event('rose_balance_updated'));
        alert('Phone number unlocked successfully!');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to unlock phone number');
    } finally {
      setUnlockLoadingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNoteClick = (profileId: string) => {
    setActiveProfileId(profileId);
    setShowNoteModal(true);
  };

  // Photo gallery slider logic
  const handlePrevPhoto = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndices(prev => ({
      ...prev,
      [profileId]: Math.max((prev[profileId] || 0) - 1, 0)
    }));
  };

  const handleNextPhoto = (profileId: string, maxPhotos: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndices(prev => ({
      ...prev,
      [profileId]: Math.min((prev[profileId] || 0) + 1, maxPhotos - 1)
    }));
  };

  // Reels double click logic
  const handleReelDoubleClick = (profileId: string) => {
    // Trigger heart-pop animation
    setLikedHearts(prev => ({ ...prev, [profileId]: true }));
    setTimeout(() => {
      setLikedHearts(prev => ({ ...prev, [profileId]: false }));
    }, 800);

    // Call right swipe (Like)
    executeInteraction('right', profileId);
  };

  // Filter profiles based on search and advanced options
  const filteredProfiles = profiles.filter(profile => {
    // 1. Search Query filter (matches name or location)
    if (searchQuery) {
      const name = (profile.name || '').toLowerCase();
      const place = (profile.place || '').toLowerCase();
      if (!name.includes(searchQuery) && !place.includes(searchQuery)) {
        return false;
      }
    }

    // 2. Age Range filter
    if (profile.age < minAge || profile.age > maxAge) {
      return false;
    }

    // 3. City filter
    if (selectedCity) {
      const place = (profile.place || '').toLowerCase();
      if (!place.includes(selectedCity)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col md:ml-44 bg-white overflow-x-hidden">
      
      {/* ── HEADER (Shown only in Stack View mode) ── */}
      {viewMode === 'stack' && (
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-30 bg-white border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-1 rounded-full hover:bg-neutral-150 text-neutral-800 transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold tracking-tight text-neutral-900">Discover</h2>
          </div>

          <div className="bg-neutral-100 p-0.5 rounded-full flex border border-neutral-200/80">
            <button
              onClick={() => { setViewMode('stack'); setActiveShowMoreProfileId(null); }}
              className="bg-white text-black shadow-sm px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
            >
              Stack
            </button>
            <button
              onClick={() => { setViewMode('reels'); setActiveShowMoreProfileId(null); }}
              className="text-neutral-500 hover:text-neutral-800 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
            >
              Reels
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-all font-sans text-[11px] border border-neutral-200/80"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      )}

      {/* Swipe Direction Alert Overlays */}
      {swipeDirection && (
        <div
          className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
          style={{
            background: swipeDirection === 'right'
              ? 'radial-gradient(circle at center, rgba(0,113,227,0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(0,0,0,0.05) 0%, transparent 70%)',
            animation: 'fadeIn 0.1s ease both',
          }}
        >
          <div
            className="rounded-full p-6 bg-white/90 shadow-lg border border-neutral-100"
            style={{
              animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            {swipeDirection === 'right' ? (
              <Heart className="w-12 h-12 text-[#0071E3] fill-current" />
            ) : (
              <X className="w-12 h-12 text-neutral-400" />
            )}
          </div>
        </div>
      )}

      {/* Content Feed Layout */}
      <div className="flex-1 flex flex-col items-center justify-center p-0 md:p-4 w-full">
        
        {/* Stack Mode: Clear Filters Banner */}
        {viewMode === 'stack' && isFiltering && !loading && (
          <div className="w-full max-w-[480px] px-5 py-3 mt-4 bg-neutral-50 border border-neutral-200/50 rounded-2xl flex justify-between items-center text-xs font-semibold text-neutral-600 animate-fadeUp">
            <span className="flex items-center gap-1.5">
              🔍 Filtering Active
            </span>
            <button
              onClick={() => navigate('/discover')}
              className="text-[#0071E3] font-bold hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-3 font-sans">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black text-white animate-spin">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs text-neutral-500 font-medium tracking-wide">
              Finding compatible profiles...
            </p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center p-8 flex flex-col items-center font-sans max-w-sm animate-fadeUp">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-neutral-100 border border-neutral-200">
              <Heart className="w-5 h-5 text-neutral-800" />
            </div>
            <h2 className="text-xl font-bold mb-1 text-neutral-900 tracking-tight">
              {isFiltering ? 'No matching profiles' : "You're all caught up!"}
            </h2>
            <p className="text-xs leading-relaxed text-neutral-500">
              {isFiltering 
                ? "No profiles match your search criteria. Try modifying or clearing your filters."
                : "We've finished showing all matching profiles. Check back later for new entries."}
            </p>
            {isFiltering && (
              <button
                onClick={() => navigate('/discover')}
                className="mt-4 px-5 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-neutral-900 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : viewMode === 'stack' ? (
          /* ── STACK VIEW (Horizontal Capsule List) ── */
          <div className="w-full max-w-[480px] space-y-4 py-4 px-3 md:px-0 pb-24 md:pb-4">
            {filteredProfiles.map((profile) => {
              const isLiked = likedProfiles[profile.id];
              const isPassed = passedProfiles[profile.id];
              const isShowMore = activeShowMoreProfileId === profile.id;

              return (
                <div
                  key={profile.id}
                  className="rounded-3xl md:rounded-full bg-white border border-neutral-200/80 shadow-[0_4px_15px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 relative flex h-[140px] md:h-[88px] items-center"
                  style={{
                    opacity: (isLiked || isPassed) ? 0 : 1,
                    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
                  }}
                >
                  {/* Sliding Inner Container */}
                  <div
                    className="w-full h-full flex transition-transform duration-300 relative"
                    style={{
                      transform: isShowMore ? 'translateX(-50%)' : 'translateX(0)',
                    }}
                  >
                    {/* Main Capsule Item Card */}
                    <div className="w-full h-full flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between px-4 py-3 relative text-left">
                      
                      {/* Left: Round Avatar & details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-14 h-14 rounded-full overflow-hidden object-cover flex-shrink-0 border border-neutral-100 relative">
                          <img
                            src={profile.photos && profile.photos.length > 0 ? profile.photos[0] : 'https://via.placeholder.com/150'}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                          />
                          {profile.face_verified && (
                            <span className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-[#0071E3] text-white rounded-full flex items-center justify-center border border-white text-[8px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        {/* Center: Details */}
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-neutral-900 truncate">
                            {profile.name}, <span className="font-normal text-neutral-500">{profile.age}</span>
                          </h4>
                          <p className="text-[10px] text-neutral-400 font-medium truncate flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-neutral-300" />
                            {profile.place}
                          </p>
                        </div>
                      </div>

                      {/* Right: Quick Action Buttons */}
                      <div className="flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveShowMoreProfileId(profile.id); }}
                          className="w-9 h-9 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 flex items-center justify-center text-neutral-600 transition-colors"
                          title="View Info"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => executeInteraction('left', profile.id)}
                          className="w-9 h-9 rounded-full border border-neutral-200/80 flex items-center justify-center text-neutral-400 hover:text-black hover:border-black hover:bg-neutral-50 transition-all"
                          title="Pass"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleNoteClick(profile.id)}
                          className="w-9 h-9 rounded-full border border-neutral-200/80 flex items-center justify-center text-neutral-400 hover:text-black hover:border-black hover:bg-neutral-50 transition-all relative"
                          title="Note"
                        >
                          <MessageSquareHeart className="w-3.5 h-3.5 text-neutral-600" />
                        </button>

                        <button
                          onClick={() => executeInteraction('right', profile.id, 'rose')}
                          className="w-9 h-9 rounded-full border border-neutral-200/80 flex items-center justify-center hover:bg-neutral-50 transition-all relative text-xs"
                          title="Send Rose"
                        >
                          🌹
                        </button>

                        <button
                          onClick={() => executeInteraction('right', profile.id)}
                          className="w-10 h-10 rounded-full bg-black text-white hover:bg-neutral-900 transition-all flex items-center justify-center"
                          title="Like"
                        >
                          <Heart className="w-4.5 h-4.5 fill-current text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Details Drawer */}
                    <div
                      className="w-[50%] h-full flex-shrink-0 bg-white px-5 flex items-center justify-between absolute right-0 text-left transition-transform duration-300 z-20"
                      style={{
                        transform: isShowMore ? 'translateX(0)' : 'translateX(100%)',
                      }}
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-3 pr-2">
                        <div className="text-left leading-tight">
                          <h4 className="font-extrabold text-xs text-neutral-900 truncate">
                            {profile.name}, {profile.age} · {profile.place}
                          </h4>
                          {profile.dob && (
                            <p className="text-[9px] text-neutral-400 mt-0.5">
                              DOB: {profile.dob} {profile.tob ? `· TOB: ${profile.tob}` : ''}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-1.5">
                            {profile.phone_visible ? (
                              profile.phone_unlocked || unlockedPhones[profile.id] ? (
                                <span className="text-[9px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-150">
                                  📞 +91 {profile.phone_number || unlockedPhones[profile.id]}
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-neutral-500 font-bold bg-neutral-50 px-2 py-0.5 rounded-full border border-neutral-200">
                                    📞 Locked
                                  </span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleUnlockPhone(profile.id); }}
                                    disabled={unlockLoadingId === profile.id}
                                    className="px-2.5 py-1 bg-black text-white hover:bg-neutral-900 rounded-full text-[8px] font-bold uppercase tracking-wider transition-all flex items-center gap-0.5"
                                  >
                                    {unlockLoadingId === profile.id ? '...' : '🌹 Unlock (5)'}
                                  </button>
                                </div>
                              )
                            ) : (
                              <span className="text-[9px] text-neutral-400 font-medium italic">
                                Phone private
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveShowMoreProfileId(null); }}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all flex-shrink-0"
                      >
                        Back
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── REELS VIEW (Instagram Full Screen Snap-Scroll) ── */
          <div
            className="w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar bg-black
                       fixed inset-0 h-screen w-screen z-40
                       md:relative md:inset-auto md:w-full md:max-w-[420px] md:h-[75vh] md:max-h-[720px] md:rounded-[32px] md:border md:border-neutral-200/80 md:shadow-[0_12px_40px_rgba(0,0,0,0.06)] md:z-auto"
          >
            {/* ── TOP LEFT BACK BUTTON ── */}
            <button
              onClick={() => navigate('/')}
              className="absolute top-6 left-6 z-50 bg-black/35 text-white border border-white/10 hover:bg-black/50 backdrop-blur-md px-3 py-3 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95"
              title="Back to Welcome Page"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* ── FLOATING VIEW SWITCHER (STACK / REELS) ── */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-black/35 backdrop-blur-md px-1 py-1 rounded-full flex border border-white/10 shadow-sm opacity-80 hover:opacity-100 transition-all duration-200">
              <button
                onClick={() => { setViewMode('stack'); setActiveShowMoreProfileId(null); }}
                className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 text-white/50 hover:text-white"
              >
                Stack
              </button>
              <button
                className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 bg-white/20 text-white shadow-sm"
              >
                Reels
              </button>
            </div>

            {/* ── FLOATING "CLEAR FILTERS" BADGE ── */}
            {isFiltering && (
              <div
                onClick={() => navigate('/discover')}
                className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[10px] font-extrabold tracking-wider uppercase transition-all duration-200 shadow-md flex items-center gap-1 cursor-pointer active:scale-95 select-none"
                title="Showing Filtered Profiles. Click to Clear Filters."
              >
                Filtered ✕
              </div>
            )}

            {filteredProfiles.map((profile) => {
              const currentPhotoIdx = photoIndices[profile.id] || 0;
              const isLiked = likedProfiles[profile.id];
              const isHeartPopped = likedHearts[profile.id];
              const isShowMore = activeShowMoreProfileId === profile.id;

              return (
                <div
                  key={profile.id}
                  onDoubleClick={() => !isShowMore && handleReelDoubleClick(profile.id)}
                  className="snap-start snap-always h-full w-full relative flex shrink-0 overflow-hidden select-none bg-black md:rounded-[32px]"
                >
                  <div
                    className="w-full h-full flex transition-transform duration-300 relative"
                    style={{
                      transform: isShowMore ? 'translateX(-50%)' : 'translateX(0)',
                    }}
                  >
                    {/* Reel Main View */}
                    <div className="w-full h-full flex-shrink-0 relative">
                      {/* Reel Image Background */}
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                        style={{
                          backgroundImage: `url("${profile.photos && profile.photos.length > 0 ? profile.photos[currentPhotoIdx] : 'https://via.placeholder.com/600x800?text=No+Photo'}")`,
                        }}
                      />

                      {/* Gradient Vignettes */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/90 pointer-events-none" />

                      {/* Double Click Heart Overlay Animation */}
                      {isHeartPopped && (
                        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                          <Heart className="w-24 h-24 text-white fill-white animate-heartPop" />
                        </div>
                      )}

                      {/* Liked Overlay Banner */}
                      {isLiked && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-30 pointer-events-none animate-fadeIn">
                          <Heart className="w-12 h-12 text-[#0071E3] fill-[#0071E3] animate-bounce" />
                          <p className="text-white text-xs font-bold tracking-widest uppercase mt-2">Liked 🌹</p>
                        </div>
                      )}

                      {/* Photo Carousel Indicators */}
                      {profile.photos && profile.photos.length > 1 && (
                        <div className="absolute top-18 left-4 right-4 flex gap-1 z-20">
                          {profile.photos.map((_, pIdx) => (
                            <div
                              key={pIdx}
                              className="h-1 flex-1 rounded-full transition-all"
                              style={{
                                background: pIdx === currentPhotoIdx ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)',
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Carousel Tap Navigate Zones */}
                      {profile.photos && profile.photos.length > 1 && (
                        <>
                          <div
                            className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
                            onClick={(e) => handlePrevPhoto(profile.id, e)}
                          />
                          <div
                            className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-pointer"
                            onClick={(e) => handleNextPhoto(profile.id, profile.photos.length, e)}
                          />
                        </>
                      )}

                      {/* Bottom Metadata Details */}
                      <div className="absolute bottom-6 left-4 right-16 z-20 flex flex-col pointer-events-none font-sans text-left pb-12 md:pb-0">
                        <h3 className="font-extrabold text-2xl text-white tracking-tight flex items-center gap-1.5">
                          {profile.name}, <span className="font-normal text-white/80">{profile.age}</span>
                          {profile.face_verified && (
                            <span className="inline-flex items-center justify-center bg-[#0071E3] text-white rounded-full p-0.5" style={{ width: '16px', height: '16px' }} title="Verified User">
                              <svg className="w-2.5 h-2.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-white/90">
                          <MapPin className="w-3.5 h-3.5 text-white/70" />
                          <span className="text-xs font-semibold">{profile.place}</span>
                        </div>

                        <p className="text-[10px] text-white/60 font-semibold tracking-wider uppercase mt-4">
                          💡 Double-click image to Like
                        </p>
                      </div>

                      {/* Right Side Vertical Action Buttons */}
                      <div className="absolute right-3 bottom-6 z-20 flex flex-col gap-3.5 items-center pb-12 md:pb-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveShowMoreProfileId(profile.id); }}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/10 text-white border border-white/10 hover:bg-white/20 backdrop-blur-md"
                        >
                          <Info className="w-4.5 h-4.5" />
                        </button>

                        <button
                          onClick={() => executeInteraction('left', profile.id)}
                          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-md"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => executeInteraction('right', profile.id)}
                          className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-md"
                        >
                          <Heart className="w-4.5 h-4.5 fill-current text-black" />
                        </button>

                        <button
                          onClick={() => executeInteraction('right', profile.id, 'rose')}
                          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-md relative"
                        >
                          <span className="text-base select-none">🌹</span>
                        </button>

                        <button
                          onClick={() => handleNoteClick(profile.id)}
                          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-md relative"
                        >
                          <MessageSquareHeart className="w-4.5 h-4.5 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Reels Details Panel Drawer */}
                    <div
                      className="w-[50%] h-full flex-shrink-0 bg-white border-l border-neutral-200/80 p-5 flex flex-col justify-between absolute right-0 text-left transition-transform duration-300 z-30"
                      style={{
                        transform: isShowMore ? 'translateX(0)' : 'translateX(100%)',
                      }}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveShowMoreProfileId(null); }}
                        className="absolute top-4 right-4 w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex-1 mt-6 overflow-y-auto space-y-4 pr-1 no-scrollbar text-xs">
                        <div>
                          <h4 className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">About</h4>
                          <p className="text-xs text-neutral-800 font-bold mt-1">
                            Name: {profile.name}
                          </p>
                          <p className="text-xs text-neutral-600 mt-0.5">
                            Age: {profile.age} · {profile.place}
                          </p>
                        </div>

                        {profile.face_verified && (
                          <div className="flex items-center gap-1.5 p-2 bg-blue-50 border border-blue-100 rounded-xl">
                            <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
                            <span className="text-[8px] font-bold text-[#0071E3] uppercase tracking-wider">Face Verified</span>
                          </div>
                        )}

                        {(profile.dob || profile.tob || profile.pob) && (
                          <div>
                            <h4 className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Birth Astro</h4>
                            <div className="space-y-1 mt-1 text-[11px] text-neutral-700">
                              {profile.dob && <p>📅 DOB: {profile.dob}</p>}
                              {profile.tob && <p>⏰ TOB: {profile.tob}</p>}
                              {profile.pob && <p>📍 POB: {profile.pob}</p>}
                            </div>
                          </div>
                        )}

                        {profile.family_details && Object.keys(profile.family_details).length > 0 && (
                          <div>
                            <h4 className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Family</h4>
                            <div className="space-y-1 mt-1 text-[11px] text-neutral-700">
                              {profile.family_details.father_name && <p>👨 Father: {profile.family_details.father_name}</p>}
                              {profile.family_details.mother_name && <p>👩 Mother: {profile.family_details.mother_name}</p>}
                            </div>
                          </div>
                        )}

                        {profile.phone_visible ? (
                          profile.phone_unlocked || unlockedPhones[profile.id] ? (
                            <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                              <p className="text-[8px] text-green-700 font-bold uppercase tracking-wider">Phone Number</p>
                              <p className="text-xs font-extrabold text-green-805 mt-0.5">
                                +91 {profile.phone_number || unlockedPhones[profile.id]}
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl">
                              <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">Phone (Locked)</p>
                              <p className="text-[10px] font-bold text-neutral-700 mt-1">
                                +91 ••••• •••••
                              </p>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUnlockPhone(profile.id); }}
                                disabled={unlockLoadingId === profile.id}
                                className="w-full mt-2 py-1.5 bg-black text-white hover:bg-neutral-900 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                              >
                                {unlockLoadingId === profile.id ? 'Unlocking...' : '🌹 Unlock (5)'}
                              </button>
                            </div>
                          )
                        ) : (
                          <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                            <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">Phone Number</p>
                            <p className="text-[10px] text-neutral-500 font-medium mt-1">
                              Not shared by user
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note Sender Modal Overlay */}
      {showNoteModal && activeProfileId && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNoteModal(false); }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 relative overflow-hidden bg-white border border-neutral-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.15)] font-sans"
          >
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2 text-neutral-900 font-sans">
              <span>🌹</span>
              Send a Note
            </h3>
            <p className="text-xs mb-4 text-neutral-500 font-sans">
              Costs 3 Roses · Bypass the queue with a direct message
            </p>

            <textarea
              className="w-full rounded-xl p-3 resize-none h-24 mb-4 outline-none transition-all duration-200 bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm font-sans"
              placeholder="Write something heartfelt..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              maxLength={140}
            />
            <p className="text-xs text-right mb-4 text-neutral-400 font-sans">
              {noteText.length}/140
            </p>

            <div className="flex gap-3 font-sans">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 py-2.5 rounded-full font-medium text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  executeInteraction('right', activeProfileId, 'rose_message', noteText);
                  setNoteText('');
                }}
                className="flex-1 py-2.5 rounded-full font-medium text-xs bg-black hover:bg-neutral-900 text-white transition-all"
              >
                Send Note 🌹
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar hideMobileBottom={viewMode === 'reels'} />
    </div>
  );
}
