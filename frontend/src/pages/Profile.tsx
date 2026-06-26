import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';
import { ShieldCheck, ArrowLeft, ShieldAlert, Users, Pencil, X } from 'lucide-react';

export interface FamilyDetails {
  father_name: string;
  father_job: string;
  father_expired: boolean;
  mother_name: string;
  mother_job: string;
  mother_expired: boolean;
  family_type: string;
  family_status: string;
  brothers: number;
  sisters: number;
}

interface UserData {
  id: string;
  name: string;
  age: number;
  place: string;
  gender: string;
  interested_in: string;
  photos: string[];
  aadhaar_verified: boolean;
  face_verified: boolean;
  family_details?: FamilyDetails;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyLoading, setFamilyLoading] = useState(false);
  
  // Aadhaar states
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [refId, setRefId] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');

  // Face Verification states
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceError, setFaceError] = useState('');
  const [faceSuccess, setFaceSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [familyData, setFamilyData] = useState<FamilyDetails>({
    father_name: '',
    father_job: '',
    father_expired: false,
    mother_name: '',
    mother_job: '',
    mother_expired: false,
    family_type: 'Nuclear',
    family_status: 'Middle Class',
    brothers: 0,
    sisters: 0,
  });

  const fetchProfile = async () => {
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!localUser.id) return navigate('/login');
    
    try {
      const res = await api.get('/profile/me', { params: { userId: localUser.id } });
      setUser(res.data.user);
      if (res.data.user.family_details) {
        if (Object.keys(res.data.user.family_details).length > 0) {
          setFamilyData(prev => ({ ...prev, ...res.data.user.family_details }));
        }
      }
      // Update local storage so other components know if verified
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const startCamera = async () => {
    try {
      setCapturedImage(null);
      setFaceError('');
      setFaceSuccess(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Webcam access error:', err);
      setFaceError('Could not access your camera. Please ensure permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 480;
        
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFaceVerify = async () => {
    if (!capturedImage || !user?.id) return;
    setFaceLoading(true);
    setFaceError('');

    try {
      const response = await api.post('/profile/verify-face', {
        userId: user.id,
        selfieDataUrl: capturedImage
      });

      if (response.data.success) {
        setFaceSuccess(true);
        await fetchProfile();
        setTimeout(() => {
          setShowFaceModal(false);
          setCapturedImage(null);
          setFaceSuccess(false);
        }, 2500);
      } else {
        setFaceError(response.data.message || 'Verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Face verify error:', err);
      setFaceError(err.response?.data?.error || 'Verification failed due to a server error. Please try again.');
    } finally {
      setFaceLoading(false);
    }
  };

  useEffect(() => {
    if (showFaceModal) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showFaceModal]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarNumber.length !== 12) {
      setError('Aadhaar number must be 12 digits');
      return;
    }
    setError('');
    setVerifyLoading(true);
    
    try {
      const res = await api.post('/verify/send-otp', {
        aadhaar_number: aadhaarNumber,
        userId: user?.id
      });
      setRefId(res.data.ref_id);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }
    setError('');
    setVerifyLoading(true);

    try {
      await api.post('/verify/verify-otp', {
        otp,
        ref_id: refId,
        userId: user?.id
      });
      // Success! Update profile to reflect verification
      setShowAadhaarModal(false);
      setStep(1);
      setAadhaarNumber('');
      setOtp('');
      await fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleUpdateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setFamilyLoading(true);
    setError('');
    try {
      await api.put('/profile/update-family', {
        userId: user?.id,
        familyDetails: familyData
      });
      setShowFamilyModal(false);
      await fetchProfile(); // Reload profile data
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update family details');
    } finally {
      setFamilyLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0 md:ml-64" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)' }}>
        <button onClick={() => navigate(-1)} className="rounded-full p-2 flex items-center justify-center transition-all hover:scale-110" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(212,175,55,0.7)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold" style={{ fontFamily: '"Cormorant Garamond", serif', background: 'linear-gradient(135deg, #FFD700, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          My Profile
        </h1>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* DP Section */}
          <div className="flex flex-col items-center mt-4">
            <div className="relative">
              <div 
                className={`w-32 h-32 rounded-full overflow-hidden object-cover transition-all duration-500 ${user?.aadhaar_verified ? 'ring-4 ring-offset-4 ring-offset-[#0a0008]' : ''}`}
                style={{
                   // Silver ring if verified
                   borderColor: user?.aadhaar_verified ? '#C0C0C0' : 'transparent',
                   boxShadow: user?.aadhaar_verified ? '0 0 20px rgba(192, 192, 192, 0.4)' : 'none',
                   background: user?.aadhaar_verified ? 'linear-gradient(135deg, #E0E0E0, #9E9E9E, #F5F5F5)' : 'none',
                   padding: user?.aadhaar_verified ? '3px' : '0'
                }}
              >
                <img 
                  src={user?.photos?.[0] || 'https://via.placeholder.com/150'} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full" 
                />
              </div>

              {/* Verified Badge */}
              {user?.aadhaar_verified && (
                <div className="absolute -bottom-2 right-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-1.5 shadow-[0_0_10px_rgba(34,197,94,0.5)] flex items-center justify-center border border-green-200">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Face Verified Badge (Bottom Left) */}
              {user?.face_verified && (
                <div className="absolute -bottom-2 left-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-1.5 shadow-[0_0_10px_rgba(59,130,246,0.5)] flex items-center justify-center border border-blue-200" title="Face Verified">
                  <svg className="w-4 h-4 text-white fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>

            <h2 className="mt-5 text-2xl font-bold text-white tracking-wide flex items-center justify-center gap-1.5">
              {user?.name}, {user?.age}
              {user?.face_verified && (
                <span className="inline-flex items-center justify-center bg-blue-500 text-white rounded-full p-0.5" title="Face Verified">
                  <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{user?.place}</p>
          </div>

          {/* Verification Status Cards */}
          <div className="space-y-4">
            {/* Aadhaar Verification Card */}
            <div className="p-5 rounded-2xl border bg-white/5 backdrop-blur-md" style={{ borderColor: user?.aadhaar_verified ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${user?.aadhaar_verified ? 'bg-green-500/10' : 'bg-rose-500/10'}`}>
                  {user?.aadhaar_verified ? (
                    <ShieldCheck className="w-6 h-6 text-green-400" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-rose-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    {user?.aadhaar_verified ? 'Identity Verified' : 'Identity Not Verified'}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {user?.aadhaar_verified 
                      ? 'Your Aadhaar is verified. You have the verified badge and silver ring!' 
                      : 'Verify your Aadhaar to get a silver ring around your profile and a verified badge.'}
                  </p>
                  {!user?.aadhaar_verified && (
                    <button 
                      onClick={() => setShowAadhaarModal(true)}
                      className="mt-4 px-5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all"
                    >
                      Verify Aadhaar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* AI Face Verification Card */}
            <div className="p-5 rounded-2xl border bg-white/5 backdrop-blur-md" style={{ borderColor: user?.face_verified ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${user?.face_verified ? 'bg-blue-500/10' : 'bg-rose-500/10'}`}>
                  {user?.face_verified ? (
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-rose-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    {user?.face_verified ? 'AI Face Verified' : 'AI Face Not Verified'}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {user?.face_verified 
                      ? 'Your face verification is complete. You have the blue verified badge!' 
                      : 'Complete a live selfie verification to get a blue checkmark badge on your profile.'}
                  </p>
                  {!user?.face_verified && (
                    <button 
                      onClick={() => setShowFaceModal(true)}
                      className="mt-4 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
                    >
                      Verify with AI Selfie
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

          {/* Family Details Card */}
          <div className="p-5 rounded-2xl border-2 bg-[#FFFDF9] mt-6 shadow-[0_0_15px_rgba(212,175,55,0.2)]" style={{ borderColor: '#D4AF37' }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-full bg-[#D4AF37]/20">
                  <Users className="w-5 h-5 text-[#8b5a2b]" />
                </div>
                <h3 className="text-lg font-bold text-[#4a2e1b]">Family Details</h3>
              </div>
              <button 
                onClick={() => setShowFamilyModal(true)}
                className="p-2 rounded-full bg-[#D4AF37]/10 hover:bg-[#D4AF37]/30 transition-colors"
              >
                <Pencil className="w-4 h-4 text-[#4a2e1b]" />
              </button>
            </div>
            
            {user?.family_details && Object.keys(user.family_details).length > 0 ? (
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#8b5a2b] font-semibold">Father</p>
                    <p className="text-sm text-[#4a2e1b] font-bold">
                      {user.family_details.father_name || 'N/A'}
                      {user.family_details.father_expired ? ' (Late)' : ''}
                    </p>
                    <p className="text-xs text-[#5c4033] font-medium">{user.family_details.father_job}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b5a2b] font-semibold">Mother</p>
                    <p className="text-sm text-[#4a2e1b] font-bold">
                      {user.family_details.mother_name || 'N/A'}
                      {user.family_details.mother_expired ? ' (Late)' : ''}
                    </p>
                    <p className="text-xs text-[#5c4033] font-medium">{user.family_details.mother_job}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#D4AF37]/30">
                  <div>
                    <p className="text-xs text-[#8b5a2b] font-semibold">Family Type</p>
                    <p className="text-sm text-[#4a2e1b] font-bold">{user.family_details.family_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b5a2b] font-semibold">Status</p>
                    <p className="text-sm text-[#4a2e1b] font-bold">{user.family_details.family_status || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#D4AF37]/30">
                  <div>
                    <p className="text-xs text-[#8b5a2b] font-semibold">Brothers</p>
                    <p className="text-sm text-[#4a2e1b] font-bold">{user.family_details.brothers || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b5a2b] font-semibold">Sisters</p>
                    <p className="text-sm text-[#4a2e1b] font-bold">{user.family_details.sisters || 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-[#5c4033] mb-3 font-medium">Add your family details to get better matches.</p>
                <button 
                  onClick={() => setShowFamilyModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-[#4a2e1b] hover:scale-105 text-xs font-bold rounded-lg transition-all shadow-md"
                >
                  Add Details
                </button>
              </div>
            )}
          </div>

      </div>

      <Navbar />

      {/* Aadhaar Modal */}
      {showAadhaarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#120a15] border border-white/10 p-6 rounded-2xl w-full max-w-sm relative">
            <button 
              onClick={() => { setShowAadhaarModal(false); setStep(1); setError(''); }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white mb-2">Aadhaar Verification</h2>
            <p className="text-sm text-gray-400 mb-6">Secured by Cashfree Payments</p>

            {error && <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Aadhaar Number</label>
                  <input 
                    type="text" 
                    value={aadhaarNumber}
                    onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="Enter 12 digit Aadhaar"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={verifyLoading}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {verifyLoading ? 'Sending...' : 'Get OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Enter OTP</label>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6 digit OTP"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 text-center tracking-widest text-lg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">OTP sent to Aadhaar linked mobile number</p>
                </div>
                <button 
                  type="submit" 
                  disabled={verifyLoading}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {verifyLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Family Details Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#120a15] border border-white/10 p-6 rounded-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setShowFamilyModal(false); setError(''); }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Family Details</h2>

            {error && <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

            <form onSubmit={handleUpdateFamily} className="space-y-5">
              
              {/* Father Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 border-b border-white/10 pb-1">Father's Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Name</label>
                    <input 
                      type="text" 
                      value={familyData.father_name}
                      onChange={e => setFamilyData({...familyData, father_name: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Occupation</label>
                    <input 
                      type="text" 
                      value={familyData.father_job}
                      onChange={e => setFamilyData({...familyData, father_job: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="father_expired"
                    checked={familyData.father_expired}
                    onChange={e => setFamilyData({...familyData, father_expired: e.target.checked})}
                    className="rounded border-gray-600 bg-black/30"
                  />
                  <label htmlFor="father_expired" className="text-xs text-gray-400">Late / Deceased</label>
                </div>
              </div>

              {/* Mother Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 border-b border-white/10 pb-1">Mother's Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Name</label>
                    <input 
                      type="text" 
                      value={familyData.mother_name}
                      onChange={e => setFamilyData({...familyData, mother_name: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Occupation</label>
                    <input 
                      type="text" 
                      value={familyData.mother_job}
                      onChange={e => setFamilyData({...familyData, mother_job: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="mother_expired"
                    checked={familyData.mother_expired}
                    onChange={e => setFamilyData({...familyData, mother_expired: e.target.checked})}
                    className="rounded border-gray-600 bg-black/30"
                  />
                  <label htmlFor="mother_expired" className="text-xs text-gray-400">Late / Deceased</label>
                </div>
              </div>

              {/* General Family Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 border-b border-white/10 pb-1">Family Structure</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Family Type</label>
                    <select 
                      value={familyData.family_type}
                      onChange={e => setFamilyData({...familyData, family_type: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Nuclear">Nuclear</option>
                      <option value="Joint">Joint</option>
                      <option value="Extended">Extended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Family Status</label>
                    <select 
                      value={familyData.family_status}
                      onChange={e => setFamilyData({...familyData, family_status: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Middle Class">Middle Class</option>
                      <option value="Upper Middle Class">Upper Middle Class</option>
                      <option value="Rich">Rich</option>
                      <option value="Affluent">Affluent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">No. of Brothers</label>
                    <input 
                      type="number" 
                      min="0"
                      value={familyData.brothers}
                      onChange={e => setFamilyData({...familyData, brothers: parseInt(e.target.value) || 0})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">No. of Sisters</label>
                    <input 
                      type="number" 
                      min="0"
                      value={familyData.sisters}
                      onChange={e => setFamilyData({...familyData, sisters: parseInt(e.target.value) || 0})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-white/10">
                <button 
                  type="submit" 
                  disabled={familyLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {familyLoading ? 'Saving...' : 'Save Family Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Verification Modal */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <style>{`
            @keyframes scanLaser {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
          `}</style>
          <div className="bg-[#120a15] border border-white/10 p-6 rounded-2xl w-full max-w-sm relative text-center">
            <button 
              onClick={() => { setShowFaceModal(false); stopCamera(); }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              disabled={faceLoading}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white mb-2">AI Face Verification</h2>
            <p className="text-xs text-gray-400 mb-6">Compare a live selfie with your profile picture</p>

            {faceError && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {faceError}
              </div>
            )}

            {faceSuccess && (
              <div className="p-4 mb-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-green-400 animate-bounce" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Identity Matched Successfully!
              </div>
            )}

            <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-white/10 bg-black/50 mb-6">
              {/* Webcam Video */}
              {!capturedImage && (
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}

              {/* Captured Photo */}
              {capturedImage && (
                <img 
                  src={capturedImage}
                  alt="Selfie"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Scanner HUD Overlay */}
              {!faceSuccess && (
                <div className="absolute inset-0 pointer-events-none border-4 border-[#3B82F6]/30 rounded-full flex items-center justify-center">
                  <div className="w-[85%] h-[85%] border-2 border-dashed border-[#3B82F6]/40 rounded-full animate-[spin_10s_linear_infinite]" />
                </div>
              )}

              {/* Scanning Laser Line */}
              {faceLoading && (
                <div 
                  className="absolute left-0 right-0 h-1 bg-[#3B82F6] shadow-[0_0_15px_#3B82F6] opacity-80"
                  style={{
                    animation: 'scanLaser 2s ease-in-out infinite'
                  }}
                />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="space-y-3">
              {!capturedImage ? (
                <button 
                  onClick={capturePhoto}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  Capture Selfie
                </button>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={startCamera}
                    disabled={faceLoading}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
                  >
                    Retake
                  </button>
                  <button 
                    onClick={handleFaceVerify}
                    disabled={faceLoading || faceSuccess}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {faceLoading ? 'Verifying...' : 'Verify Now'}
                  </button>
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-500 mt-4 leading-normal">
              Align your face clearly in the circle. Make sure you are in a bright room.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
