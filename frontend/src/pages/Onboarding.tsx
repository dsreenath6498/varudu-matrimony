import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Camera, ArrowRight, Sparkles } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  background: '#F5F5F7',
  border: '1px solid #D2D2D7',
  color: '#1D1D1F',
  borderRadius: '12px',
  padding: '12px 16px',
  width: '100%',
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  transition: 'all 0.2s',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6E6E73',
  marginBottom: '6px',
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    dob: '',
    place: '',
    gender: 'Male',
    interested_in: 'Female',
    referred_by: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.phone_visible === true || user.phone_visible === 1 || user.phone_visible === 'true';
    }
    return false;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 5);
    setPhotos(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userStr = localStorage.getItem('user');
    if (!userStr) return navigate('/login');
    const user = JSON.parse(userStr);

    if (parseInt(formData.age) < 18) {
      alert('You must be at least 18 years old to join Varudu Matrimony.');
      setLoading(false);
      return;
    }

    const submitData = new FormData();
    submitData.append('userId', user.id);
    submitData.append('phoneVisible', String(phoneVisible));
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });
    photos.forEach(photo => {
      submitData.append('photos', photo);
    });

    try {
      const response = await api.post('/profile/create', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (error) {
      alert('Error creating profile');
    } finally {
      setLoading(false);
    }
  };

  const getFocusStyle = (field: string): React.CSSProperties =>
    focusedField === field
      ? {
          borderColor: '#0071E3',
          background: '#FFFFFF',
          boxShadow: '0 0 0 3px rgba(0, 113, 227, 0.15)',
        }
      : {};

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-[#F5F5F7]"
    >
      <div
        className="w-full max-w-md my-8"
        style={{ animation: 'fadeUp 0.5s ease both' }}
      >
        <div
          className="rounded-3xl p-8 bg-white border border-neutral-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
        >
          {/* Header */}
          <div
            className="flex flex-col items-center mb-8 animate-fadeUp"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4 bg-black text-white"
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <h2
              className="text-2xl font-bold text-center mb-1 text-neutral-900 tracking-tight font-sans"
            >
              Build Your Profile
            </h2>
            <p className="text-xs text-neutral-500 font-sans tracking-wide">
              Let the world see the real you
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div style={{ animation: 'fadeUp 0.5s 0.15s ease both' }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Your beautiful name"
                style={{ ...inputStyle, ...getFocusStyle('name') }}
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>

            {/* Age + DOB */}
            <div className="flex gap-3" style={{ animation: 'fadeUp 0.5s 0.2s ease both' }}>
              <div className="w-1/3">
                <label style={labelStyle}>Age</label>
                <input
                  type="number"
                  name="age"
                  placeholder="24"
                  style={{ ...inputStyle, ...getFocusStyle('age') }}
                  value={formData.age}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('age')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
              <div className="flex-1">
                <label style={labelStyle}>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  style={{ ...inputStyle, colorScheme: 'dark', ...getFocusStyle('dob') }}
                  value={formData.dob}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('dob')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </div>

            {/* Place */}
            <div style={{ animation: 'fadeUp 0.5s 0.25s ease both' }}>
              <label style={labelStyle}>City / Place</label>
              <input
                type="text"
                name="place"
                placeholder="Hyderabad, Telangana"
                style={{ ...inputStyle, ...getFocusStyle('place') }}
                value={formData.place}
                onChange={handleChange}
                onFocus={() => setFocusedField('place')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>

             {/* Gender */}
             <div style={{ animation: 'fadeUp 0.5s 0.3s ease both' }}>
               <label style={labelStyle}>I am a</label>
               <div className="grid grid-cols-2 gap-3">
                 {['Male', 'Female'].map((g) => (
                   <button
                     key={g}
                     type="button"
                     onClick={() => setFormData({ ...formData, gender: g })}
                     className="py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                     style={{
                       background: formData.gender === g ? '#1D1D1F' : '#F5F5F7',
                       border: '1px solid transparent',
                       color: formData.gender === g ? '#FFFFFF' : '#1D1D1F',
                       borderRadius: '12px',
                     }}
                   >
                     <span>{g === 'Male' ? '👨' : '👩'}</span>
                     <span>{g === 'Male' ? 'Man' : 'Woman'}</span>
                   </button>
                 ))}
               </div>
             </div>
 
             {/* Interested In */}
             <div style={{ animation: 'fadeUp 0.5s 0.35s ease both' }}>
               <label style={labelStyle}>Looking for a</label>
               <div className="grid grid-cols-2 gap-3">
                 {['Male', 'Female'].map((g) => (
                   <button
                     key={g}
                     type="button"
                     onClick={() => setFormData({ ...formData, interested_in: g })}
                     className="py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                     style={{
                       background: formData.interested_in === g ? '#1D1D1F' : '#F5F5F7',
                       border: '1px solid transparent',
                       color: formData.interested_in === g ? '#FFFFFF' : '#1D1D1F',
                       borderRadius: '12px',
                     }}
                   >
                     <span>{g === 'Male' ? '👨' : '👩'}</span>
                     <span>{g === 'Male' ? 'Man' : 'Woman'}</span>
                   </button>
                 ))}
               </div>
             </div>

            {/* Photo Upload */}
            <div style={{ animation: 'fadeUp 0.5s 0.4s ease both' }}>
              <label style={labelStyle}>Profile Photos (up to 5)</label>
              <label
                className="cursor-pointer block animate-none"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div
                  className="rounded-2xl p-6 text-center transition-all duration-200 border-2 dashed"
                  style={{
                    background: dragOver
                      ? 'rgba(0, 113, 227, 0.05)'
                      : photos.length > 0
                      ? 'rgba(0, 0, 0, 0.02)'
                      : '#F5F5F7',
                    border: `2px dashed ${dragOver ? '#0071E3' : photos.length > 0 ? '#1D1D1F' : '#D2D2D7'}`,
                    borderRadius: '12px',
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <Camera
                    className="w-8 h-8 mx-auto mb-2 text-neutral-500"
                  />
                  {photos.length > 0 ? (
                    <p className="font-semibold text-sm text-neutral-800">
                      ✓ {photos.length} photo{photos.length > 1 ? 's' : ''} selected
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-neutral-500">
                        Drop photos here or click to upload
                      </p>
                      <p className="text-xs mt-1 text-neutral-400">
                        PNG, JPG up to 5 files
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Referral */}
            <div style={{ animation: 'fadeUp 0.5s 0.45s ease both' }}>
              <label style={labelStyle}>Referral Code (Optional)</label>
              <input
                type="text"
                name="referred_by"
                placeholder="VARUDU-XXXX"
                style={{ ...inputStyle, fontFamily: '"DM Mono", monospace', ...getFocusStyle('referred_by') }}
                value={formData.referred_by}
                onChange={handleChange}
                onFocus={() => setFocusedField('referred_by')}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            {/* Phone Visibility Toggle */}
            <div style={{ animation: 'fadeUp 0.5s 0.48s ease both' }} className="flex items-start gap-2.5 mt-2 pl-1 mb-4">
              <input
                type="checkbox"
                id="phoneVisible"
                className="mt-0.5 rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                checked={phoneVisible}
                onChange={(e) => setPhoneVisible(e.target.checked)}
              />
              <label htmlFor="phoneVisible" className="text-[11px] text-neutral-500 leading-normal select-none cursor-pointer font-sans">
                Allow other users to view/unlock my phone number (costs them 5 Roses)
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-medium py-3.5 rounded-full bg-black hover:bg-neutral-900 text-white transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 mt-4 text-sm font-sans"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                  Setting up your profile...
                </span>
              ) : (
                <>
                  <span>Start Your Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
