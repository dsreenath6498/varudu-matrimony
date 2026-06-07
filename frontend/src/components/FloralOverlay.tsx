import React from 'react';

const FloralOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 p-3 sm:p-6 overflow-hidden">
      {/* Main Decorative Frame */}
      <div className="w-full h-full border-[1.5px] border-[#8D6E63]/20 rounded-3xl relative">
        
        {/* Corner Decals (Vintage Frame Style) */}
        <div className="absolute -top-1 -left-1 w-6 h-6 sm:w-10 sm:h-10 border-t-[1.5px] border-l-[1.5px] border-[#5D4037]/40 rounded-tl-2xl"></div>
        <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-10 sm:h-10 border-t-[1.5px] border-r-[1.5px] border-[#5D4037]/40 rounded-tr-2xl"></div>
        <div className="absolute -bottom-1 -left-1 w-6 h-6 sm:w-10 sm:h-10 border-b-[1.5px] border-l-[1.5px] border-[#5D4037]/40 rounded-bl-2xl"></div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-10 sm:h-10 border-b-[1.5px] border-r-[1.5px] border-[#5D4037]/40 rounded-br-2xl"></div>
        
        {/* Top Center Floral Accent */}
        <svg className="absolute -top-3 left-1/2 -translate-x-1/2 text-[#8D6E63]/30 w-12 h-6" viewBox="0 0 40 20" fill="currentColor">
           <path d="M20 0 C25 10 35 10 40 20 C30 20 25 15 20 10 C15 15 10 20 0 20 C5 10 15 10 20 0 Z" />
        </svg>
        
        {/* Bottom Center Floral Accent */}
        <svg className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[#8D6E63]/30 rotate-180 w-12 h-6" viewBox="0 0 40 20" fill="currentColor">
           <path d="M20 0 C25 10 35 10 40 20 C30 20 25 15 20 10 C15 15 10 20 0 20 C5 10 15 10 20 0 Z" />
        </svg>
      </div>
      
      {/* Subtle background texture overlay (adds to the vintage beige feel) */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      ></div>
    </div>
  );
};

export default FloralOverlay;
