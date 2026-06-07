import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Heart, Sparkles } from 'lucide-react';

// Floating petal component
function Petal({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="petal"
      style={{
        ...style,
        width: `${8 + Math.random() * 8}px`,
        height: `${8 + Math.random() * 8}px`,
        borderRadius: '50% 0 50% 0',
        background: `radial-gradient(circle at 30% 30%, rgba(212,138,133,0.9), rgba(181,101,93,0.5))`,
        transform: `rotate(${Math.random() * 360}deg)`,
      }}
    />
  );
}

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const navigate = useNavigate();

  const petals = Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 5.5) % 100}%`,
    animationDuration: `${10 + Math.random() * 10}s`,
    animationDelay: `${Math.random() * 12}s`,
    top: '-20px',
  }));

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { phoneNumber });
      setTransitioning(true);
      setTimeout(() => {
        setStep(2);
        setTransitioning(false);
      }, 300);
    } catch (error) {
      alert('Error requesting OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { phoneNumber, otp });
      const { user, isNew } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      if (isNew) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (error) {
      alert('Invalid OTP. Use 1234 for testing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, var(--bg-raised) 0%, var(--bg-base) 60%, var(--bg-deep) 100%)' }}
    >
      {/* Ambient orbs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--crimson-glow) 0%, transparent 70%)',
          top: '-15%',
          left: '-15%',
          animation: 'orbFloat 15s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--gold-glow) 0%, transparent 70%)',
          bottom: '10%',
          right: '-10%',
          animation: 'orbFloat 18s ease-in-out infinite reverse',
          animationDelay: '-6s',
        }}
      />

      {/* Floating petals */}
      <div className="petal-canvas">
        {petals.map((p, i) => (
          <Petal
            key={i}
            style={{
              left: p.left,
              top: p.top,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
              animationName: 'petalFall',
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <div
        className="relative w-full max-w-sm z-10"
        style={{ animation: 'slideInScale 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}
      >
        <div
          className="rounded-3xl p-8 relative overflow-hidden glass"
          style={{
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Card inner glow */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)' }}
          />

          {/* Logo section */}
          <div
            className="flex flex-col items-center mb-8"
            style={{ animation: 'fadeUp 0.6s 0.2s ease both' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 relative"
              style={{
                background: 'linear-gradient(135deg, var(--crimson-dark), var(--crimson))',
                boxShadow: 'var(--shadow-glow-crimson)',
                animation: 'pulseGlow 3s ease-in-out infinite',
              }}
            >
              <Heart className="w-7 h-7 text-white fill-current" />
              {/* Sparkle ring */}
              <div
                className="absolute inset-[-8px] rounded-full border border-dashed"
                style={{
                  borderColor: 'rgba(212,175,55,0.3)',
                  animation: 'spinSlow 8s linear infinite',
                }}
              />
            </div>

            <h1
              className="text-5xl font-bold mb-1"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                background: 'linear-gradient(135deg, var(--gold-light), var(--gold), #A88655)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
                animation: 'textGlow 3s ease-in-out infinite',
              }}
            >
              Varudu
            </h1>

            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3" style={{ color: 'var(--gold)' }} />
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: 'var(--gold)' }}
              >
                Premium Matrimony
              </p>
              <Sparkles className="w-3 h-3" style={{ color: 'var(--gold)' }} />
            </div>

            {/* Divider */}
            <div
              className="mt-4 w-24 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)' }}
            />
          </div>

          {/* Form area */}
          <div
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateX(-10px)' : 'translateX(0)',
              transition: 'all 0.3s ease',
            }}
          >
            {step === 1 ? (
              <div style={{ animation: 'fadeUp 0.5s 0.3s ease both' }}>
                <label
                  className="block mb-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(212,175,55,0.7)' }}
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="input-luxury mb-4"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && requestOtp(e as any)}
                />

                <button
                  onClick={requestOtp}
                  disabled={loading || !phoneNumber}
                  className="w-full font-bold py-4 rounded-2xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden btn-crimson"
                  style={{
                    boxShadow: loading ? 'none' : 'var(--shadow-glow-crimson)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spinSlow 0.8s linear infinite' }} />
                      Sending OTP...
                    </span>
                  ) : (
                    <>
                      <span>Get OTP</span>
                      <Heart className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div style={{ animation: 'fadeUp 0.5s ease both' }}>
                <div className="mb-4 text-center">
                  <p className="text-xs font-semibold text-[var(--text-muted)]">
                    Code sent to
                  </p>
                  <p className="font-semibold mt-0.5 text-[var(--text-primary)]">{phoneNumber}</p>
                </div>

                <label
                  className="block mb-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(212,175,55,0.7)' }}
                >
                  Enter OTP
                </label>
                <input
                  type="text"
                  placeholder="• • • •"
                  className="input-luxury mb-4 text-center tracking-[0.5em] text-xl"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && verifyOtp(e as any)}
                />

                <button
                  onClick={verifyOtp}
                  disabled={loading || !otp}
                  className="w-full font-bold py-4 rounded-2xl transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2 btn-crimson"
                  style={{
                    boxShadow: loading ? 'none' : 'var(--shadow-glow-crimson)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spinSlow 0.8s linear infinite' }} />
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Enter ✨'
                  )}
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full mt-3 text-sm font-medium py-2 rounded-xl transition-all text-[var(--text-muted)]"
                >
                  ← Change number
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs mt-6 text-[var(--text-muted)]">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
