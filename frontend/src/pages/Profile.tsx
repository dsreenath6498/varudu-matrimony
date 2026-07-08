import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';
import { ShieldCheck, ArrowLeft, Pencil, X, Lock, Unlock } from 'lucide-react';

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
  dob?: string;
  tob?: string;
  pob?: string;
  family_details?: FamilyDetails;
  phone_visible?: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyLoading, setFamilyLoading] = useState(false);
  
  // Birth details states
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [birthData, setBirthData] = useState({ dob: '', tob: '', pob: '' });
  const [birthLoading, setBirthLoading] = useState(false);
  
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

  // Photo upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('photo', file);

    try {
      await api.post('/profile/update-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchProfile();
      alert('Profile photo updated successfully!');
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      alert(err.response?.data?.error || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

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

  const handleUpdateBirth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setBirthLoading(true);
    setError('');
    try {
      await api.post('/astro/update-birth-details', {
        userId: user.id,
        dob: birthData.dob,
        tob: birthData.tob,
        pob: birthData.pob
      });
      setShowBirthModal(false);
      await fetchProfile(); // Reload profile data
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update birth details');
    } finally {
      setBirthLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0 md:ml-44 bg-white font-sans text-[#1D1D1F]">
      
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between bg-white border-b border-neutral-150">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="rounded-full p-2.5 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
            My Profile
          </h1>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto max-w-lg mx-auto w-full">
        <div className="space-y-8">
          
          {/* DP Section */}
          <div className="flex flex-col items-center mt-4">
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleUploadPhoto} 
                className="hidden" 
                accept="image/*" 
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-32 h-32 rounded-full overflow-hidden object-cover transition-all duration-300 cursor-pointer relative group ${
                  user?.aadhaar_verified && user?.face_verified
                    ? 'ring-4 ring-[#0071E3] ring-offset-2' 
                    : user?.aadhaar_verified 
                      ? 'ring-4 ring-neutral-900 ring-offset-2' 
                      : 'ring-2 ring-neutral-200'
                }`}
              >
                {uploadingPhoto ? (
                  <div className="w-full h-full flex items-center justify-center bg-black/60 absolute inset-0">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                ) : null}
                <img 
                  src={user?.photos?.[0] || 'https://via.placeholder.com/150'} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-all duration-300" 
                />
              </div>

              {/* Edit Photo Icon Overlay */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-0 right-0 bg-neutral-900 hover:bg-black text-white rounded-full p-2 cursor-pointer transition-all hover:scale-110 shadow-md"
                title="Upload Profile Photo"
              >
                <Pencil className="w-3.5 h-3.5" />
              </div>

              {/* Verified Badge (Bottom Right) */}
              {user?.aadhaar_verified && (
                <div className="absolute -bottom-1 -right-1 bg-[#0071E3] rounded-full p-1.5 shadow-md flex items-center justify-center border-2 border-white" title="Aadhaar Verified">
                  <ShieldCheck className="w-4.5 h-4.5 text-white" />
                </div>
              )}

              {/* Face Verified Badge (Bottom Left) */}
              {user?.face_verified && (
                <div className="absolute -bottom-1 -left-1 bg-black rounded-full p-1.5 shadow-md flex items-center justify-center border-2 border-white" title="Face Verified">
                  <svg className="w-4.5 h-4.5 text-white fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>

            <h2 className="mt-5 text-2xl font-bold text-black tracking-tight flex items-center justify-center gap-1.5">
              {user?.name}, <span className="font-normal text-neutral-500">{user?.age}</span>
            </h2>
            <p className="text-neutral-500 text-sm mt-1">{user?.place}</p>
          </div>

          {/* ── LEVELS OF VERIFICATION ── */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-bold text-black uppercase tracking-wider">Levels of Verification</h3>

            {/* Verification Progress Slider */}
            <div className="p-5 rounded-2xl border border-neutral-200 bg-white text-left space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-neutral-500 uppercase tracking-wider">
                <span>Verification Progress</span>
                <span className="font-extrabold text-[#0071E3]">
                  {user?.aadhaar_verified && user?.face_verified ? '100% (Complete)' : user?.aadhaar_verified || user?.face_verified ? '50% (Level 1)' : '0%'}
                </span>
              </div>
              <div className="relative w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0071E3] transition-all duration-500 rounded-full"
                  style={{ 
                    width: user?.aadhaar_verified && user?.face_verified ? '100%' : user?.aadhaar_verified || user?.face_verified ? '50%' : '0%' 
                  }}
                />
              </div>
              <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide">
                Complete Level 1 & Level 2 to get the blue checkmark badge!
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3.5">
              {/* Level 1: Aadhaar Identity */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-white flex flex-col justify-between min-h-[160px]">
                <div className="text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Level 1</span>
                    {user?.aadhaar_verified ? (
                      <span className="text-[8px] font-extrabold text-[#0071E3] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">Complete</span>
                    ) : (
                      <span className="text-[8px] font-extrabold text-neutral-450 uppercase tracking-wider bg-neutral-100 px-2 py-0.5 rounded-full">Pending</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-black mt-2.5">Aadhaar Identity</h4>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
                    {user?.aadhaar_verified 
                      ? 'Government identity validated.' 
                      : 'Verify identity to activate Level 1.'}
                  </p>
                </div>
                {!user?.aadhaar_verified && (
                  <button 
                    onClick={() => setShowAadhaarModal(true)}
                    className="mt-3 w-full py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[10px] font-bold rounded-full shadow-sm transition-all active:scale-95"
                  >
                    Verify
                  </button>
                )}
              </div>

              {/* Level 2: AI Face Verify */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-white flex flex-col justify-between min-h-[160px]">
                <div className="text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Level 2</span>
                    {user?.face_verified ? (
                      <span className="text-[8px] font-extrabold text-[#0071E3] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">Complete</span>
                    ) : (
                      <span className="text-[8px] font-extrabold text-neutral-450 uppercase tracking-wider bg-neutral-100 px-2 py-0.5 rounded-full">Pending</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-black mt-2.5">Live AI Selfie</h4>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
                    {user?.face_verified 
                      ? 'AI Face Match check complete.' 
                      : 'Match selfie with DP to activate Level 2.'}
                  </p>
                </div>
                {!user?.face_verified && (
                  <button 
                    onClick={() => setShowFaceModal(true)}
                    className="mt-3 w-full py-2 border border-[#0071E3] text-[#0071E3] hover:bg-blue-50/50 text-[10px] font-bold rounded-full transition-all active:scale-95"
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Phone Privacy Settings Card */}
          <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full flex-shrink-0 ${user?.phone_visible ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                {user?.phone_visible ? (
                  <Unlock className="w-6 h-6" />
                ) : (
                  <Lock className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-base font-bold text-black">
                  Phone Number Privacy
                </h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  {user?.phone_visible 
                    ? 'Other users can spend 5 Roses to unlock your verified phone number.' 
                    : 'Your phone number is completely private and hidden from matches.'}
                </p>
                <button 
                  onClick={async () => {
                    if (!user) return;
                    try {
                      const nextVal = !user.phone_visible;
                      const res = await api.put('/profile/toggle-phone-privacy', {
                        userId: user.id,
                        phoneVisible: nextVal
                      });
                      if (res.data.success) {
                        setUser(res.data.user);
                        localStorage.setItem('user', JSON.stringify(res.data.user));
                        alert(`Privacy status updated. Phone number is now ${nextVal ? 'visible via unlock' : 'completely hidden'}.`);
                      }
                    } catch (err: any) {
                      alert('Failed to update phone settings');
                    }
                  }}
                  className="mt-4 px-4 py-2 border border-black text-black hover:bg-neutral-50 text-[10px] font-extrabold uppercase tracking-wider rounded-full transition-all"
                >
                  {user?.phone_visible ? 'Keep Private' : 'Allow Matches to Unlock'}
                </button>
              </div>
            </div>
          </div>

          {/* Horoscope & Birth Details Card */}
          <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
              <h3 className="text-base font-bold text-black uppercase tracking-wider">Birth Astro Details</h3>
              <button 
                onClick={() => {
                  setBirthData({
                    dob: user?.dob || '',
                    tob: user?.tob || '',
                    pob: user?.pob || ''
                  });
                  setShowBirthModal(true);
                }}
                className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
                title="Edit Astro Details"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            
            {user?.dob || user?.tob || user?.pob ? (
              <div className="grid grid-cols-3 gap-4 text-left">
                <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Date of Birth</p>
                  <p className="font-bold text-[#1D1D1F] text-sm mt-1">{user.dob || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Time of Birth</p>
                  <p className="font-bold text-[#1D1D1F] text-sm mt-1">{user.tob || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Place of Birth</p>
                  <p className="font-bold text-[#1D1D1F] text-sm mt-1 truncate" title={user.pob}>{user.pob || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-neutral-500 mb-3 font-medium">Add your birth details to unlock matching features.</p>
                <button 
                  onClick={() => {
                    setBirthData({ dob: '', tob: '', pob: '' });
                    setShowBirthModal(true);
                  }}
                  className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-full shadow-sm transition-all"
                >
                  Add Birth Details
                </button>
              </div>
            )}
          </div>

          {/* Family Details Card */}
          <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
              <h3 className="text-base font-bold text-black uppercase tracking-wider">Family Details</h3>
              <button 
                onClick={() => setShowFamilyModal(true)}
                className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
                title="Edit Family Details"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            
            {user?.family_details && Object.keys(user.family_details).length > 0 ? (
              <div className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Father</p>
                    <p className="text-sm text-[#1D1D1F] font-bold mt-1">
                      {user.family_details.father_name || 'N/A'}
                      {user.family_details.father_expired ? ' (Late)' : ''}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-medium">{user.family_details.father_job}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Mother</p>
                    <p className="text-sm text-[#1D1D1F] font-bold mt-1">
                      {user.family_details.mother_name || 'N/A'}
                      {user.family_details.mother_expired ? ' (Late)' : ''}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-medium">{user.family_details.mother_job}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
                  <div>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Family Type</p>
                    <p className="text-sm text-[#1D1D1F] font-bold mt-1">{user.family_details.family_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Status</p>
                    <p className="text-sm text-[#1D1D1F] font-bold mt-1">{user.family_details.family_status || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
                  <div>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Brothers</p>
                    <p className="text-sm text-[#1D1D1F] font-bold mt-1">{user.family_details.brothers || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Sisters</p>
                    <p className="text-sm text-[#1D1D1F] font-bold mt-1">{user.family_details.sisters || 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-neutral-500 mb-3 font-medium">Add your family details to get better matches.</p>
                <button 
                  onClick={() => setShowFamilyModal(true)}
                  className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-full shadow-sm transition-all"
                >
                  Add Family Details
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      <Navbar />

      {/* Aadhaar Verification Modal */}
      {showAadhaarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl w-full max-w-sm relative text-left shadow-2xl">
            <button 
              onClick={() => { setShowAadhaarModal(false); setStep(1); setError(''); }} 
              className="absolute top-4 right-4 text-neutral-400 hover:text-black w-6 h-6 flex items-center justify-center rounded-full bg-neutral-100"
            >
              ✕
            </button>
            <h2 className="text-xl font-extrabold text-black mb-1">Aadhaar Identity</h2>
            <p className="text-xs text-neutral-400 mb-6 font-semibold uppercase tracking-wider">Level 1 Verification</p>

            {error && <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-xs font-medium">{error}</div>}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Aadhaar Number</label>
                  <input 
                    type="text" 
                    value={aadhaarNumber}
                    onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="Enter 12 digit Aadhaar"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-black text-sm outline-none focus:border-[#0071E3] focus:bg-white transition-all"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={verifyLoading}
                  className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-98 disabled:opacity-50"
                >
                  {verifyLoading ? 'Sending OTP...' : 'Get OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Enter OTP</label>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6 digit OTP"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-black outline-none focus:border-[#0071E3] focus:bg-white text-center tracking-widest text-lg font-bold transition-all"
                    required
                  />
                  <p className="text-[10px] text-neutral-400 mt-2 text-center">OTP has been sent to Aadhaar-linked phone</p>
                </div>
                <button 
                  type="submit" 
                  disabled={verifyLoading}
                  className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-98 disabled:opacity-50"
                >
                  {verifyLoading ? 'Verifying OTP...' : 'Verify OTP'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Family Details Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl w-full max-w-md relative max-h-[90vh] overflow-y-auto shadow-2xl text-left">
            <button 
              onClick={() => { setShowFamilyModal(false); setError(''); }} 
              className="absolute top-4 right-4 text-neutral-400 hover:text-black w-6 h-6 flex items-center justify-center rounded-full bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-extrabold text-black mb-1">Family Details</h2>
            <p className="text-xs text-neutral-400 mb-6 font-semibold uppercase tracking-wider">Astro Matches details setup</p>

            {error && <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-xs font-medium">{error}</div>}

            <form onSubmit={handleUpdateFamily} className="space-y-5">
              
              {/* Father Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-1">Father's Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Name</label>
                    <input 
                      type="text" 
                      value={familyData.father_name}
                      onChange={e => setFamilyData({...familyData, father_name: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-black text-sm outline-none focus:border-[#0071E3] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Occupation</label>
                    <input 
                      type="text" 
                      value={familyData.father_job}
                      onChange={e => setFamilyData({...familyData, father_job: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-black text-sm outline-none focus:border-[#0071E3] focus:bg-white"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="father_expired"
                    checked={familyData.father_expired}
                    onChange={e => setFamilyData({...familyData, father_expired: e.target.checked})}
                    className="accent-black h-4 w-4 border border-neutral-300 rounded"
                  />
                  <label htmlFor="father_expired" className="text-xs font-semibold text-neutral-700">Deceased (Late)</label>
                </div>
              </div>

              {/* Mother Details */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-1">Mother's Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Name</label>
                    <input 
                      type="text" 
                      value={familyData.mother_name}
                      onChange={e => setFamilyData({...familyData, mother_name: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-black text-sm outline-none focus:border-[#0071E3] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Occupation</label>
                    <input 
                      type="text" 
                      value={familyData.mother_job}
                      onChange={e => setFamilyData({...familyData, mother_job: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-black text-sm outline-none focus:border-[#0071E3] focus:bg-white"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="mother_expired"
                    checked={familyData.mother_expired}
                    onChange={e => setFamilyData({...familyData, mother_expired: e.target.checked})}
                    className="accent-black h-4 w-4 border border-neutral-300 rounded"
                  />
                  <label htmlFor="mother_expired" className="text-xs font-semibold text-neutral-700">Deceased (Late)</label>
                </div>
              </div>

              {/* Structure and Siblings */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-1">Structure & Siblings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Family Type</label>
                    <select 
                      value={familyData.family_type}
                      onChange={e => setFamilyData({...familyData, family_type: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-black text-sm outline-none focus:border-[#0071E3] focus:bg-white"
                    >
                      <option value="Nuclear">Nuclear</option>
                      <option value="Joint">Joint</option>
                      <option value="Extended">Extended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Family Status</label>
                    <select 
                      value={familyData.family_status}
                      onChange={e => setFamilyData({...familyData, family_status: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-black text-sm outline-none focus:border-[#0071E3] focus:bg-white"
                    >
                      <option value="Middle Class">Middle Class</option>
                      <option value="Upper Middle Class">Upper Middle Class</option>
                      <option value="Rich">Rich</option>
                      <option value="Affluent">Affluent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">No. of Brothers</label>
                    <input 
                      type="number" 
                      min="0"
                      value={familyData.brothers}
                      onChange={e => setFamilyData({...familyData, brothers: parseInt(e.target.value) || 0})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-black text-sm outline-none focus:border-[#0071E3] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">No. of Sisters</label>
                    <input 
                      type="number" 
                      min="0"
                      value={familyData.sisters}
                      onChange={e => setFamilyData({...familyData, sisters: parseInt(e.target.value) || 0})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-black text-sm outline-none focus:border-[#0071E3] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-neutral-100">
                <button 
                  type="submit" 
                  disabled={familyLoading}
                  className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-98 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
          <style>{`
            @keyframes scanLaser {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
          `}</style>
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl w-full max-w-sm relative text-center shadow-2xl">
            <button 
              onClick={() => { setShowFaceModal(false); stopCamera(); }} 
              className="absolute top-4 right-4 text-neutral-400 hover:text-black w-6 h-6 flex items-center justify-center rounded-full bg-neutral-100"
              disabled={faceLoading}
            >
              ✕
            </button>
            <h2 className="text-xl font-extrabold text-black mb-1">AI Face Match</h2>
            <p className="text-xs text-neutral-400 mb-6 font-semibold uppercase tracking-wider">Level 2 Verification</p>

            {faceError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
                {faceError}
              </div>
            )}

            {faceSuccess && (
              <div className="p-4 mb-4 rounded-xl bg-blue-50 border border-blue-100 text-[#0071E3] text-xs font-bold flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-[#0071E3] animate-bounce" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Identity Matched Successfully!
              </div>
            )}

            <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-neutral-100 bg-neutral-50 mb-6 shadow-inner">
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
                <div className="absolute inset-0 pointer-events-none border-4 border-[#0071E3]/20 rounded-full flex items-center justify-center">
                  <div className="w-[85%] h-[85%] border-2 border-dashed border-[#0071E3]/30 rounded-full animate-[spin_10s_linear_infinite]" />
                </div>
              )}

              {/* Scanning Laser Line */}
              {faceLoading && (
                <div 
                  className="absolute left-0 right-0 h-1 bg-[#0071E3] shadow-[0_0_15px_#0071E3] opacity-80"
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
                  className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-98"
                >
                  Capture Selfie
                </button>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={startCamera}
                    disabled={faceLoading}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-250 border border-neutral-200 text-neutral-800 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    Retake
                  </button>
                  <button 
                    onClick={handleFaceVerify}
                    disabled={faceLoading || faceSuccess}
                    className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {faceLoading ? 'Verifying...' : 'Verify Now'}
                  </button>
                </div>
              )}
            </div>

            <p className="text-[10px] text-neutral-450 mt-4 leading-normal font-medium">
              Align your face clearly in the circle. Make sure you are in a bright room.
            </p>
          </div>
        </div>
      )}

      {/* Birth Details Modal */}
      {showBirthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl w-full max-w-sm relative text-left shadow-2xl">
            <button 
              onClick={() => { setShowBirthModal(false); setError(''); }} 
              className="absolute top-4 right-4 text-neutral-400 hover:text-black w-6 h-6 flex items-center justify-center rounded-full bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-extrabold text-black mb-1 flex items-center gap-1.5">
              Birth Astro
            </h2>
            <p className="text-xs text-neutral-400 mb-6 font-semibold uppercase tracking-wider">Astro compatibility data setup</p>

            {error && <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-xs font-medium">{error}</div>}

            <form onSubmit={handleUpdateBirth} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Date of Birth</label>
                <input 
                  type="date" 
                  value={birthData.dob}
                  onChange={e => setBirthData({...birthData, dob: e.target.value})}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-black text-sm outline-none focus:border-[#0071E3] focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Time of Birth</label>
                <input 
                  type="text" 
                  value={birthData.tob}
                  onChange={e => setBirthData({...birthData, tob: e.target.value})}
                  placeholder="e.g. 14:30 or 02:30 PM"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-black text-sm outline-none focus:border-[#0071E3] focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Place of Birth</label>
                <input 
                  type="text" 
                  value={birthData.pob}
                  onChange={e => setBirthData({...birthData, pob: e.target.value})}
                  placeholder="e.g. Vijayawada, AP"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-black text-sm outline-none focus:border-[#0071E3] focus:bg-white"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={birthLoading}
                className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-98 disabled:opacity-50"
              >
                {birthLoading ? 'Saving...' : 'Save Birth Details'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
