import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Phone,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { API_BASE } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Mobile OTP Auth Form State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // 1. Send Login OTP to Registered Mobile Number
  const handleSendLoginOTP = async (e) => {
    e.preventDefault();
    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setAuthError('Please enter a valid 10-digit registered mobile number');
      return;
    }

    setOtpLoading(true);
    setAuthError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/send-login-otp`, { phone: cleanPhone });
      if (res.data.success) {
        setOtpSent(true);
        setOtpSuccessMsg(`OTP sent to +91 ${cleanPhone}`);
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Failed to send OTP code. Please check your mobile number.');
    } finally {
      setOtpLoading(false);
    }
  };

  // 2. Verify OTP & Log in
  const handleVerifyLoginOTP = async (e) => {
    e.preventDefault();
    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
    const cleanOtp = loginOtp.trim();

    if (!cleanPhone || !cleanOtp) {
      setAuthError('Mobile number and 6-digit OTP code are required');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/verify-login-otp`, {
        phone: cleanPhone,
        otp: cleanOtp
      });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid or expired OTP verification code');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-20 px-4 flex flex-col items-center justify-center selection:bg-[#F36F21] selection:text-white">
      
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Official Brand Logo */}
        <div className="flex flex-col items-center justify-center text-center pb-4 border-b border-slate-100">
          <img
            src="/Safe Drive Tag Logo.jpg.jpeg"
            alt="SafeDrive Tag"
            className="h-12 w-auto object-contain drop-shadow-sm mb-2"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/favicon.svg';
            }}
          />
          <p className="text-xs font-bold text-slate-500">Vehicle Owner & Customer Portal</p>
        </div>

        {authError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold">
            {authError}
          </div>
        )}

        {/* MOBILE OTP LOGIN FORM */}
        <div className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleSendLoginOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs text-slate-400 font-mono font-bold">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    autoFocus
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-900 text-sm font-mono font-bold tracking-wider focus:bg-white focus:outline-none focus:border-[#F36F21] transition"
                    placeholder="9876543210"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Enter the 10-digit mobile number used when ordering or activating your tag.</p>
              </div>

              <button
                type="submit"
                disabled={otpLoading || loginPhone.length < 10}
                className="w-full bg-[#F36F21] hover:bg-[#d85810] text-white font-black py-3.5 rounded-xl shadow-lg shadow-[#F36F21]/25 transition flex items-center justify-center space-x-2 text-xs disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send 6-Digit OTP Code →</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyLoginOTP} className="space-y-4 text-center">
              {otpSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[#1E8A38] text-xs font-bold">
                  {otpSuccessMsg}
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  Enter 6-Digit Code for +91 {loginPhone}
                </label>
                <input
                  type="text"
                  maxLength="6"
                  autoFocus
                  required
                  value={loginOtp}
                  onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-48 mx-auto bg-slate-50 border-2 border-[#1E8A38] rounded-2xl py-3 text-center text-3xl font-black font-mono tracking-widest text-slate-900 focus:bg-white focus:outline-none"
                  placeholder="123456"
                />
                <p className="text-[11px] text-slate-400 mt-2 font-medium">Default Test OTP: <span className="font-mono font-bold text-[#1E8A38]">123456</span></p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-1/3 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={authLoading || loginOtp.length < 6}
                  className="w-2/3 bg-[#1E8A38] hover:bg-[#16702c] text-white font-black py-3 rounded-xl shadow-md text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Access Dashboard →</span>}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Store Link */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-3">
          <Link
            to="/store"
            className="inline-flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-[#1E8A38] font-bold px-4 py-2.5 rounded-xl text-xs transition border border-emerald-200 shadow-2xs w-full justify-center"
          >
            <span>🛒 Don't have a SafeDrive Tag? Buy in Store</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
