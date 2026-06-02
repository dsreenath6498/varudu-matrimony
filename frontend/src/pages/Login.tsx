import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Heart } from 'lucide-react';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Phone, 2 = OTP
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { phoneNumber });
      setStep(2);
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
      
      // Store user info in localStorage for simple auth state
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

  const showOtp = step === 2;
  const phone = phoneNumber;
  const setPhone = setPhoneNumber;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-rose-900 to-amber-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-200 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
            <Heart className="w-8 h-8 text-red-700 fill-current" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-amber-100">Varudu</h1>
          <p className="text-rose-200 text-sm mt-2 font-medium">Find your perfect match today</p>
        </div>

        {!showOtp ? (
          <div className="space-y-4">
            <input 
              type="tel" 
              placeholder="Enter Phone Number" 
              className="w-full px-4 py-3 bg-white/5 border border-rose-300/30 rounded-xl text-white placeholder:text-rose-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button 
              onClick={requestOtp}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-red-900 font-bold py-3 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Get OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Enter OTP (e.g. 1234)" 
              className="w-full px-4 py-3 bg-white/5 border border-rose-300/30 rounded-xl text-white placeholder:text-rose-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-center tracking-widest text-lg"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button 
              onClick={verifyOtp}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-red-900 font-bold py-3 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
