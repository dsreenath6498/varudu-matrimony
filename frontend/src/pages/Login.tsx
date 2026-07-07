import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Heart } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const transitioning = false;
  const [devEmail, setDevEmail] = useState('');
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
      className="min-h-screen flex items-center justify-center p-4 bg-[#F5F5F7]"
    >
      {/* Login Card */}
      <div
        className="w-full max-w-sm"
        style={{ animation: 'fadeUp 0.5s ease both' }}
      >
        <div
          className="rounded-3xl p-8 bg-white border border-neutral-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
        >
          {/* Logo section */}
          <div
            className="flex flex-col items-center mb-8"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-black"
            >
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>

            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight font-sans">
              varudu
            </h1>

            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.15em] mt-1.5 font-sans">
              Premium Matrimony
            </p>
          </div>

          {/* Form area */}
          <div
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateX(-10px)' : 'translateX(0)',
              transition: 'all 0.2s ease',
            }}
          >
            <div className="flex flex-col gap-4">
              <p className="text-xs text-neutral-500 text-center leading-relaxed mb-1 font-sans">
                Please log in using your registered Google account.
              </p>

              {googleClientId ? (
                <div className="flex flex-col items-center justify-center min-h-[46px] w-full bg-neutral-50 rounded-2xl p-1 border border-neutral-200">
                  <div id="google-login-btn" className="w-full"></div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-xs text-yellow-800 leading-normal mb-2 text-center font-sans">
                  ⚠️ Google Client ID is not configured. Falling back to Developer Mock Login below.
                </div>
              )}

              {/* Developer Sandbox */}
              <form onSubmit={handleDevLogin} className="flex flex-col gap-3 mt-2 border-t border-neutral-100 pt-4 font-sans">
                <div className="text-center text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">
                  Developer Sandbox
                </div>
                <div>
                  <label className="block mb-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Registered Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul.sharma@gmail.com"
                    className="w-full rounded-xl p-3 outline-none border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-black text-neutral-900 text-sm transition-all font-sans"
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !devEmail}
                  className="w-full font-medium py-3 rounded-full bg-black hover:bg-neutral-900 text-white transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? 'Logging in...' : 'Sign In with Mock Google'}
                </button>
              </form>

              <div className="text-center mt-3 border-t border-neutral-100 pt-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="text-xs font-semibold text-[#0071E3] hover:underline flex items-center gap-1.5 justify-center mx-auto"
                >
                  New to Varudu? Create an account
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] mt-6 text-neutral-400 font-sans">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
