import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { Send, ArrowLeft, Lock, Sparkles, Phone, X } from 'lucide-react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';

interface Match {
  matchId: string;
  myUnlockStatus: boolean;
  theirUnlockStatus: boolean;
  isFullyUnlocked: boolean;
  user: {
    id: string;
    name: string;
    photos: string[];
    face_verified?: boolean;
  };
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

export default function Chat() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMatches, setLoadingMatches] = useState(true);
  const { socket, clearUnread, setActiveMatchId } = useSocket();
  const { callUser } = useCall();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Astro matchmaking states
  const [showAstroModal, setShowAstroModal] = useState(false);
  const [astroLoading, setAstroLoading] = useState(false);
  const [astroData, setAstroData] = useState<any>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [astroError, setAstroError] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentUserStr = localStorage.getItem('user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (!currentUser) return;
    const fetchMatches = async () => {
      try {
        const response = await api.get('/chat/matches', { params: { userId: currentUser.id } });
        setMatches(response.data.matches);
      } catch (error) {
        console.error('Error fetching matches', error);
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchMatches();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const messageHandler = (data: any) => {
      if (activeMatch && data.matchId === activeMatch.matchId) {
        // If the message was sent by us, ignore the socket broadcast to prevent duplication (as we already added it optimistically)
        if (data.senderId === currentUser?.id) return;
        
        setMessages((prev) => [...prev, {
          id: data.id || Date.now().toString(),
          sender_id: data.senderId,
          receiver_id: data.receiverId,
          message: data.message,
          created_at: new Date().toISOString()
        }]);
      }
    };
    socket.on('receive_message', messageHandler);
    return () => { socket.off('receive_message', messageHandler); };
  }, [socket, activeMatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeMatch) setActiveMatchId(null);
  }, [activeMatch]);

  const openChat = async (match: Match) => {
    setActiveMatch(match);
    setActiveMatchId(match.matchId);
    clearUnread();
    socket?.emit('join_room', match.matchId);
    try {
      const response = await api.get('/chat/history', {
        params: { userId1: currentUser.id, userId2: match.user.id }
      });
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching chat history', error);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeMatch || !socket) return;
    const data = {
      matchId: activeMatch.matchId,
      senderId: currentUser.id,
      receiverId: activeMatch.user.id,
      message: newMessage.trim(),
    };
    socket.emit('send_message', data);
    // Optimistically add message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender_id: currentUser.id,
      receiver_id: activeMatch.user.id,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
    }]);
    setNewMessage('');
  };

  const fetchAstroDetails = async () => {
    if (!activeMatch) return;
    setAstroLoading(true);
    setAstroError('');
    try {
      const response = await api.get('/astro/match-details', {
        params: { matchId: activeMatch.matchId, userId: currentUser.id }
      });
      setAstroData(response.data);
    } catch (err: any) {
      console.error('Error fetching astro details:', err);
      setAstroError(err.response?.data?.error || 'Failed to load compatibility details');
    } finally {
      setAstroLoading(false);
    }
  };

  const handleUnlockAstro = async () => {
    if (!activeMatch) return;
    setUnlockLoading(true);
    setAstroError('');
    try {
      await api.post('/astro/unlock-match', {
        matchId: activeMatch.matchId,
        userId: currentUser.id
      });
      // Fire global balance update event
      window.dispatchEvent(new Event('rose_balance_updated'));
      await fetchAstroDetails();
    } catch (err: any) {
      console.error('Error unlocking astro details:', err);
      setAstroError(err.response?.data?.error || 'Failed to unlock details');
    } finally {
      setUnlockLoading(false);
    }
  };

  const toggleAudioReadout = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
    } else {
      if (!astroData?.story) return;
      const { chapter1, chapter2, chapter3, chapter4 } = astroData.story;
      const fullText = `Here is your Vedic Matchmaking story. Chapter 1, Chemistry and Vibe: ${chapter1}. Chapter 2, Wealth and Career: ${chapter2}. Chapter 3, Life Harmony: ${chapter3}. Chapter 4, Challenges and Remedies: ${chapter4}`;
      
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.onend = () => {
        setIsPlayingAudio(false);
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
      };
      
      setIsPlayingAudio(true);
      window.speechSynthesis?.speak(utterance);
    }
  };

  useEffect(() => {
    if (showAstroModal && activeMatch) {
      fetchAstroDetails();
    } else {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
    }
  }, [showAstroModal, activeMatch]);

  const headerStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--glass-border)',
  };

  if (!activeMatch) {
    return (
      <div
        className="min-h-screen flex flex-col pb-24 md:pb-0 md:ml-64 transition-all"
        style={{ background: 'var(--bg-base)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-4" style={headerStyle}>
          <div className="max-w-2xl mx-auto">
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
              Matches
            </h1>
            {!loadingMatches && matches.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'rgba(180,120,150,0.5)' }}>
                {matches.length} mutual connection{matches.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="max-w-2xl mx-auto">
            {loadingMatches ? (
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-2xl shimmer-skeleton" style={{ height: '80px' }} />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center mt-24 text-center"
                style={{ animation: 'fadeUp 0.6s ease both' }}
              >
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: 'rgba(225,29,72,0.07)',
                    border: '1px solid rgba(225,29,72,0.12)',
                    animation: 'pulseGlow 3s ease-in-out infinite',
                  }}
                >
                  <Sparkles className="w-10 h-10" style={{ color: 'rgba(212,175,55,0.4)' }} />
                </div>
                <p className="text-xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif', color: 'rgba(255,248,240,0.4)' }}>
                  No matches yet
                </p>
                <p className="text-sm mt-1" style={{ color: 'rgba(180,120,150,0.3)' }}>Keep swiping!</p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {matches.map((match, i) => (
                  <div
                    key={match.matchId}
                    onClick={() => openChat(match)}
                    className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
                    style={{
                      background: match.isFullyUnlocked
                        ? 'var(--bg-surface)'
                        : 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      opacity: match.isFullyUnlocked ? 1 : 0.6,
                      animation: `fadeUp 0.5s ${i * 0.08}s ease both`,
                    }}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={match.user.photos[0] || 'https://via.placeholder.com/150'}
                        alt={match.user.name}
                        className="w-14 h-14 rounded-xl object-cover"
                        style={{
                          border: match.isFullyUnlocked
                            ? '2px solid rgba(212,175,55,0.4)'
                            : '2px solid rgba(255,255,255,0.05)',
                          filter: match.isFullyUnlocked ? 'none' : 'grayscale(30%)',
                        }}
                      />
                      {match.isFullyUnlocked && (
                        <div
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{
                            background: '#22C55E',
                            borderColor: '#050005',
                            boxShadow: '0 0 6px rgba(34,197,94,0.5)',
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                          {match.user.name}
                          {match.user.face_verified && (
                            <span className="inline-flex items-center justify-center bg-blue-500 text-white rounded-full p-0.5" style={{ width: '14px', height: '14px' }} title="Face Verified">
                              <svg className="w-2.5 h-2.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                        </h3>
                        {!match.isFullyUnlocked && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              color: 'rgba(180,120,150,0.6)',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            <Lock className="w-2.5 h-2.5" />
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(180,120,150,0.5)' }}>
                        {match.isFullyUnlocked
                          ? 'Tap to start chatting!'
                          : !match.myUnlockStatus
                          ? 'Unlock required · 1 Rose'
                          : 'Waiting for their commitment...'}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: match.isFullyUnlocked
                            ? 'rgba(212,175,55,0.1)'
                            : 'rgba(255,255,255,0.04)',
                          border: match.isFullyUnlocked
                            ? '1px solid rgba(212,175,55,0.2)'
                            : '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        {match.isFullyUnlocked
                          ? <span style={{ fontSize: '14px' }}>💬</span>
                          : <Lock className="w-3.5 h-3.5" style={{ color: 'rgba(180,120,150,0.4)' }} />
                        }
                      </div>
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

  // ── ACTIVE CHAT VIEW ──
  return (
    <div
      className="min-h-screen flex flex-col md:ml-64 transition-all"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Chat Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={headerStyle}>
        <button
          onClick={() => setActiveMatch(null)}
          className="rounded-full p-2 flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(212,175,55,0.7)',
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img
          src={activeMatch.user.photos[0] || 'https://via.placeholder.com/150'}
          className="w-9 h-9 rounded-full object-cover border-2 flex-shrink-0"
          style={{ borderColor: 'rgba(212,175,55,0.4)' }}
          alt=""
        />
        <div className="min-w-0 flex-1">
          <h2
            className="font-bold text-sm flex items-center gap-1.5"
            style={{ fontFamily: '"Cormorant Garamond", serif', color: 'var(--text-primary)', fontSize: '18px' }}
          >
            {activeMatch.user.name}
            {activeMatch.user.face_verified && (
              <span className="inline-flex items-center justify-center bg-blue-500 text-white rounded-full p-0.5" style={{ width: '16px', height: '16px' }} title="Face Verified">
                <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
          </h2>
          {activeMatch.isFullyUnlocked && (
            <p className="text-[10px]" style={{ color: '#4ADE80' }}>● Online</p>
          )}
        </div>
        
        {activeMatch.isFullyUnlocked && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowAstroModal(true)}
              className="rounded-full p-2.5 flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(197,160,89,0.15))',
                border: '1px solid rgba(212,175,55,0.4)',
                color: '#D4AF37',
                boxShadow: '0 0 10px rgba(212,175,55,0.2)',
              }}
              title="Astro Compatibility"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={() => callUser(activeMatch.user.id, activeMatch.user.name, activeMatch.user.photos[0] || 'https://via.placeholder.com/150')}
              className="rounded-full p-2.5 flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(22,163,74,0.1))',
                border: '1px solid rgba(34,197,94,0.3)',
                color: '#22C55E',
                boxShadow: '0 4px 12px rgba(34,197,94,0.1)',
              }}
            >
              <Phone className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {!activeMatch.isFullyUnlocked ? (
        /* Locked State */
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center relative overflow-hidden"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-card)',
              animation: 'slideInScale 0.5s ease both',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)' }}
            />
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'rgba(225,29,72,0.08)',
                border: '1px solid rgba(225,29,72,0.2)',
                animation: 'pulseGlow 3s ease-in-out infinite',
              }}
            >
              <Lock className="w-8 h-8" style={{ color: 'rgba(225,29,72,0.5)' }} />
            </div>

            <h3
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: '"Cormorant Garamond", serif', color: 'var(--text-primary)' }}
            >
              Chat Locked
            </h3>

            {!activeMatch.myUnlockStatus ? (
              <>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(180,120,150,0.6)' }}>
                  To filter out time-wasters, both parties must pay 1 Rose to unlock the chat. It's a mutual commitment.
                </p>
                <button
                  onClick={async () => {
                    try {
                      await api.post('/interactions/unlock-chat', { interestId: activeMatch.matchId, userId: currentUser.id });
                      setActiveMatch({ ...activeMatch, myUnlockStatus: true, isFullyUnlocked: activeMatch.theirUnlockStatus });
                      window.dispatchEvent(new Event('rose_balance_updated'));
                    } catch (err: any) {
                      alert(err.response?.data?.error || 'Failed to unlock');
                    }
                  }}
                  className="w-full py-3.5 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #7A0B2A, #E11D48)',
                    color: 'white',
                    border: '1px solid rgba(255,100,120,0.3)',
                    boxShadow: '0 8px 24px rgba(225,29,72,0.4)',
                    animation: 'pulseGlow 3s ease-in-out infinite',
                  }}
                >
                  🌹 Unlock for 1 Rose
                </button>
              </>
            ) : (
              <>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(180,120,150,0.6)' }}>
                  You've committed! Waiting for {activeMatch.user.name} to unlock their side. If they don't within 48 hours, your Rose is refunded.
                </p>
                <div className="flex items-center justify-center gap-2">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: '#E11D48',
                        animation: `heartbeat 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto" style={{ paddingBottom: '80px' }}>
            <div className="max-w-2xl mx-auto space-y-3">
              {messages.length === 0 ? (
                <div
                  className="text-center mt-20"
                  style={{ animation: 'fadeUp 0.6s ease both' }}
                >
                  <p className="text-sm" style={{ color: 'rgba(180,120,150,0.4)' }}>
                    Start your story with {activeMatch.user.name} ✨
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUser.id;
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      style={{ animation: `${isMe ? 'slideInRight' : 'slideInLeft'} 0.3s ease both` }}
                    >
                      <div
                        className="max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                        style={isMe ? {
                          background: 'linear-gradient(135deg, #7A0B2A, #E11D48)',
                          color: 'white',
                          borderBottomRightRadius: '4px',
                          boxShadow: '0 4px 16px rgba(225,29,72,0.3)',
                        } : {
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--glass-border)',
                          borderBottomLeftRadius: '4px',
                        }}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div
            className="fixed bottom-0 left-0 right-0 p-3 md:left-64 z-20 transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderTop: '1px solid var(--glass-border)',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
            }}
          >
            <form onSubmit={sendMessage} className="flex gap-2 max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none transition-all duration-300"
                style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${newMessage ? 'var(--gold)' : 'var(--glass-border)'}`,
                  color: 'var(--text-primary)',
                  fontFamily: 'Inter, sans-serif',
                }}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                className="rounded-2xl px-4 flex items-center justify-center transition-all duration-300 flex-shrink-0"
                style={{
                  background: newMessage.trim()
                    ? 'linear-gradient(135deg, var(--gold), var(--gold-light))'
                    : 'var(--bg-surface)',
                  border: newMessage.trim()
                    ? '1px solid var(--gold)'
                    : '1px solid var(--glass-border)',
                  color: newMessage.trim() ? 'white' : 'var(--text-muted)',
                  boxShadow: newMessage.trim() ? '0 4px 16px rgba(212,175,55,0.3)' : 'none',
                  transform: newMessage.trim() ? 'scale(1)' : 'scale(0.95)',
                  width: '48px',
                  height: '48px',
                  animation: newMessage.trim() ? 'pulseGlow 2s ease-in-out infinite' : 'none',
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}

      {/* Astro Modal */}
      {showAstroModal && activeMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div 
            className="w-full max-w-lg rounded-3xl overflow-hidden relative border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.2)] flex flex-col"
            style={{
              background: 'radial-gradient(circle at center, #180920 0%, #070008 100%)',
              maxHeight: '90vh',
            }}
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
                <h3 className="text-lg font-bold text-white font-serif tracking-wide">
                  AI Kundali Matchmaker
                </h3>
              </div>
              <button 
                onClick={() => setShowAstroModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 bg-white/5 hover:bg-white/10 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {astroLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
                  <p className="text-sm text-gray-400 font-medium">Consulting celestial stars...</p>
                </div>
              ) : astroError ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {astroError}
                  <button 
                    onClick={fetchAstroDetails}
                    className="mt-3 block mx-auto px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : astroData ? (
                <>
                  {!astroData.isComplete ? (
                    /* Missing birth details screen */
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto border border-[#D4AF37]/20">
                          <Sparkles className="w-8 h-8 text-[#D4AF37]" />
                        </div>
                        <h4 className="text-white font-bold text-lg font-serif">Incomplete Birth Details</h4>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                          Vedic astrology requires the Date, Time, and Place of birth for both individuals to construct accurate birth charts and calculate Ashtakoota compatibility.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Current User Status */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">Your Birth Details</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {astroData.meComplete ? '✅ Completed' : '❌ Required'}
                            </p>
                          </div>
                          {!astroData.meComplete && (
                            <span className="text-xs text-[#D4AF37] font-semibold bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
                              Action Required
                            </span>
                          )}
                        </div>

                        {/* Partner Status */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">{astroData.partnerName}'s Birth Details</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {astroData.partnerComplete ? '✅ Completed' : '⏳ Waiting for them...'}
                            </p>
                          </div>
                          {!astroData.partnerComplete && (
                            <span className="text-xs text-rose-400 font-semibold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                              Awaiting Update
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fast birth details form if current user is incomplete */}
                      {!astroData.meComplete && (
                        <div className="p-5 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/20 space-y-4 text-left">
                          <p className="text-sm font-bold text-[#D4AF37] font-serif">Quickly add your birth details:</p>
                          
                          <form 
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const form = e.currentTarget;
                              const dob = (form.elements.namedItem('localDob') as HTMLInputElement).value;
                              const tob = (form.elements.namedItem('localTob') as HTMLInputElement).value;
                              const pob = (form.elements.namedItem('localPob') as HTMLInputElement).value;
                              
                              setAstroLoading(true);
                              try {
                                await api.post('/astro/update-birth-details', {
                                  userId: currentUser.id,
                                  dob,
                                  tob,
                                  pob
                                });
                                await fetchAstroDetails();
                              } catch (err: any) {
                                setAstroError(err.response?.data?.error || 'Failed to update details');
                                setAstroLoading(false);
                              }
                            }}
                            className="space-y-3"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-gray-400 font-medium mb-1">Date of Birth</label>
                                <input 
                                  type="date" 
                                  name="localDob"
                                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-400 font-medium mb-1">Time of Birth</label>
                                <input 
                                  type="text" 
                                  name="localTob"
                                  placeholder="e.g. 14:30 or 2:30 PM"
                                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-400 font-medium mb-1">Place of Birth</label>
                              <input 
                                type="text" 
                                name="localPob"
                                placeholder="e.g. Vijayawada, AP"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                                required
                              />
                            </div>
                            <button 
                              type="submit"
                              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-black font-semibold py-2 rounded-xl text-xs hover:scale-[1.02] transition-all shadow-md mt-2"
                            >
                              Save & Match
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Completed & Calculations available */
                    <div className="space-y-6">
                      
                      {/* Ashtakoota compatibility circular graph / progress */}
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="relative w-36 h-36 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full bg-[#D4AF37]/5 animate-ping opacity-30" />
                          <svg className="w-full h-full transform -rotate-90">
                            <circle 
                              cx="72" 
                              cy="72" 
                              r="60" 
                              className="stroke-white/5" 
                              strokeWidth="8"
                              fill="transparent"
                            />
                            <circle 
                              cx="72" 
                              cy="72" 
                              r="60" 
                              className="stroke-[#D4AF37]" 
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 60}
                              strokeDashoffset={2 * Math.PI * 60 * (1 - (astroData.score || 0) / 36)}
                              strokeLinecap="round"
                              style={{
                                filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.4))',
                                transition: 'stroke-dashoffset 1.5s ease-in-out'
                              }}
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-bold text-white font-serif">{astroData.score}</span>
                            <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Out of 36</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white font-bold text-lg font-serif">
                            Ashtakoota Match Score
                          </h4>
                          <p className="text-xs mt-1" style={{ color: (astroData.score || 0) >= 18 ? '#4ADE80' : '#FB7185' }}>
                            {(astroData.score || 0) >= 18 
                              ? '✨ Highly Auspicious & Recommended Match!' 
                              : '⚠️ Average Compatibility. Remedies Advised.'}
                          </p>
                        </div>
                      </div>

                      {/* Locked vs. Unlocked Astro Story */}
                      {!astroData.isUnlocked ? (
                        /* Locked Paywall */
                        <div 
                          className="p-6 rounded-3xl border border-[#D4AF37]/20 text-center relative overflow-hidden bg-black/40"
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          <div className="absolute -right-10 -top-10 w-24 h-24 bg-[#D4AF37]/10 rounded-full blur-xl" />
                          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl" />
                          
                          <div className="w-14 h-14 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                            <Lock className="w-6 h-6 text-rose-400 animate-bounce" />
                          </div>

                          <h5 className="text-white font-bold font-serif text-base mb-1">
                            Unlock Detailed Compatibility Story
                          </h5>
                          <p className="text-xs text-gray-400 leading-relaxed mb-6 max-w-sm mx-auto">
                            Decode your astrological combination. Get a comprehensive, AI-written 4-chapter narrative analysis covering vibe, wealth/career, long-term harmony, and remedies using Google Gemini.
                          </p>

                          <button
                            onClick={handleUnlockAstro}
                            disabled={unlockLoading}
                            className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-black font-bold rounded-2xl text-sm transition-all duration-300 hover:scale-[1.02] shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {unlockLoading ? (
                              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                              <>
                                🌹 Unlock Story (3 Roses)
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        /* Unlocked Chapters Report */
                        <div className="space-y-4 text-left">
                          
                          {/* TTS Audio Controls */}
                          <div className="flex justify-end">
                            <button
                              onClick={toggleAudioReadout}
                              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all border ${
                                isPlayingAudio 
                                  ? 'bg-[#E11D48]/10 border-[#E11D48]/30 text-[#E11D48] shadow-[0_0_10px_rgba(225,29,72,0.2)]'
                                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {isPlayingAudio ? (
                                <>
                                  <span className="flex gap-0.5 items-center justify-center w-3 h-3">
                                    <span className="w-0.5 h-2 bg-rose-400 animate-pulse animate-duration-500" />
                                    <span className="w-0.5 h-3 bg-rose-400 animate-pulse animate-duration-500 delay-75" />
                                    <span className="w-0.5 h-1.5 bg-rose-400 animate-pulse animate-duration-500 delay-150" />
                                  </span>
                                  Stop Voice Story
                                </>
                              ) : (
                                <>
                                  <span>🔊</span> Listen to Story
                                </>
                              )}
                            </button>
                          </div>

                          {/* 4 Chapters */}
                          <div className="space-y-4">
                            {[
                              { title: 'Chapter 1: Chemistry, Vibe & Communication', text: astroData.story?.chapter1, bg: 'rgba(212,175,55,0.02)', border: 'rgba(212,175,55,0.1)' },
                              { title: 'Chapter 2: Wealth, Family Support & Destiny', text: astroData.story?.chapter2, bg: 'rgba(34,197,94,0.02)', border: 'rgba(34,197,94,0.1)' },
                              { title: 'Chapter 3: Children & Life Compatibility', text: astroData.story?.chapter3, bg: 'rgba(59,130,246,0.02)', border: 'rgba(59,130,246,0.1)' },
                              { title: 'Chapter 4: Challenges & Warning Signs', text: astroData.story?.chapter4, bg: 'rgba(239,68,68,0.02)', border: 'rgba(239,68,68,0.1)' },
                            ].map((ch, i) => (
                              <div 
                                key={i}
                                className="p-5 rounded-2xl border text-sm leading-relaxed text-gray-300 space-y-2 transition-all hover:scale-[1.01]"
                                style={{
                                  background: ch.bg,
                                  borderColor: ch.border
                                }}
                              >
                                <h5 className="font-serif text-[#D4AF37] font-bold text-sm">
                                  {ch.title}
                                </h5>
                                <p className="text-gray-300 text-xs font-normal leading-relaxed">
                                  {ch.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Sticky disclaimer footer */}
            <div className="p-3 bg-black/40 border-t border-white/5 text-center">
              <p className="text-[10px] text-gray-500 leading-normal">
                Astrological calculations are based on Vedic Rishis match principles. Stories generated by Gemini AI. Use with positive discretion.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
