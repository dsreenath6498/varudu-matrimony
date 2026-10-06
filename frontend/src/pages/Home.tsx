import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, LogOut, ChevronDown, ArrowRight } from 'lucide-react';

export default function Home() {
  const [searchVal, setSearchVal] = useState('');
  const [lookingFor, setLookingFor] = useState('Bride');
  const [ageRange, setAgeRange] = useState('22 - 30');
  const [religion, setReligion] = useState('Any');
  const [location, setLocation] = useState('Any');
  
  const isAuthenticated = !!localStorage.getItem('user');
  
  // Splash Screen State
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splash_shown');
  });
  const [splashFading, setSplashFading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        dismissSplash();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  const dismissSplash = () => {
    setSplashFading(true);
    setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('splash_shown', 'true');
    }, 600);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('splash_shown');
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const params = new URLSearchParams();
    if (searchVal.trim()) params.append('search', searchVal.trim());
    if (lookingFor !== 'Any') params.append('gender', lookingFor === 'Bride' ? 'Female' : 'Male');
    if (ageRange !== 'Any') params.append('ageRange', ageRange);
    if (religion !== 'Any') params.append('religion', religion);
    if (location !== 'Any') params.append('city', location);

    const queryString = params.toString();
    navigate(queryString ? `/discover?${queryString}` : '/discover');
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-between font-sans text-[#2C2825] relative overflow-hidden bg-cover bg-center bg-no-repeat select-none"
      style={{ backgroundImage: "url('/varudu_hero_bg.jpg')" }}
    >
      
      {/* ── 1. SPLASH SCREEN ANIMATION OVERLAY ── */}
      {showSplash && (
        <div 
          className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#FBF9F5] transition-opacity duration-600 ease-out select-none ${
            splashFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Top Skip Button */}
          <div className="w-full flex justify-end">
            <button 
              onClick={dismissSplash}
              className="text-xs font-semibold tracking-wider text-[#A89F91] hover:text-[#5C5245] transition-colors uppercase py-2 px-3"
            >
              Skip
            </button>
          </div>

          {/* Center Branding Content */}
          <div className="flex flex-col items-center text-center my-auto animate-fadeUp">
            <img 
              src="/varudu_logo.png" 
              alt="Varudu" 
              className="h-16 md:h-20 w-auto object-contain mix-blend-multiply my-4 drop-shadow-sm"
            />
            <p className="text-xs md:text-sm text-[#8A827A] font-medium tracking-wide">
              Find your forever, faster.
            </p>
          </div>

          {/* Bottom Dot indicator */}
          <div className="pb-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C59B63] animate-pulse"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5DFC9]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5DFC9]"></span>
          </div>
        </div>
      )}

      {/* ── 2. TOP HORIZONTAL NAVBAR ── */}
      <Navbar />

      {/* ── 3. HERO CONTENT: VARUDU TITLE, TAGLINE, LOTUS & MULTI-FILTER SEARCH BAR ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 pt-20 pb-16 w-full max-w-4xl mx-auto z-20 text-center">
        
        {/* Golden Varudu Title Logo & Tagline */}
        <div className="mb-6 flex flex-col items-center animate-fadeUp">
          <img 
            src="/varudu_gold_title.png" 
            alt="Varudu" 
            className="h-28 sm:h-36 md:h-44 lg:h-48 w-auto object-contain mix-blend-multiply mx-auto drop-shadow-sm filter contrast-105 -mb-2 md:-mb-4"
          />
          <p 
            className="text-sm sm:text-base md:text-lg text-[#5A4533] font-serif tracking-widest leading-tight"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            Meaningful Matches<br />for a Brighter Tomorrow
          </p>

          {/* Gold Lotus Icon Divider */}
          <div className="flex items-center gap-3 my-3 opacity-80">
            <span className="w-10 h-px bg-[#C59B63]/60"></span>
            <span className="text-base text-[#C59B63]">🪷</span>
            <span className="w-10 h-px bg-[#C59B63]/60"></span>
          </div>
        </div>

        {/* ── MOBILE SEARCH & EXPLORE PROFILES BUTTON (Shown only on Mobile Phones) ── */}
        <form onSubmit={handleSearchSubmit} className="w-full max-w-sm mx-auto md:hidden space-y-3 animate-fadeUp">
          <div className="relative group shadow-md rounded-full">
            <input
              type="text"
              placeholder="Search name, caste, or location..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full py-3.5 pl-11 pr-4 bg-white/85 hover:bg-white/95 focus:bg-white border border-[#EBE3D5] rounded-full outline-none text-sm text-[#2C2825] placeholder-[#7A6B5D] transition-all duration-300 backdrop-blur-md focus:border-[#5C3A21] focus:shadow-lg"
            />
            <span className="absolute inset-y-0 left-3.5 flex items-center justify-center text-[#5C3A21]">
              <Search className="w-4.5 h-4.5" />
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#5C3A21] hover:bg-[#4A2E19] text-white font-semibold text-sm rounded-full shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Explore Profiles</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* ── DESKTOP MULTI-FILTER SEARCH WIDGET (Shown only on Laptops/Desktops) ── */}
        <form onSubmit={handleSearchSubmit} className="w-full max-w-3xl mx-auto hidden md:block animate-fadeUp">
          <div className="bg-[#FAF7F2]/95 backdrop-blur-md border border-[#E8DFC9] rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-3 flex flex-row items-center divide-x divide-[#E5DFC9] text-left">
            
            <div className="flex flex-1 w-full divide-x divide-[#E5DFC9]">
              {/* Filter 1: Looking for */}
              <div className="px-4 py-1 w-full relative">
                <label className="block text-[11px] font-medium text-[#7A6B5D] mb-0.5">Looking for</label>
                <div className="relative flex items-center">
                  <select
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value)}
                    className="w-full bg-transparent text-base font-semibold text-[#3A2312] outline-none appearance-none pr-5 cursor-pointer"
                  >
                    <option value="Bride">Bride</option>
                    <option value="Groom">Groom</option>
                    <option value="Any">Any</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8A7B6C] absolute right-0 pointer-events-none" />
                </div>
              </div>

              {/* Filter 2: Age range */}
              <div className="px-4 py-1 w-full relative">
                <label className="block text-[11px] font-medium text-[#7A6B5D] mb-0.5">Age range</label>
                <div className="relative flex items-center">
                  <select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="w-full bg-transparent text-base font-semibold text-[#3A2312] outline-none appearance-none pr-5 cursor-pointer"
                  >
                    <option value="22 - 30">22 - 30</option>
                    <option value="18 - 25">18 - 25</option>
                    <option value="25 - 35">25 - 35</option>
                    <option value="30 - 45">30 - 45</option>
                    <option value="Any">Any</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8A7B6C] absolute right-0 pointer-events-none" />
                </div>
              </div>

              {/* Filter 3: Religion */}
              <div className="px-4 py-1 w-full relative">
                <label className="block text-[11px] font-medium text-[#7A6B5D] mb-0.5">Religion</label>
                <div className="relative flex items-center">
                  <select
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    className="w-full bg-transparent text-base font-semibold text-[#3A2312] outline-none appearance-none pr-5 cursor-pointer"
                  >
                    <option value="Any">Any</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Muslim">Muslim</option>
                    <option value="Christian">Christian</option>
                    <option value="Sikh">Sikh</option>
                    <option value="Jain">Jain</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8A7B6C] absolute right-0 pointer-events-none" />
                </div>
              </div>

              {/* Filter 4: Location */}
              <div className="px-4 py-1 w-full relative">
                <label className="block text-[11px] font-medium text-[#7A6B5D] mb-0.5">Location</label>
                <div className="relative flex items-center">
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent text-base font-semibold text-[#3A2312] outline-none appearance-none pr-5 cursor-pointer"
                  >
                    <option value="Any">Any</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Vizag">Vizag</option>
                    <option value="Vijayawada">Vijayawada</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8A7B6C] absolute right-0 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Search Submit Button */}
            <div className="px-2 w-auto">
              <button
                type="submit"
                className="px-7 py-3 bg-[#5C3A21] hover:bg-[#4A2E19] text-white font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>

          </div>
        </form>

        {/* Subtle Logout Option (shown if logged in) */}
        {isAuthenticated && (
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/60 hover:bg-white/80 text-[#5C5245] transition-all font-sans text-xs border border-[#E8E0D0] shadow-sm backdrop-blur-md"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

