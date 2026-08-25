import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Check,
  RefreshCw,
  Lock,
  Save,
  LogOut
} from 'lucide-react';
import { API_BASE } from '../config/api';
import UserNavbar from '../components/UserNavbar';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const token = localStorage.getItem('safe_drive_user_token');
  const storedUser = JSON.parse(localStorage.getItem('safe_drive_user_data') || '{}');

  const [user, setUser] = useState(storedUser);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    whatsappNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/user/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.user) {
          setUser(res.data.user);
          setFormData({
            name: res.data.user.name || '',
            email: res.data.user.email || '',
            phone: res.data.user.phone || '',
            gender: res.data.user.gender === 'FEMALE' ? 'Female' : res.data.user.gender === 'OTHER' ? 'Other' : 'Male',
            whatsappNumber: res.data.user.whatsappNumber || res.data.user.phone || '',
            address: res.data.user.address || '',
            city: res.data.user.city || '',
            state: res.data.user.state || '',
            pincode: res.data.user.pincode || ''
          });
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
      }
    };

    fetchUserProfile();
  }, [token, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await axios.put(`${API_BASE}/user/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSuccessMsg('✓ Profile details updated successfully!');
        if (res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('safe_drive_user_data', JSON.stringify(res.data.user));
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not update profile details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#F36F21] selection:text-white">
      <UserNavbar user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Page Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#F36F21] to-[#1E8A38] text-white flex items-center justify-center font-black text-2xl shadow-md">
              {formData.name ? formData.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{formData.name || 'Owner Profile'}</h1>
              <p className="text-xs text-slate-500 font-mono">+91 {formData.phone} • {formData.email || 'SafeDrive Customer'}</p>
            </div>
          </div>

          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-[#1E8A38] border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Account</span>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900">Personal & Contact Details</h2>
            <p className="text-xs text-slate-500">Manage your contact number, WhatsApp alert line, and delivery address.</p>
          </div>

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-[#1E8A38] text-xs font-bold">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#F36F21]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#F36F21]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Primary Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    readOnly
                    disabled
                    value={formData.phone}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-500 font-mono font-bold cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Primary phone is used for login authentication.</span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  WhatsApp Alert Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value.replace(/\D/g, '').slice(-10) })}
                    placeholder="9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#1E8A38]"
                  />
                </div>
                <span className="text-[10px] text-slate-400">WhatsApp notifications from scanners are routed here.</span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  value={formData.gender || 'Male'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#F36F21]"
                >
                  <option value="Male">👨 Male</option>
                  <option value="Female">👩 Female</option>
                  <option value="Other">⚧ Other</option>
                </select>
              </div>
            </div>

            {/* Address fields */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Delivery Address
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Flat / House No., Area, Landmark"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Lucknow"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Uttar Pradesh"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="226001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-[#F36F21]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#1E8A38] hover:bg-[#16702c] text-white font-black px-6 py-3 rounded-xl shadow-md text-xs transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Account Sign Out Card */}
        <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">Account Session</h3>
            <p className="text-xs text-slate-500">Sign out of your active vehicle owner portal on this device.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-700 font-bold px-6 py-2.5 rounded-xl text-xs transition border border-red-200 cursor-pointer flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Account</span>
          </button>
        </div>

      </main>
    </div>
  );
}
