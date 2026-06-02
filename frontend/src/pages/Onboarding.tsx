import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Camera, ArrowRight } from 'lucide-react';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
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
      
      // Update local storage with full user
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (error) {
      alert('Error creating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-rose-900 to-amber-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md border border-amber-200/50">
        <h2 className="text-3xl font-serif font-bold text-red-900 mb-6 text-center">Complete Your Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-rose-900 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-rose-50/50"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="w-1/3">
              <label className="block text-sm font-semibold text-rose-900 mb-1">Age</label>
              <input
                type="number"
                name="age"
                className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-rose-50/50"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>
            <div className="w-2/3">
              <label className="block text-sm font-semibold text-rose-900 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dob"
                className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-rose-50/50"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-rose-900 mb-1">Place / City</label>
            <input
              type="text"
              name="place"
              className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-rose-50/50"
              value={formData.place}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-6 pt-2">
            <div>
              <label className="block text-sm font-semibold text-rose-900 mb-3">I am a</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'Male' })}
                  className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all ${
                    formData.gender === 'Male'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-md'
                      : 'border-rose-100 bg-white text-slate-500 hover:border-rose-300'
                  }`}
                >
                  Man
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'Female' })}
                  className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all ${
                    formData.gender === 'Female'
                      ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-md'
                      : 'border-rose-100 bg-white text-slate-500 hover:border-rose-300'
                  }`}
                >
                  Woman
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-rose-900 mb-3">Looking for a</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, interested_in: 'Male' })}
                  className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all ${
                    formData.interested_in === 'Male'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-md'
                      : 'border-rose-100 bg-white text-slate-500 hover:border-rose-300'
                  }`}
                >
                  Man
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, interested_in: 'Female' })}
                  className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all ${
                    formData.interested_in === 'Female'
                      ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-md'
                      : 'border-rose-100 bg-white text-slate-500 hover:border-rose-300'
                  }`}
                >
                  Woman
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-rose-900 mb-1">Profile Pictures (up to 5)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 transition cursor-pointer bg-rose-50/50 rounded-xl border border-rose-200 p-1"
              onChange={handlePhotoChange}
            />
            {photos.length > 0 && <p className="text-sm text-green-600 mt-2">{photos.length} files selected</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-rose-900 mb-1">Referral Code (Optional)</label>
            <input
              type="text"
              name="referred_by"
              placeholder="e.g. VARUDU-ABCD"
              className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-rose-50/50"
              value={formData.referred_by}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-700 to-rose-600 text-white font-bold py-4 rounded-xl hover:from-red-800 hover:to-rose-700 transition shadow-lg hover:shadow-xl mt-6 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? 'Saving Profile...' : 'Start Swiping'} <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
