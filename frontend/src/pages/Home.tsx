import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, Heart, Sparkles, MessageCircle, LogOut, SlidersHorizontal, X } from 'lucide-react';

export default function Home() {
  const [searchVal, setSearchVal] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [maxAge, setMaxAge] = useState(40);
  const [minAge, setMinAge] = useState(18);
  const [selectedCity, setSelectedCity] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchVal.trim();
    
    // Construct query parameters
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (minAge > 18) params.append('minAge', minAge.toString());
    if (maxAge < 60) params.append('maxAge', maxAge.toString());
    if (selectedCity) params.append('city', selectedCity);

    const queryString = params.toString();
    if (queryString) {
      navigate(`/discover?${queryString}`);
    } else {
      navigate('/discover');
    }
  };

  const cities = [
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
    'Tirupati'
  ];

  return (
    <div className="min-h-screen flex flex-col md:ml-44 bg-white font-sans text-[var(--text-primary)]">
      
      {/* ── TOP HEADER (SUBTLE LOGOUT) ── */}
      <div className="w-full flex justify-end px-6 py-4 sticky top-0 bg-white/80 backdrop-blur-md z-30">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-all font-sans text-xs border border-neutral-200/50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="font-semibold">Logout</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24 max-w-lg mx-auto w-full text-center select-none">
        
        {/* Decorative Top Heart Icon */}
        <div className="w-16 h-16 rounded-full bg-neutral-50 border border-neutral-100/80 flex items-center justify-center mb-8 shadow-sm animate-float">
          <Heart className="w-6 h-6 text-[#0071E3] fill-current" />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-serif italic font-medium tracking-tight mb-3 text-neutral-900">
          PerfMatch
        </h1>

        {/* Slogan */}
        <p className="text-xs md:text-sm text-neutral-500 font-medium max-w-xs leading-relaxed mb-8">
          Your journey to the perfect union starts here. Discover compatible profiles with a touch of roses.
        </p>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="w-full space-y-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <span className="absolute inset-y-0 left-4 flex items-center justify-center text-neutral-400">
                <Search className="w-5 h-5 transition-colors group-focus-within:text-black" />
              </span>
              <input
                type="text"
                placeholder="Search name or location..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full py-4 pl-12 pr-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl outline-none text-base transition-all duration-300 shadow-sm focus:border-neutral-400 focus:bg-white focus:shadow-md"
              />
            </div>
            
            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 rounded-2xl border transition-all flex items-center justify-center ${
                showFilters || minAge > 18 || maxAge < 60 || selectedCity
                  ? 'bg-black border-black text-white'
                  : 'bg-neutral-50 border-neutral-200/80 text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Filter Profiles"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* ── ADVANCED FILTERS PANEL (Modal / Dropdown) ── */}
          {showFilters && (
            <div className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-5 text-left space-y-4 animate-fadeUp">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Filter Preferences</h4>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="text-neutral-400 hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Age Filters */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold text-neutral-700">
                  <span>Age Range:</span>
                  <span className="font-bold text-[#0071E3]">{minAge} - {maxAge} years</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-neutral-400 w-8">Min:</span>
                    <input
                      type="range"
                      min="18"
                      max="60"
                      value={minAge}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setMinAge(Math.min(val, maxAge - 1));
                      }}
                      className="flex-1 accent-black h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-neutral-400 w-8">Max:</span>
                    <input
                      type="range"
                      min="18"
                      max="60"
                      value={maxAge}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setMaxAge(Math.max(val, minAge + 1));
                      }}
                      className="flex-1 accent-black h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* City Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 block">Select City:</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full p-3 bg-white border border-neutral-200 rounded-xl text-sm outline-none focus:border-neutral-400"
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Clear Panel Controls */}
              {(minAge > 18 || maxAge < 60 || selectedCity) && (
                <button
                  type="button"
                  onClick={() => {
                    setMinAge(18);
                    setMaxAge(60);
                    setSelectedCity('');
                  }}
                  className="text-[10px] font-bold text-neutral-400 hover:text-black uppercase tracking-wider"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}

          {/* Go For All Profiles Button */}
          <button
            type="submit"
            className="w-full py-4 bg-black text-white hover:bg-neutral-900 text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 active:scale-98"
          >
            Go for profiles
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
