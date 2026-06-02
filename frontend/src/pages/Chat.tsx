import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { Send, ArrowLeft } from 'lucide-react';
import api from '../api';
import { useSocket } from '../context/SocketContext';

interface Match {
  matchId: string;
  myUnlockStatus: boolean;
  theirUnlockStatus: boolean;
  isFullyUnlocked: boolean;
  user: {
    id: string;
    name: string;
    photos: string[];
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUserStr = localStorage.getItem('user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  // Initialize Matches
  useEffect(() => {
    if (!currentUser) return;

    // Fetch accepted matches
    const fetchMatches = async () => {
      try {
        const response = await api.get('/chat/matches', { params: { userId: currentUser.id } });
        setMatches(response.data.matches);
      } catch (error) {
        console.error("Error fetching matches", error);
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchMatches();
  }, []);

  // Listen for incoming messages on the global socket
  useEffect(() => {
    if (!socket) return;

    const messageHandler = (data: any) => {
      // Only append message if we are currently looking at the chat room it belongs to
      if (activeMatch && data.matchId === activeMatch.matchId) {
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

    return () => {
      socket.off('receive_message', messageHandler);
    };
  }, [socket, activeMatch]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // When exiting a chat, clear the active match ID in context
  useEffect(() => {
    if (!activeMatch) {
      setActiveMatchId(null);
    }
  }, [activeMatch]);

  const openChat = async (match: Match) => {
    setActiveMatch(match);
    setActiveMatchId(match.matchId);
    clearUnread();
    
    socket?.emit('join_room', match.matchId);
    
    // Load historical messages
    try {
      const response = await api.get('/chat/history', {
        params: { userId1: currentUser.id, userId2: match.user.id }
      });
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Error fetching chat history", error);
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
    setNewMessage('');
  };

  if (!activeMatch) {
    // MATCHES LIST VIEW
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col pb-16 md:pb-0 md:ml-64 transition-all">
        <div className="p-4 bg-gradient-to-r from-red-900 via-rose-900 to-amber-900 shadow-md sticky top-0 z-10 border-b-2 border-amber-500">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-serif font-bold text-amber-300">Matches</h1>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {loadingMatches ? (
               <div className="text-center text-slate-500 mt-10">Loading...</div>
            ) : matches.length === 0 ? (
              <div className="text-center text-rose-300 mt-20">
                <p>No accepted matches yet.</p>
                <p className="text-sm">Keep swiping!</p>
              </div>
            ) : (
              matches.map((match) => (
                <div 
                  key={match.matchId} 
                  onClick={() => openChat(match)}
                  className={`p-4 rounded-2xl shadow-sm border flex items-center gap-4 cursor-pointer transition ${
                    match.isFullyUnlocked ? 'bg-white border-rose-100 hover:shadow-md' : 'bg-slate-50 border-slate-200 opacity-75 grayscale-[30%]'
                  }`}
                >
                  <img 
                    src={match.user.photos[0] || 'https://via.placeholder.com/150'} 
                    alt={match.user.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-200"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      {match.user.name}
                      {!match.isFullyUnlocked && <span className="bg-slate-200 text-slate-600 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">Locked</span>}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {match.isFullyUnlocked ? 'Tap to start chatting!' : (
                        !match.myUnlockStatus ? 'Unlock required (1 Rose)' : 'Waiting for their commitment...'
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <Navbar />
      </div>
    );
  }

  // ACTIVE CHAT VIEW
  return (
    <div className="min-h-screen bg-rose-50 flex flex-col md:ml-64 transition-all">
      <div className="p-4 bg-gradient-to-r from-red-900 via-rose-900 to-amber-900 shadow-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => setActiveMatch(null)} className="text-amber-300 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <img 
            src={activeMatch.user.photos[0] || 'https://via.placeholder.com/150'} 
            className="w-10 h-10 rounded-full border-2 border-amber-300 object-cover"
            alt=""
          />
          <h2 className="font-serif font-bold text-white">{activeMatch.user.name}</h2>
        </div>
      </div>

      {!activeMatch.isFullyUnlocked ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-rose-200 text-center max-w-sm w-full">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              🔒
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-800 mb-2">Chat Locked</h3>
            
            {!activeMatch.myUnlockStatus ? (
              <>
                <p className="text-slate-500 mb-6 text-sm">You both matched! But to filter out time-wasters, we require a mutual commitment. Pay 1 Rose to unlock your side of the chat.</p>
                <button 
                  onClick={async () => {
                    try {
                      await api.post('/interactions/unlock-chat', { interestId: activeMatch.matchId, userId: currentUser.id });
                      setActiveMatch({ ...activeMatch, myUnlockStatus: true, isFullyUnlocked: activeMatch.theirUnlockStatus });
                      // Trigger re-fetch of matches to update the list in background
                      window.dispatchEvent(new Event('rose_balance_updated'));
                    } catch (err: any) {
                      alert(err.response?.data?.error || 'Failed to unlock');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2"
                >
                  Unlock for 1 Rose 🌹
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-500 mb-6 text-sm">You've paid your Rose! We are waiting for {activeMatch.user.name} to pay theirs. If they don't unlock it within 48 hours, your Rose will be refunded.</p>
                <div className="animate-pulse flex items-center justify-center gap-2 text-rose-500 font-bold">
                  <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                  <span className="w-2 h-2 bg-rose-500 rounded-full animation-delay-200"></span>
                  <span className="w-2 h-2 bg-rose-500 rounded-full animation-delay-400"></span>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 p-4 overflow-y-auto pb-24">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 mt-10 text-sm">
                  This is the start of your conversation with {activeMatch.user.name}. Say hi!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] md:max-w-md p-3 rounded-2xl ${
                        isMe 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-red-900 rounded-br-none shadow-sm' 
                          : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-rose-100'
                      }`}>
                        <p>{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-rose-100 z-20 md:left-64 transition-all">
            <form onSubmit={sendMessage} className="flex gap-2 max-w-3xl mx-auto">
              <input 
                type="text" 
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-rose-50 rounded-full border border-rose-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-gradient-to-r from-red-700 to-rose-600 text-white p-3 rounded-full hover:from-red-800 hover:to-rose-700 transition shadow-lg flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
