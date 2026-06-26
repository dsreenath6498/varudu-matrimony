import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { Send, ArrowLeft, Lock, Sparkles, Phone } from 'lucide-react';
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
          <button
            onClick={() => callUser(activeMatch.user.id, activeMatch.user.name, activeMatch.user.photos[0] || 'https://via.placeholder.com/150')}
            className="rounded-full p-2.5 flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(22,163,74,0.1))',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#22C55E',
              boxShadow: '0 4px 12px rgba(34,197,94,0.1)',
            }}
          >
            <Phone className="w-5 h-5" />
          </button>
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
    </div>
  );
}
