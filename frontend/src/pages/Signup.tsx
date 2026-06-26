import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { Heart, Sparkles, Phone, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

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

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Steps: 1 = Google Auth, 2 = Phone number input, 3 = OTP verification
  const [step, setStep] = useState(1);
  const [googleUser, setGoogleUser] = useState<{ email: string; name: string; idToken: string } | null>(null);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [devEmail, setDevEmail] = useState('');
  const [devName, setDevName] = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Petals array for layout animation
  const petals = Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 5.5) % 100}%`,
    animationDuration: `${10 + Math.random() * 10}s`,
    animationDelay: `${Math.random() * 12}s`,
    top: '-20px',
  }));

  // Handle redirect from login page with google details
  useEffect(() => {
    if (location.state?.googleUser) {
      setGoogleUser(location.state.googleUser);
      setStep(2);
    }
  }, [location.state]);

  // Initialize real Google One Tap / Button if client ID is loaded
  useEffect(() => {
    if (step === 1 && googleClientId && (window as any).google) {
      const google = (window as any).google;
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
      });
      google.accounts.id.renderButton(
        document.getElementById('google-signup-btn'),
        { theme: 'outline', size: 'large', width: '100%' }
      );
    }
  }, [step, googleClientId]);

  // Google authentication callback
  const handleGoogleCallback = (response: any) => {
    setLoading(true);
    try {
      const idToken = response.credential;
      // Decode JWT locally just to retrieve name & email for UI display before submission
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      
      setGoogleUser({
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        idToken: idToken
      });
      
      setTransitioning(true);
      setTimeout(() => {
        setStep(2);
        setTransitioning(false);
      }, 300);
    } catch (error) {
      console.error('Failed to parse Google response:', error);
      alert('Failed to authenticate with Google');
    } finally {
      setLoading(false);
    }
  };

  // Mock Developer sign-in
  const handleDevGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail) return;
    setLoading(true);
    setTimeout(() => {
      const email = devEmail.trim().toLowerCase();
      const name = devName.trim() || email.split('@')[0];
      setGoogleUser({
        email,
        name,
        idToken: `mock-token-${email}`
      });
      setTransitioning(true);
      setTimeout(() => {
        setStep(2);
        setTransitioning(false);
      }, 300);
      setLoading(false);
    }, 400);
  };

  // Request Phone OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !googleUser) return;
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { phoneNumber });
      setTransitioning(true);
      setTimeout(() => {
        setStep(3);
        setTransitioning(false);
      }, 300);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error requesting phone OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and complete google registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !phoneNumber || !googleUser) return;
    setLoading(true);
    try {
      const response = await api.post('/auth/google-signup', {
        idToken: googleUser.idToken,
        phoneNumber,
        otp
      });
      
      const { user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/onboarding');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Invalid OTP. Try 1234 for development testing.');
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

      {/* Signup Card */}
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
          {/* Card top gold line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)' }}
          />

          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-3 relative"
              style={{
                background: 'linear-gradient(135deg, var(--crimson-dark), var(--crimson))',
                boxShadow: 'var(--shadow-glow-crimson)',
                animation: 'pulseGlow 3s ease-in-out infinite',
              }}
            >
              <Heart className="w-6 h-6 text-white fill-current" />
            </div>

            <h1
              className="text-4xl font-bold mb-0.5"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                background: 'linear-gradient(135deg, var(--gold-light), var(--gold), #A88655)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Create Account
            </h1>
            <p className="text-xs font-semibold tracking-wider text-[var(--gold)] uppercase">
              Join Varudu Matrimony
            </p>
          </div>

          {/* Transition Wrapper */}
          <div
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateX(-10px)' : 'translateX(0)',
              transition: 'all 0.3s ease',
            }}
          >
            {/* STEP 1: Google Authentication */}
            {step === 1 && (
              <div className="flex flex-col gap-4" style={{ animation: 'fadeUp 0.5s ease both' }}>
                <p className="text-sm text-[var(--text-muted)] text-center leading-relaxed mb-2">
                  To get started, authenticate with your Google account.
                </p>

                {googleClientId ? (
                  <div className="flex flex-col items-center justify-center min-h-[46px] w-full bg-white/5 rounded-2xl p-1 border border-white/10">
                    <div id="google-signup-btn" className="w-full"></div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-950/20 border border-yellow-800/30 rounded-2xl text-xs text-yellow-500/90 leading-normal mb-2">
                    ⚠️ Google Client ID is not configured. Falling back to Developer Mock Auth mode below.
                  </div>
                )}

                {/* Mock sign-in fields for development */}
                <form onSubmit={handleDevGoogleLogin} className="flex flex-col gap-3 mt-2 border-t border-white/5 pt-4">
                  <div className="text-center text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] mb-1">
                    Developer Sandbox
                  </div>
                  <div>
                    <label className="block mb-1 text-[11px] font-semibold text-white/50">Test Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul.sharma@gmail.com"
                      className="input-luxury text-sm"
                      value={devEmail}
                      onChange={(e) => setDevEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[11px] font-semibold text-white/50">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      className="input-luxury text-sm"
                      value={devName}
                      onChange={(e) => setDevName(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !devEmail}
                    className="w-full font-bold py-3.5 rounded-2xl transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2 btn-crimson text-sm mt-1"
                  >
                    {loading ? 'Authenticating...' : 'Sign Up with Mock Google'}
                  </button>
                </form>

                <div className="text-center mt-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-xs font-semibold text-[var(--gold)] hover:underline flex items-center gap-1.5 justify-center mx-auto"
                  >
                    Already have an account? Log in
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Phone number input */}
            {step === 2 && googleUser && (
              <form onSubmit={handleRequestOtp} className="flex flex-col gap-4" style={{ animation: 'fadeUp 0.5s ease both' }}>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-crimson/10 border border-crimson/30 flex items-center justify-center text-white text-lg font-bold">
                    {googleUser.name[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-white">{googleUser.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-[var(--gold)]" />
                      {googleUser.email}
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <label className="block mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">
                    Verify Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] font-semibold">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      placeholder="98765 43210"
                      className="input-luxury pl-12 text-base tracking-wider"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5 leading-relaxed pl-1">
                    An OTP will be sent to verify your phone number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phoneNumber.length !== 10}
                  className="w-full font-bold py-4 rounded-2xl transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2 btn-crimson mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending OTP...
                    </span>
                  ) : (
                    <>
                      <span>Send Verification OTP</span>
                      <Sparkles className="w-4 h-4 text-[var(--gold-light)]" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGoogleUser(null);
                    setStep(1);
                  }}
                  className="text-xs text-[var(--text-muted)] hover:underline flex items-center gap-1.5 justify-center mt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Google Sign-in
                </button>
              </form>
            )}

            {/* STEP 3: OTP verification */}
            {step === 3 && googleUser && (
              <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-4" style={{ animation: 'fadeUp 0.5s ease both' }}>
                <div className="text-center">
                  <p className="text-xs text-[var(--text-muted)]">Verification code sent to</p>
                  <p className="font-semibold text-sm mt-0.5 text-white">+91 {phoneNumber}</p>
                </div>

                <div>
                  <label className="block mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">
                    Enter 4-Digit OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="• • • •"
                    className="input-luxury text-center tracking-[0.5em] text-xl font-bold py-3.5"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <p className="text-[10px] text-center text-[var(--text-muted)] mt-1.5">
                    Enter the OTP shown in your backend console terminal.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp}
                  className="w-full font-bold py-4 rounded-2xl transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2 btn-crimson mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registering...
                    </span>
                  ) : (
                    'Verify & Complete Registration ✨'
                  )}
                </button>

                <div className="flex justify-between items-center px-1 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTransitioning(true);
                      setTimeout(() => {
                        setStep(2);
                        setTransitioning(false);
                      }, 300);
                    }}
                    className="text-xs text-[var(--text-muted)] hover:underline flex items-center gap-1"
                  >
                    Change number
                  </button>
                  
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await api.post('/auth/request-otp', { phoneNumber });
                        alert('OTP resent successfully!');
                      } catch (err: any) {
                        alert('Failed to resend OTP');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="text-xs text-[var(--gold)] font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card footer */}
          <p className="text-center text-[10px] mt-6 text-white/40 leading-normal border-t border-white/5 pt-4">
            By creating an account, you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
