import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useLocation } from 'react-router-dom';

interface SocketContextType {
  socket: Socket | null;
  unreadCount: number;
  activeMatchId: string | null;
  setActiveMatchId: (id: string | null) => void;
  clearUnread: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeMatchId, _setActiveMatchId] = useState<string | null>(null);
  const activeMatchIdRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);

  const setActiveMatchId = (id: string | null) => {
    activeMatchIdRef.current = id;
    _setActiveMatchId(id);
  };

  // Synchronize localStorage user state with component state on every route change
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id !== userId) {
          setUserId(user.id);
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    } else {
      if (userId !== null) {
        setUserId(null);
      }
    }
  }, [location.pathname, userId]);

  // Manage Socket.IO connection lifecycle based on the active userId
  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        console.log('User logged out, disconnecting socket.');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const socketUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : (apiUrl.endsWith('/api/') ? apiUrl.slice(0, -5) : apiUrl);
    
    console.log('Connecting to socket server at:', socketUrl);
    const newSocket = io(socketUrl);
    socketRef.current = newSocket;
    setSocket(newSocket);

    // Register user for global notifications on connect and reconnect
    newSocket.on('connect', () => {
      console.log('Socket connected, registering user:', userId);
      newSocket.emit('register_user', userId);
    });

    // Listen for global notifications
    newSocket.on('new_notification', (data: any) => {
      // If we are currently looking at the chat room where this message came from, don't increment badge
      if (activeMatchIdRef.current !== data.matchId) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      console.log('Cleaning up socket connection for user:', userId);
      newSocket.disconnect();
      if (socketRef.current === newSocket) {
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [userId]);

  const clearUnread = () => setUnreadCount(0);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, activeMatchId, setActiveMatchId, clearUnread }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

