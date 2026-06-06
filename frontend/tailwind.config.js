export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        velvet: {
          950: '#050005',
          900: '#0a0008',
          800: '#120010',
          700: '#1a0018',
          600: '#240020',
        },
        crimson: {
          400: '#F87185',
          500: '#E11D48',
          600: '#C41E3A',
          700: '#9F1239',
          800: '#7A0B2A',
        },
        gold: {
          300: '#FFE88A',
          400: '#FFD700',
          500: '#D4AF37',
          600: '#B8860B',
        },
        rose: {
          glass: 'rgba(225,29,72,0.08)',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'petal-drift': 'petalDrift 12s linear infinite',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'slide-in': 'slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(225,29,72,0.4), 0 0 30px rgba(225,29,72,0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(225,29,72,0.8), 0 0 60px rgba(225,29,72,0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        petalDrift: {
          '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '0.6' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.12)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.08)' },
          '56%': { transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-crimson': '0 0 20px rgba(225,29,72,0.5), 0 0 60px rgba(225,29,72,0.2)',
        'glow-gold': '0 0 20px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.2)',
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card': '0 25px 50px rgba(0,0,0,0.6)',
      }
    },
  },
  plugins: [],
}
