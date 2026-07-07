import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, Heart, Sparkles, MessageCircle } from 'lucide-react';

export default function Home() {
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchVal.trim();
    if (query) {
      navigate(`/discover?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/discover');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:ml-44 bg-white font-sans text-[var(--text-primary)]">
      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-lg mx-auto w-full text-center select-none">
        
        {/* Decorative Top Heart Icon */}
        <div className="w-16 h-16 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-8 shadow-sm animate-float">
          <Heart className="w-6 h-6 text-[#0071E3] fill-current" />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-serif italic font-medium tracking-tight mb-3 text-neutral-900">
          PerfMatch
        </h1>

        {/* Slogan */}
        <p className="text-xs md:text-sm text-neutral-500 font-medium max-w-xs leading-relaxed mb-10">
          Your journey to the perfect union starts here. Discover compatible profiles with a touch of roses.
        </p>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="w-full space-y-4 mb-6">
          <div className="relative group">
            <span className="absolute inset-y-0 left-4 flex items-center justify-center text-neutral-400">
              <Search className="w-5 h-5 transition-colors group-focus-within:text-black" />
            </span>
            <input
              type="text"
              placeholder="Search by name or place..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full py-4 pl-12 pr-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl outline-none text-base transition-all duration-300 shadow-sm focus:border-neutral-400 focus:bg-white focus:shadow-md"
            />
          </div>

          {/* Go For All Profiles Button */}
          <button
            type="submit"
            className="w-full py-4 bg-black text-white hover:bg-neutral-900 text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 active:scale-98"
          >
            Go for all profiles
          </button>
        </form>

        {/* Small Navigation Shortcuts Grid (Quick Access Cards) */}
        <div className="w-full grid grid-cols-3 gap-3 mt-6">
          <button
            onClick={() => navigate('/interests')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-neutral-150/70 hover:bg-neutral-50 transition-colors"
          >
            <Heart className="w-5 h-5 mb-1.5 text-neutral-600" />
            <span className="text-[9px] font-semibold text-neutral-600">Interests</span>
          </button>
          <button
            onClick={() => navigate('/store')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-neutral-150/70 hover:bg-neutral-50 transition-colors"
          >
            <Sparkles className="w-5 h-5 mb-1.5 text-neutral-600" />
            <span className="text-[9px] font-semibold text-neutral-600">Boutique</span>
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-neutral-150/70 hover:bg-neutral-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5 mb-1.5 text-neutral-600" />
            <span className="text-[9px] font-semibold text-neutral-600">Chats</span>
          </button>
        </div>

      </div>

      <Navbar />
    </div>
  );
}
