import React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, Bell, MessageCircle, Home } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
  const { unreadCount } = useSocket();

  return (
    <nav className="bg-white border-t-2 md:border-t-0 md:border-r-2 border-amber-500 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)] fixed bottom-0 md:top-0 md:left-0 md:h-screen w-full md:w-64 z-50 transition-all">
      <div className="flex md:flex-col justify-around md:justify-start items-center md:items-start h-16 md:h-full max-w-md mx-auto md:max-w-none md:p-6 md:gap-4 md:pt-10">
        
        <div className="hidden md:block w-full mb-8">
          <h1 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-900 to-amber-600">Varudu</h1>
          <p className="text-xs font-semibold text-rose-800 mt-1 uppercase tracking-widest">Premium</p>
        </div>

        <NavLink 
          to="/" 
          className={({ isActive }) => `flex flex-col md:flex-row items-center md:justify-start justify-center w-full h-full md:h-14 md:px-4 md:rounded-xl transition relative ${isActive ? 'text-rose-700 font-bold bg-rose-50' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/50'}`}
        >
          <Home className="w-6 h-6 mb-1 md:mb-0 md:mr-3" />
          <span className="text-[10px] md:text-sm font-semibold">Discover</span>
        </NavLink>
        
        <NavLink 
          to="/interests" 
          className={({ isActive }) => `flex flex-col md:flex-row items-center md:justify-start justify-center w-full h-full md:h-14 md:px-4 md:rounded-xl transition relative ${isActive ? 'text-rose-700 font-bold bg-rose-50' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/50'}`}
        >
          <Heart className="w-6 h-6 mb-1 md:mb-0 md:mr-3" />
          <span className="text-[10px] md:text-sm font-semibold">My Interests</span>
        </NavLink>

        <NavLink 
          to="/requests" 
          className={({ isActive }) => `flex flex-col md:flex-row items-center md:justify-start justify-center w-full h-full md:h-14 md:px-4 md:rounded-xl transition relative ${isActive ? 'text-rose-700 font-bold bg-rose-50' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/50'}`}
        >
          <Bell className="w-6 h-6 mb-1 md:mb-0 md:mr-3" />
          <span className="text-[10px] md:text-sm font-semibold">Requests</span>
        </NavLink>

        <NavLink 
          to="/chat" 
          className={({ isActive }) => `flex flex-col md:flex-row items-center md:justify-start justify-center w-full h-full md:h-14 md:px-4 md:rounded-xl transition relative ${isActive ? 'text-rose-700 font-bold bg-rose-50' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/50'}`}
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6 mb-1 md:mb-0 md:mr-3" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 md:top-0 -right-2 md:left-5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm z-10">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
          <span className="text-[10px] md:text-sm font-semibold">Chats</span>
        </NavLink>
      </div>
    </nav>
  );
}
