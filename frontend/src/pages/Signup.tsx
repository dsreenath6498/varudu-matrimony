import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { Heart, Mail, ArrowLeft } from 'lucide-react';

// Floating petal component
export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Steps: 1 = Google Auth, 2 = Phone number input, 3 = OTP verification
  const [step, setStep] = useState(1);
  const [googleUser, setGoogleUser] = useState<{ email: string; name: string; idToken: string } | null>(null);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneVisible, setPhoneVisible] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [devEmail, setDevEmail] = useState('');
  const [devName, setDevName] = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

  const goToPrivacyStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setTransitioning(true);
    setTimeout(() => {
      setStep(4);
      setTransitioning(false);
    }, 300);
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
        otp,
        phoneVisible
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
      className="min-h-screen flex items-center justify-center p-4 bg-[#F5F5F7]"
    >
      {/* Signup Card */}
      <div
        className="w-full max-w-sm"
        style={{ animation: 'fadeUp 0.5s ease both' }}
      >
        <div
          className="rounded-3xl p-8 bg-white border border-neutral-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden"
        >
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-black"
            >
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>

            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight font-sans">
              create account
            </h1>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.15em] mt-1.5 font-sans">
              Join Varudu Matrimony
            </p>
          </div>

          {/* Transition Wrapper */}
          <div
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateX(-10px)' : 'translateX(0)',
              transition: 'all 0.2s ease',
            }}
          >
            {/* STEP 1: Google Authentication */}
            {step === 1 && (
              <div className="flex flex-col gap-4 font-sans">
                <p className="text-xs text-neutral-500 text-center leading-relaxed mb-2 font-sans">
                  To get started, authenticate with your Google account.
                </p>

                {googleClientId ? (
                  <div className="flex flex-col items-center justify-center min-h-[46px] w-full bg-neutral-50 rounded-2xl p-1 border border-neutral-200">
                    <div id="google-signup-btn" className="w-full"></div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-xs text-yellow-800 leading-normal mb-2 text-center font-sans">
                    ⚠️ Google Client ID is not configured. Falling back to Developer Mock Auth mode below.
                  </div>
                )}

                {/* Mock sign-in fields for development */}
                <form onSubmit={handleDevGoogleLogin} className="flex flex-col gap-3 mt-2 border-t border-neutral-100 pt-4 font-sans">
                  <div className="text-center text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">
                    Developer Sandbox
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Test Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul.sharma@gmail.com"
                      className="w-full rounded-xl p-3 outline-none border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-black text-neutral-900 text-sm transition-all font-sans"
                      value={devEmail}
                      onChange={(e) => setDevEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      className="w-full rounded-xl p-3 outline-none border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-black text-neutral-900 text-sm transition-all font-sans"
                      value={devName}
                      onChange={(e) => setDevName(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !devEmail}
                    className="w-full font-medium py-3 rounded-full bg-black hover:bg-neutral-900 text-white transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 text-sm mt-1"
                  >
                    {loading ? 'Authenticating...' : 'Sign Up with Mock Google'}
                  </button>
                </form>

                <div className="text-center mt-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-xs font-semibold text-[#0071E3] hover:underline flex items-center gap-1.5 justify-center mx-auto"
                  >
                    Already have an account? Log in
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Phone number input */}
            {step === 2 && googleUser && (
              <form onSubmit={handleRequestOtp} className="flex flex-col gap-4 font-sans">
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold font-sans">
                    {googleUser.name[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate text-neutral-900 font-sans">{googleUser.name}</p>
                    <p className="text-[10px] text-neutral-500 truncate flex items-center gap-1 mt-0.5 font-sans">
                      <Mail className="w-3 h-3 text-neutral-400" />
                      {googleUser.email}
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <label className="block mb-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Verify Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400 font-semibold font-sans">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      placeholder="98765 43210"
                      className="w-full rounded-xl p-3 pl-12 outline-none border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-black text-neutral-900 tracking-wider text-sm transition-all font-sans"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed font-sans">
                    An OTP will be sent to verify your phone number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phoneNumber.length !== 10}
                  className="w-full font-medium py-3 rounded-full bg-black hover:bg-neutral-900 text-white transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending OTP...
                    </span>
                  ) : (
                    <span>Send Verification OTP</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGoogleUser(null);
                    setStep(1);
                  }}
                  className="text-xs text-neutral-500 hover:underline flex items-center gap-1.5 justify-center mt-1 font-sans"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Google Sign-in
                </button>
              </form>
            )}

            {/* STEP 3: OTP verification */}
            {step === 3 && googleUser && (
              <form onSubmit={goToPrivacyStep} className="flex flex-col gap-4 font-sans text-left">
                <div className="text-center font-sans">
                  <p className="text-[11px] text-neutral-500 font-sans">Verification code sent to</p>
                  <p className="font-semibold text-xs mt-0.5 text-neutral-800 font-sans">+91 {phoneNumber}</p>
                </div>

                <div>
                  <label className="block mb-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider font-sans">
                    Enter 4-Digit OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="• • • •"
                    className="w-full rounded-xl p-3 outline-none border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-black text-neutral-900 text-center tracking-[0.5em] text-lg font-bold transition-all font-sans"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <p className="text-[10px] text-center text-neutral-400 mt-1.5 font-sans">
                    Enter the OTP shown in your backend console terminal.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp}
                  className="w-full font-medium py-3 rounded-full bg-black hover:bg-neutral-900 text-white transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 text-sm mt-2 font-sans"
                >
                  Next: Security Preferences
                </button>

                <div className="flex justify-between items-center px-1 mt-2 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setTransitioning(true);
                      setTimeout(() => {
                        setStep(2);
                        setTransitioning(false);
                      }, 300);
                    }}
                    className="text-xs text-neutral-500 hover:underline flex items-center gap-1"
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
                    className="text-xs text-[#0071E3] font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Phone Visibility Privacy Choice */}
            {step === 4 && googleUser && (
              <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-4 font-sans text-left">
                <div className="text-center mb-2 font-sans">
                  <span className="text-3xl select-none">🔒</span>
                  <h2 className="text-sm font-bold text-neutral-800 tracking-tight mt-2 font-sans">Phone Number Privacy</h2>
                  <p className="text-[10px] text-neutral-400 mt-1 leading-normal font-sans">
                    Choose how your phone number is displayed to matches.
                  </p>
                </div>

                {/* Selection Options */}
                <div className="flex flex-col gap-3 font-sans">
                  {/* Option 1: Lock & Unlock for 5 Roses */}
                  <div
                    onClick={() => setPhoneVisible(true)}
                    className={`rounded-2xl p-4 border-2 transition-all cursor-pointer flex items-start gap-3 ${
                      phoneVisible
                        ? 'border-black bg-neutral-50/50'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full flex items-center justify-center border border-black/10 mt-0.5 text-[8px]">
                      {phoneVisible ? '●' : '○'}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-neutral-800 font-sans">Allow Unlock (Recommended)</p>
                      <p className="text-[10px] leading-relaxed text-neutral-500 mt-0.5 font-sans">
                        Your number starts locked. Matches can pay <strong>5 Roses</strong> to view it.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Keep Hidden */}
                  <div
                    onClick={() => setPhoneVisible(false)}
                    className={`rounded-2xl p-4 border-2 transition-all cursor-pointer flex items-start gap-3 ${
                      !phoneVisible
                        ? 'border-black bg-neutral-50/50'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full flex items-center justify-center border border-black/10 mt-0.5 text-[8px]">
                      {!phoneVisible ? '●' : '○'}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-neutral-800 font-sans">Keep Completely Private</p>
                      <p className="text-[10px] leading-relaxed text-neutral-500 mt-0.5 font-sans">
                        Do not share your phone number. Other users cannot view or request it.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-medium py-3.5 rounded-full bg-black hover:bg-neutral-900 text-white transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 text-sm mt-3 font-sans"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    'Complete Registration'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTransitioning(true);
                    setTimeout(() => {
                      setStep(3);
                      setTransitioning(false);
                    }, 300);
                  }}
                  className="text-xs text-neutral-500 hover:underline flex items-center gap-1.5 justify-center mt-1 font-sans"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to OTP Code
                </button>
              </form>
            )}
          </div>

          {/* Card footer */}
          <p className="text-center text-[10px] mt-6 text-neutral-400 leading-normal border-t border-neutral-100 pt-4 font-sans">
            By creating an account, you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
