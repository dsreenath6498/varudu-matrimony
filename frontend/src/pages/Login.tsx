import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const transitioning = false;
  const [devEmail, setDevEmail] = useState('');
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize real Google Sign-In GSI client if client ID exists
  useEffect(() => {
    if (googleClientId && (window as any).google) {
      try {
        const google = (window as any).google;
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
        });
        const btnElem = document.getElementById('google-login-btn');
        if (btnElem) {
          btnElem.innerHTML = '';
          google.accounts.id.renderButton(
            btnElem,
            { theme: 'outline', size: 'large', width: 280 }
          );
        }
      } catch (err) {
        console.warn('Google GSI init warning:', err);
      }
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
      className="min-h-screen flex items-center justify-center p-4 bg-transparent"
    >
      {/* Transparent Login Area (No white box container) */}
      <div
        className="w-full max-w-sm px-4 py-6"
        style={{ animation: 'fadeUp 0.5s ease both' }}
      >
        <div className="flex flex-col items-center select-none">
          
          {/* Logo section */}
          <div className="flex flex-col items-center mb-6 text-center">
            <img 
              src="/varudu_gold_title.png" 
              alt="Varudu" 
              className="h-20 md:h-24 w-auto object-contain mix-blend-multiply mb-1 filter contrast-105"
            />
            <p 
              className="text-sm font-serif tracking-widest text-[#5A4533] leading-tight"
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
            >
              Meaningful Matches<br />for a Brighter Tomorrow
            </p>
          </div>

          {/* Form area */}
          <div
            className="w-full"
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateX(-10px)' : 'translateX(0)',
              transition: 'all 0.2s ease',
            }}
          >
            <div className="flex flex-col gap-4 w-full">
              <p className="text-xs text-[#6E5A47] text-center font-medium leading-relaxed mb-1">
                Please log in using your registered Google account.
              </p>

              {googleClientId ? (
                <div className="flex flex-col items-center justify-center min-h-[46px] w-full bg-white/40 backdrop-blur-md rounded-2xl p-1 border border-[#5C3A21]/20">
                  <div id="google-login-btn" className="w-full"></div>
                </div>
              ) : (
                <div className="p-3.5 bg-yellow-50/80 backdrop-blur-sm border border-yellow-300/80 rounded-2xl text-xs text-yellow-900 leading-normal mb-1 text-center font-sans">
                  ⚠️ Google Client ID is not configured. Falling back to Developer Mock Login below.
                </div>
              )}

              {/* Developer Sandbox */}
              <form onSubmit={handleDevLogin} className="flex flex-col gap-3 mt-2 border-t border-[#5C3A21]/20 pt-4 font-sans">
                <div className="text-center text-[10px] uppercase font-bold tracking-widest text-[#7A6B5D] mb-1">
                  Developer Sandbox
                </div>
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-[#5C3A21] uppercase tracking-wider">Registered Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul.sharma@gmail.com"
                    className="w-full rounded-xl p-3 outline-none border border-[#5C3A21]/30 bg-white/50 focus:bg-white/80 text-[#2C2825] text-sm transition-all font-sans placeholder-[#7A6B5D] backdrop-blur-sm"
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !devEmail}
                  className="w-full font-semibold py-3 rounded-full bg-[#5C3A21] hover:bg-[#4A2E19] text-white transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 text-sm shadow-md active:scale-95"
                >
                  {loading ? 'Logging in...' : 'Sign In with Mock Google'}
                </button>
              </form>

              <div className="text-center mt-3 border-t border-[#5C3A21]/20 pt-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="text-xs font-semibold text-[#5C3A21] hover:underline flex items-center gap-1.5 justify-center mx-auto"
                >
                  New to Varudu? Create an account
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] mt-6 text-[#7A6B5D] font-sans">
            By continuing, you agree to our Terms & Privacy Policy
          </p>

        </div>
      </div>
    </div>
  );
}
