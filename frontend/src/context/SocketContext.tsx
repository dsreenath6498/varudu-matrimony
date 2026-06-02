import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

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
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000');
    socketRef.current = newSocket;
    setSocket(newSocket);

    // Register user for global notifications
    newSocket.emit('register_user', user.id);

    // Listen for global notifications
    newSocket.on('new_notification', (data: any) => {
      // If we are currently looking at the chat room where this message came from, don't increment badge
      // In this case, activeMatchId will equal data.matchId
      if (activeMatchId !== data.matchId) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [activeMatchId]);

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
