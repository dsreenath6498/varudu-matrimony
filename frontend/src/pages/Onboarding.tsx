import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Camera, ArrowRight, Sparkles } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#FFF8F0',
  borderRadius: '14px',
  padding: '14px 18px',
  width: '100%',
  fontFamily: 'Inter, sans-serif',
  fontSize: '15px',
  transition: 'all 0.3s',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: 'rgba(212,175,55,0.7)',
  marginBottom: '8px',
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
          borderColor: 'rgba(212,175,55,0.5)',
          background: 'rgba(212,175,55,0.04)',
          boxShadow: '0 0 0 3px rgba(212,175,55,0.1)',
        }
      : {};

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 60% 80%, #1a0018 0%, #050005 60%, #0a000a 100%)' }}
    >
      {/* Orbs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(225,29,72,0.15) 0%, transparent 70%)',
          top: '-10%', right: '-10%',
          animation: 'orbFloat 14s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
          bottom: '-5%', left: '-5%',
          animation: 'orbFloat 18s ease-in-out infinite reverse',
        }}
      />

      <div
        className="relative w-full max-w-md z-10 my-8"
        style={{ animation: 'slideInScale 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}
      >
        <div
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: 'rgba(12, 0, 10, 0.85)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Top shimmer line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)' }}
          />

          {/* Header */}
          <div
            className="flex flex-col items-center mb-8"
            style={{ animation: 'fadeUp 0.5s 0.1s ease both' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #7A0B2A, #E11D48)',
                boxShadow: '0 0 20px rgba(225,29,72,0.5)',
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2
              className="text-3xl font-bold text-center mb-1"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                background: 'linear-gradient(135deg, #FFD700, #D4AF37)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Build Your Profile
            </h2>
            <p className="text-xs" style={{ color: 'rgba(180,120,150,0.6)', letterSpacing: '0.1em' }}>
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
                    className="py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2"
                    style={{
                      background: formData.gender === g
                        ? g === 'Male'
                          ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.1))'
                          : 'linear-gradient(135deg, rgba(225,29,72,0.2), rgba(159,18,57,0.1))'
                        : 'rgba(255,255,255,0.03)',
                      border: formData.gender === g
                        ? g === 'Male' ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(225,29,72,0.5)'
                        : '1px solid rgba(255,255,255,0.06)',
                      color: formData.gender === g
                        ? g === 'Male' ? '#93C5FD' : '#FDA4AF'
                        : 'rgba(180,120,150,0.5)',
                      boxShadow: formData.gender === g
                        ? g === 'Male' ? '0 0 20px rgba(59,130,246,0.2)' : '0 0 20px rgba(225,29,72,0.2)'
                        : 'none',
                      transform: formData.gender === g ? 'scale(1.02)' : 'scale(1)',
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
                    className="py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2"
                    style={{
                      background: formData.interested_in === g
                        ? g === 'Male'
                          ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.1))'
                          : 'linear-gradient(135deg, rgba(225,29,72,0.2), rgba(159,18,57,0.1))'
                        : 'rgba(255,255,255,0.03)',
                      border: formData.interested_in === g
                        ? g === 'Male' ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(225,29,72,0.5)'
                        : '1px solid rgba(255,255,255,0.06)',
                      color: formData.interested_in === g
                        ? g === 'Male' ? '#93C5FD' : '#FDA4AF'
                        : 'rgba(180,120,150,0.5)',
                      transform: formData.interested_in === g ? 'scale(1.02)' : 'scale(1)',
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
                className="cursor-pointer block"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div
                  className="rounded-2xl p-6 text-center transition-all duration-300"
                  style={{
                    background: dragOver
                      ? 'rgba(225,29,72,0.08)'
                      : photos.length > 0
                      ? 'rgba(212,175,55,0.05)'
                      : 'rgba(255,255,255,0.02)',
                    border: `2px dashed ${dragOver ? 'rgba(225,29,72,0.5)' : photos.length > 0 ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
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
                    className="w-8 h-8 mx-auto mb-2"
                    style={{ color: photos.length > 0 ? '#D4AF37' : 'rgba(180,120,150,0.4)' }}
                  />
                  {photos.length > 0 ? (
                    <p className="font-semibold text-sm" style={{ color: '#D4AF37' }}>
                      ✓ {photos.length} photo{photos.length > 1 ? 's' : ''} selected
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-medium" style={{ color: 'rgba(180,120,150,0.6)' }}>
                        Drop photos here or click to upload
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(120,80,100,0.5)' }}>
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-4 rounded-2xl transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-3 mt-2"
              style={{
                background: 'linear-gradient(135deg, #7A0B2A, #C41E3A, #E11D48)',
                color: 'white',
                fontSize: '16px',
                border: '1px solid rgba(255,100,120,0.3)',
                boxShadow: loading ? 'none' : '0 10px 30px rgba(225,29,72,0.4)',
                animation: 'fadeUp 0.5s 0.5s ease both',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    style={{ animation: 'spinSlow 0.8s linear infinite' }}
                  />
                  Setting up your profile...
                </span>
              ) : (
                <>
                  <span>Start Your Journey</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
