import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const transitioning = false;
  const [devEmail, setDevEmail] = useState('');
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const petals = Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 5.5) % 100}%`,
    animationDuration: `${10 + Math.random() * 10}s`,
    animationDelay: `${Math.random() * 12}s`,
    top: '-20px',
  }));

  // Initialize real Google Sign-In GSI client if client ID exists
  useEffect(() => {
    if (googleClientId && (window as any).google) {
      const google = (window as any).google;
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
      });
      google.accounts.id.renderButton(
        document.getElementById('google-login-btn'),
        { theme: 'outline', size: 'large', width: '100%' }
      );
    }
  }, [googleClientId]);

  // Google callback
  const handleGoogleCallback = async (response: any) => {
    setLoading(true);
    const idToken = response.credential;

    try {
      const loginRes = await api.post('/auth/google-login', { idToken });
      const { success, user, isNew, code, email, name } = loginRes.data;

      if (success) {
        localStorage.setItem('user', JSON.stringify(user));
        if (isNew) {
          navigate('/onboarding');
        } else {
          navigate('/');
        }
      } else if (code === 'USER_NOT_FOUND') {
        // Redirection to signup page carrying Google account state
        alert('No account matches this Google email. Redirecting to Signup to link a phone number.');
        navigate('/signup', { state: { googleUser: { email, name, idToken } } });
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      alert(error.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Mock Developer login
  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail) return;
    setLoading(true);

    const email = devEmail.trim().toLowerCase();
    const idToken = `mock-token-${email}`;
    const name = email.split('@')[0];

    try {
      const loginRes = await api.post('/auth/google-login', { idToken });
      const { success, user, isNew, code } = loginRes.data;

      if (success) {
        localStorage.setItem('user', JSON.stringify(user));
        if (isNew) {
          navigate('/onboarding');
        } else {
          navigate('/');
        }
      } else if (code === 'USER_NOT_FOUND') {
        alert('User not found. Redirecting to signup with test credentials.');
        navigate('/signup', { state: { googleUser: { email, name, idToken } } });
      }
    } catch (error: any) {
      console.error('Developer login error:', error);
      alert(error.response?.data?.error || 'Authentication error in mock login');
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
            <div className="flex flex-col gap-4 animate-fadeUp">
              <p className="text-sm text-[var(--text-muted)] text-center leading-relaxed mb-1">
                Please log in using your registered Google account.
              </p>

              {googleClientId ? (
                <div className="flex flex-col items-center justify-center min-h-[46px] w-full bg-white/5 rounded-2xl p-1 border border-white/10">
                  <div id="google-login-btn" className="w-full"></div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-950/20 border border-yellow-800/30 rounded-2xl text-xs text-yellow-500/90 leading-normal mb-2 text-center">
                  ⚠️ Google Client ID is not configured. Falling back to Developer Mock Login below.
                </div>
              )}

              {/* Developer Sandbox */}
              <form onSubmit={handleDevLogin} className="flex flex-col gap-3 mt-2 border-t border-white/5 pt-4">
                <div className="text-center text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] mb-1">
                  Developer Sandbox
                </div>
                <div>
                  <label className="block mb-1 text-[11px] font-semibold text-white/50">Registered Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul.sharma@gmail.com"
                    className="input-luxury text-sm"
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !devEmail}
                  className="w-full font-bold py-3.5 rounded-2xl transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2 btn-crimson text-sm"
                >
                  {loading ? 'Logging in...' : 'Sign In with Mock Google'}
                </button>
              </form>

              <div className="text-center mt-3 border-t border-white/5 pt-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="text-xs font-semibold text-[var(--gold)] hover:underline flex items-center gap-1.5 justify-center mx-auto"
                >
                  New to Varudu? Create an account
                </button>
              </div>
            </div>
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
