import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck,
  Phone,
  MessageSquare,
  AlertTriangle,
  Car,
  User,
  Clock,
  CheckCircle,
  Plus,
  RefreshCw,
  Zap,
  Lock,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  LogOut,
  CreditCard,
  History,
  Info,
  KeyRound,
  Ban,
  Unlock,
  MapPin,
  MoreHorizontal,
  Send,
  Navigation,
  HelpCircle,
  Sparkles,
  QrCode,
  ShoppingBag,
  Package,
  Printer,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

import Store from './pages/Store';
import Login from './pages/Login';
import SafeDriveQRCode, { downloadQRCodeSVG } from './components/SafeDriveQRCode';
import { API_BASE } from './config/api';

// Icon Map Helper for dynamic reasons
const getReasonIcon = (iconKey) => {
  switch (iconKey) {
    case 'ban':
      return Ban;
    case 'unlock':
      return Unlock;
    case 'car':
      return Car;
    case 'alert':
      return AlertTriangle;
    case 'other':
      return MoreHorizontal;
    default:
      return HelpCircle;
  }
};

const getReasonColorClasses = (color) => {
  switch (color) {
    case 'red':
      return 'bg-red-50 text-red-500 border border-red-200';
    case 'green':
      return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    case 'blue':
      return 'bg-blue-50 text-blue-600 border border-blue-200';
    case 'rose':
      return 'bg-rose-50 text-rose-600 border border-rose-200';
    case 'purple':
      return 'bg-purple-50 text-purple-600 border border-purple-200';
    case 'amber':
      return 'bg-amber-50 text-amber-600 border border-amber-200';
    default:
      return 'bg-indigo-50 text-indigo-600 border border-indigo-200';
  }
};

// -------------------------------------------------------------
// 1. PUBLIC QR SCAN INTERFACE (/q/:token) WITH 4-DIGIT PIN & REASON UI
// -------------------------------------------------------------
function PublicQRScanView() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState('');

  // 4-Digit Plate Verification State
  const [isVerified, setIsVerified] = useState(false);
  const [last4Digits, setLast4Digits] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifiedVehicleData, setVerifiedVehicleData] = useState(null);

  // Dynamic Scan Reasons from Admin Settings
  const [scanReasons, setScanReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState(''); // Default: NOTHING selected
  const [otherText, setOtherText] = useState('');
  const [reasonValidationMsg, setReasonValidationMsg] = useState('');

  // Call & Message Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [phoneToCall, setPhoneToCall] = useState('');
  const [callInitiated, setCallInitiated] = useState(false);

  // Emergency Modal State with GPS Location
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [emergencyResult, setEmergencyResult] = useState(null);

  // Registration Form State (State 1: Unregistered)
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    password: '',
    vehicleName: '',
    vehicleBrand: '',
    vehicleNumber: '',
    emergencyContacts: [
      { name: '', number: '' },
      { name: '', number: '' }
    ]
  });
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState('');

  // Mobile OTP States for First-Time Activation
  const [activationPhone, setActivationPhone] = useState('');
  const [activationOtp, setActivationOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpMsg, setOtpMsg] = useState('');
  const [otpError, setOtpError] = useState('');

  // Send Activation OTP
  const handleSendActivationOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = (activationPhone || '').trim().replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    setOtpMsg('');
    try {
      const res = await axios.post(`${API_BASE}/public/send-activation-otp`, {
        phone: cleanPhone
      });
      if (res.data.success) {
        setOtpSent(true);
        setActivationOtp(res.data.otp || '123456');
        setOtpMsg(`✓ OTP sent to +91 ${cleanPhone}`);
        if (res.data.user) {
          setRegForm((prev) => ({
            ...prev,
            name: res.data.user.name || prev.name,
            phone: cleanPhone,
            address: res.data.user.address || prev.address,
            whatsappNumber: res.data.user.whatsappNumber || cleanPhone
          }));
        } else {
          setRegForm((prev) => ({
            ...prev,
            phone: cleanPhone,
            whatsappNumber: prev.whatsappNumber || cleanPhone
          }));
        }
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to send OTP code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify Activation OTP
  const handleVerifyActivationOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = (activationPhone || '').trim().replace(/\D/g, '').slice(-10);
    if (!activationOtp || activationOtp.trim().length < 6) {
      setOtpError('Please enter 6-digit OTP code');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await axios.post(`${API_BASE}/public/verify-activation-otp`, {
        phone: cleanPhone,
        otp: activationOtp.trim()
      });
      if (res.data.success && res.data.verified) {
        setIsPhoneVerified(true);
        setOtpMsg(`✓ +91 ${cleanPhone} verified successfully!`);
        if (res.data.user) {
          setRegForm((prev) => ({
            ...prev,
            name: res.data.user.name || prev.name,
            phone: cleanPhone,
            address: res.data.user.address || prev.address,
            whatsappNumber: res.data.user.whatsappNumber || cleanPhone
          }));
        } else {
          setRegForm((prev) => ({
            ...prev,
            phone: cleanPhone,
            whatsappNumber: prev.whatsappNumber || cleanPhone
          }));
        }
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP code. Please enter 123456');
    } finally {
      setOtpLoading(false);
    }
  };

  // Physical QR Claim States
  const [claimEmailOrPhone, setClaimEmailOrPhone] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  // Handle Physical QR Claim & Verification
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimEmailOrPhone.trim()) return;

    setClaiming(true);
    setClaimError('');

    try {
      const res = await axios.post(`${API_BASE}/public/qr/${token}/claim`, {
        emailOrPhone: claimEmailOrPhone.trim()
      });
      if (res.data.success) {
        setQrData((prev) => ({
          ...prev,
          status: 'UNREGISTERED',
          user: res.data.user
        }));
        if (res.data.user) {
          setRegForm((prev) => ({
            ...prev,
            name: res.data.user.name || '',
            phone: res.data.user.phone || '',
            address: res.data.user.address || ''
          }));
        }
      }
    } catch (err) {
      setClaimError(err.response?.data?.message || 'Verification failed. No matching order found for this email/phone.');
    } finally {
      setClaiming(false);
    }
  };

  // Fetch Public Scan Reasons
  const fetchScanReasons = async () => {
    try {
      const res = await axios.get(`${API_BASE}/public/scan-reasons`);
      if (res.data.success) {
        setScanReasons(res.data.reasons);
      }
    } catch (err) {
      console.error('Failed to load scan reasons', err);
    }
  };

  // Fetch QR Info on mount
  const fetchQRDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/public/qr/${token}`);
      setQrData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching QR Code');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRDetails();
    fetchScanReasons();
  }, [token]);

  // Handle Plate 4-Digit Verification
  const handleVerifyPlate = async (e) => {
    e.preventDefault();
    if (last4Digits.length < 4) {
      setVerifyError('Please enter all 4 digits');
      return;
    }
    setVerifying(true);
    setVerifyError('');
    try {
      const res = await axios.post(`${API_BASE}/public/qr/${token}/verify-plate`, {
        last4Digits
      });
      if (res.data.success && res.data.verified) {
        setIsVerified(true);
        setVerifiedVehicleData(res.data);
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Incorrect last 4 digits. Please check the vehicle plate.');
    } finally {
      setVerifying(false);
    }
  };

  // Check if current selected reason is of type 'Other'
  const selectedReasonObj = scanReasons.find((r) => r.title === selectedReason);
  const isOtherSelected = selectedReasonObj?.isOtherType || selectedReason.toLowerCase().includes('other');

  // Get final formatted message text
  const getFormattedMessage = () => {
    const reasonTitle = isOtherSelected ? (otherText || 'Important Vehicle Alert') : selectedReason;
    const plate = verifiedVehicleData?.vehicle?.vehicleNumber || qrData?.vehicleBrand || 'vehicle';
    return `Hello, I am scanning the Safe Drive QR code on your vehicle (${plate}).\n\n📌 Reason: ${reasonTitle}\n\nPlease check your vehicle or contact me.`;
  };

  // Handle Send Direct Message (WhatsApp / Notification)
  const handleSendMessage = async () => {
    if (!selectedReason) {
      setReasonValidationMsg('⚠️ Please select a reason from above before sending message.');
      return;
    }
    setReasonValidationMsg('');
    setActionLoading(true);
    try {
      const finalMsg = getFormattedMessage();
      const res = await axios.post(`${API_BASE}/public/qr/${token}/message`, {
        messageText: finalMsg
      });
      if (res.data.success) {
        window.open(res.data.whatsappUrl, '_blank');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send notification message.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Call Owner Action (reveals phone number after atomic quota deduction)
  const handleCallOwner = async () => {
    if (!selectedReason) {
      setReasonValidationMsg('⚠️ Please select a reason from above before calling owner.');
      return;
    }
    setReasonValidationMsg('');
    setActionLoading(true);
    setActionMessage('');
    setPhoneToCall('');
    try {
      const res = await axios.post(`${API_BASE}/public/qr/${token}/call`);
      if (res.data.success) {
        setPhoneToCall(res.data.targetPhone);
        setCallInitiated(true);
        setActionMessage('Call quota verified. Tap below to dial owner:');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to initiate call. Quota may be exhausted.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Emergency Alert Trigger with Live GPS Location
  const handleEmergencyTrigger = () => {
    setShowEmergencyModal(true);
    setEmergencyResult(null);
    setGettingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          await sendEmergencyAlert(lat, lng);
        },
        async (err) => {
          console.warn('Geolocation denied or unavailable', err);
          await sendEmergencyAlert(null, null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      sendEmergencyAlert(null, null);
    }
  };

  const sendEmergencyAlert = async (lat, lng) => {
    setGettingLocation(true);
    try {
      const res = await axios.post(`${API_BASE}/public/qr/${token}/emergency`, {
        latitude: lat,
        longitude: lng,
        mapsLink: lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : null
      });
      if (res.data.success) {
        setEmergencyResult(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Emergency trigger error');
    } finally {
      setGettingLocation(false);
    }
  };

  // Handle First-Time Registration Form
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = (activationPhone || regForm.phone || '').trim().replace(/\D/g, '').slice(-10);
    if (!isPhoneVerified) {
      setRegError('⚠️ Please verify your mobile number with OTP code first before activating QR.');
      return;
    }
    setRegistering(true);
    setRegError('');
    try {
      const res = await axios.post(`${API_BASE}/public/qr/${token}/register`, {
        ...regForm,
        phone: cleanPhone
      });
      if (res.data.success) {
        if (res.data.token) {
          localStorage.setItem('safe_drive_user_token', res.data.token);
        }
        if (res.data.user) {
          localStorage.setItem('safe_drive_user_data', JSON.stringify(res.data.user));
        }
        alert('🎉 Mobile number verified & QR protection activated successfully!');
        fetchQRDetails();
      }
    } catch (err) {
      setRegError(err.response?.data?.message || 'Registration failed. Check inputs.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-800">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="font-semibold text-slate-600">Verifying secure QR token...</p>
      </div>
    );
  }

  // STATE 5: INVALID QR
  if (!qrData || qrData.status === 'INVALID') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Invalid QR Code</h2>
          <p className="text-sm text-slate-500 mb-6">
            This QR code token is not recognized in the Safe Drive system.
          </p>
          <Link to="/" className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // STATE 4: SUSPENDED QR
  if (qrData.status === 'SUSPENDED') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">QR Suspended</h2>
          <p className="text-sm text-slate-500 mb-6">
            This vehicle QR code is temporarily suspended by the administration.
          </p>
          <Link to="/" className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition">
            Go to Safe Drive
          </Link>
        </div>
      </div>
    );
  }

  // STATE 3: EXPIRED QR
  if (qrData.status === 'EXPIRED') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">QR Code Expired</h2>
          <p className="text-sm text-slate-500 mb-2">This vehicle safety sticker expired on:</p>
          <div className="font-mono font-bold text-amber-600 text-base mb-6">
            {qrData.expiryDate ? new Date(qrData.expiryDate).toLocaleDateString() : 'Expired'}
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Please contact the vehicle owner or login to renew subscription. Unused quota is safely preserved upon renewal.
          </p>
          <Link to="/dashboard" className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/20">
            Vehicle Owner? Login to Renew
          </Link>
        </div>
      </div>
    );
  }

  // STATE 1: UNREGISTERED QR (FIRST-TIME VEHICLE REGISTRATION WITH MOBILE OTP)
  if (qrData.status === 'UNREGISTERED' || qrData.status === 'UNCLAIMED_PHYSICAL') {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 p-4 py-8 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="p-3 bg-[#1D56A5]/10 text-[#1D56A5] rounded-2xl border border-[#1D56A5]/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">First-Time QR Activation</h1>
              <p className="text-xs font-mono text-[#1D56A5] font-bold">QR Sticker: {qrData.copyCode} ({qrData.productId})</p>
            </div>
          </div>

          {regError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          {/* STEP 1: MOBILE OTP VERIFICATION (Shown First) */}
          {!isPhoneVerified ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-[#1D56A5]" />
                  <span>Verify Mobile Number</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Please enter your 10-digit mobile number to verify and activate this QR safety pass.
                </p>
              </div>

              {otpError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                  {otpError}
                </div>
              )}
              {otpMsg && (
                <div className="p-3.5 bg-emerald-50 border border-[#259A3A]/30 rounded-xl text-[#259A3A] text-xs font-semibold">
                  {otpMsg}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number *</label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-3 text-xs text-slate-400 font-mono font-bold">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={activationPhone}
                        onChange={(e) => setActivationPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-900 text-sm font-mono tracking-wider focus:outline-hidden focus:border-[#1D56A5]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendActivationOtp}
                      disabled={otpLoading || activationPhone.length < 10}
                      className="bg-[#1D56A5] hover:bg-[#164382] text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm disabled:opacity-50 shrink-0"
                    >
                      {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>{otpSent ? 'Resend OTP' : 'Send OTP'}</span>}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div className="pt-3 border-t border-slate-200/60 space-y-3">
                    <label className="block text-xs font-bold text-slate-700">Enter 6-Digit OTP Code *</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={activationOtp}
                        onChange={(e) => setActivationOtp(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-mono tracking-widest text-center focus:outline-hidden focus:border-[#259A3A]"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyActivationOtp}
                        disabled={otpLoading || activationOtp.length < 6}
                        className="bg-[#259A3A] hover:bg-[#1e7e2e] text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-sm disabled:opacity-50 shrink-0"
                      >
                        {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Continue →</span>}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">Default test OTP: <strong className="text-slate-700 font-mono">123456</strong></p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: OWNER & VEHICLE REGISTRATION FORM (Opened only after OTP verified) */
            <div className="space-y-6">
              {/* Verified Banner */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-[#259A3A]/30 flex items-center justify-between text-xs text-[#259A3A]">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-bold">Verified Mobile: +91 {activationPhone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPhoneVerified(false);
                    setOtpSent(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Change Number
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D56A5] mb-3 flex items-center space-x-1.5">
                    <User className="w-4 h-4" />
                    <span>1. Owner Profile</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        placeholder="e.g. Rajesh Kumar"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp Alert Number</label>
                        <input
                          type="tel"
                          value={regForm.whatsappNumber}
                          onChange={(e) => setRegForm({ ...regForm, whatsappNumber: e.target.value })}
                          placeholder="WhatsApp Number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">City / Address *</label>
                        <input
                          type="text"
                          required
                          value={regForm.address}
                          onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                          placeholder="e.g. Lucknow, UP"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D56A5] mb-3 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>2. Item / Asset Details (Vehicle, Bag, Luggage, etc.)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Brand / Make *</label>
                      <input
                        type="text"
                        required
                        value={regForm.vehicleBrand}
                        onChange={(e) => setRegForm({ ...regForm, vehicleBrand: e.target.value })}
                        placeholder="e.g. Hyundai, Samsonite, Apple"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Item / Model Name *</label>
                      <input
                        type="text"
                        required
                        value={regForm.vehicleName}
                        onChange={(e) => setRegForm({ ...regForm, vehicleName: e.target.value })}
                        placeholder="e.g. Creta, Travel Bag, Laptop"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Plate / Tag / Serial No. *</label>
                      <input
                        type="text"
                        required
                        value={regForm.vehicleNumber}
                        onChange={(e) => setRegForm({ ...regForm, vehicleNumber: e.target.value })}
                        placeholder="e.g. UP32AB1234, BAG-01"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm uppercase font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-3 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>3. Emergency Contacts (2 Required)</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-700 mb-1.5">Emergency Contact 1</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Contact 1 Name (e.g. Brother)"
                          value={regForm.emergencyContacts[0].name}
                          onChange={(e) => {
                            const updated = [...regForm.emergencyContacts];
                            updated[0].name = e.target.value;
                            setRegForm({ ...regForm, emergencyContacts: updated });
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Contact 1 Mobile"
                          value={regForm.emergencyContacts[0].number}
                          onChange={(e) => {
                            const updated = [...regForm.emergencyContacts];
                            updated[0].number = e.target.value;
                            setRegForm({ ...regForm, emergencyContacts: updated });
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-700 mb-1.5">Emergency Contact 2</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Contact 2 Name (e.g. Friend)"
                          value={regForm.emergencyContacts[1].name}
                          onChange={(e) => {
                            const updated = [...regForm.emergencyContacts];
                            updated[1].name = e.target.value;
                            setRegForm({ ...regForm, emergencyContacts: updated });
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Contact 2 Mobile"
                          value={regForm.emergencyContacts[1].number}
                          onChange={(e) => {
                            const updated = [...regForm.emergencyContacts];
                            updated[1].number = e.target.value;
                            setRegForm({ ...regForm, emergencyContacts: updated });
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full bg-[#1D56A5] hover:bg-[#164382] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-[#1D56A5]/25 transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                >
                  {registering ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>🚀 Complete Registration & Activate QR</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // STATE 2: ACTIVE QR -> STEP 1: 4-DIGIT PLATE VERIFICATION POPUP
  if (qrData.status === 'ACTIVE' && !isVerified) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
            <KeyRound className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-slate-900 mb-1">Vehicle Security Check</h2>
          <p className="text-xs text-slate-500 mb-6">
            For owner safety & anti-harassment, please enter the <strong className="text-slate-900">last 4 digits</strong> of the vehicle number plate.
          </p>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-6 flex flex-col items-center">
            <span className="text-xs font-bold uppercase text-slate-500 mb-1">
              {qrData.vehicleBrand} {qrData.vehicleName}
            </span>
            <div className="font-mono font-black text-2xl text-slate-900 tracking-widest">
              {qrData.maskedPlate || 'UP•• ••••'}
            </div>
          </div>

          {verifyError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPlate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Enter Last 4 Digits
              </label>
              <input
                type="text"
                maxLength="4"
                autoFocus
                placeholder="e.g. 1234"
                value={last4Digits}
                onChange={(e) => setLast4Digits(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border-2 border-indigo-500 rounded-2xl px-4 py-3.5 text-center text-2xl font-black font-mono tracking-widest text-slate-900 uppercase focus:bg-white focus:outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={verifying || last4Digits.length < 4}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/20 text-base transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {verifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Verify & Connect with Owner</span>}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-6 flex items-center justify-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Safe Drive Physical Presence Verification</span>
          </p>
        </div>
      </div>
    );
  }

  // STATE 2: ACTIVE QR -> STEP 2: VERIFIED VIEW WITH DYNAMIC REASONS (MATCHING SCREENSHOT)
  const displayVehicle = verifiedVehicleData?.vehicle || qrData.vehicle;
  const displayOwner = verifiedVehicleData?.owner || qrData.owner;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-center p-4 py-8">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
        
        {/* TOP ILLUSTRATION & HEADER (EXACTLY AS SCREENSHOT) */}
        <div className="p-6 pt-8 text-center pb-2">
          {/* Clipboard Illustration Icon */}
          <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm relative">
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1.5 shadow-md">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </div>
          </div>

          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-1">
            Why did you scan this QR?
          </h1>
          <p className="text-xs text-slate-500 mb-2">
            Please select the reason for scanning this QR code.
          </p>

          {/* Protected Vehicle Badge */}
          <div className="inline-flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-slate-700">
            <Car className="w-3.5 h-3.5 text-indigo-600" />
            <span>{displayVehicle?.vehicleBrand} {displayVehicle?.vehicleName} ({displayVehicle?.vehicleNumber})</span>
          </div>
        </div>

        {/* DYNAMIC REASON LIST (FETCHED FROM ADMIN SETTINGS, NOTHING SELECTED BY DEFAULT) */}
        <div className="p-6 pt-4 space-y-2.5">
          {scanReasons.map((opt) => {
            const Icon = getReasonIcon(opt.iconKey);
            const colorClass = getReasonColorClasses(opt.color);
            const isSelected = selectedReason === opt.title;
            return (
              <div
                key={opt._id}
                onClick={() => {
                  setSelectedReason(opt.title);
                  setReasonValidationMsg('');
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'border-[#1D56A5] bg-[#E9DFEE]/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`p-2.5 rounded-xl ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{opt.title}</span>
                </div>

                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                    isSelected ? 'border-[#1D56A5] bg-[#1D56A5]' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            );
          })}

          {/* OPTIONAL TEXTAREA: ONLY SHOWN WHEN "Other" OR isOtherType REASON IS SELECTED */}
          {isOtherSelected && (
            <div className="pt-2 transition-all animate-fadeIn">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Please describe the reason (optional)
              </label>
              <div className="relative">
                <textarea
                  rows="3"
                  maxLength="200"
                  placeholder="Type here..."
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#1D56A5] transition"
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-mono">
                  {otherText.length}/200
                </span>
              </div>
            </div>
          )}

          {/* Validation message if nothing selected */}
          {reasonValidationMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold animate-fadeIn">
              {reasonValidationMsg}
            </div>
          )}
        </div>

        {/* ACTION BUTTONS: MESSAGE, CALL & EMERGENCY */}
        <div className="p-6 pt-0 space-y-3">
          {/* 1. DIRECT SEND MESSAGE / WHATSAPP NOTIFICATION (Brand Blue #1D56A5) */}
          <button
            onClick={handleSendMessage}
            disabled={actionLoading}
            className="w-full bg-[#1D56A5] hover:bg-[#164382] text-white font-bold py-3.5 rounded-2xl shadow-md shadow-[#1D56A5]/25 flex items-center justify-center space-x-2.5 transition active:scale-[0.99]"
          >
            {actionLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <MessageSquare className="w-5 h-5" />
                <span>Send WhatsApp / Alert Message</span>
              </>
            )}
          </button>

          {/* 2. CALL OWNER BUTTON (Brand Green #259A3A) */}
          {!callInitiated ? (
            <button
              onClick={handleCallOwner}
              disabled={actionLoading}
              className="w-full bg-[#259A3A] hover:bg-[#1f8231] text-white font-bold py-3.5 rounded-2xl shadow-md shadow-[#259A3A]/25 flex items-center justify-center space-x-2.5 transition active:scale-[0.99]"
            >
              <Phone className="w-5 h-5" />
              <span>Call Vehicle Owner</span>
            </button>
          ) : (
            <div className="p-3.5 bg-emerald-50 border border-[#259A3A]/30 rounded-2xl text-center space-y-2 animate-fadeIn">
              <p className="text-xs text-emerald-800 font-semibold">{actionMessage}</p>
              <a
                href={`tel:${phoneToCall}`}
                className="inline-flex items-center space-x-2 bg-[#259A3A] hover:bg-[#1f8231] text-white font-black px-6 py-2.5 rounded-xl text-sm shadow-md transition"
              >
                <Phone className="w-4 h-4" />
                <span>📞 Dial {phoneToCall}</span>
              </a>
            </div>
          )}

          {/* 3. EMERGENCY ALERT BUTTON (Brand Orange #E94E1A) */}
          <button
            onClick={handleEmergencyTrigger}
            className="w-full bg-[#E94E1A] hover:bg-[#d84414] text-white font-bold py-3.5 rounded-2xl shadow-md shadow-[#E94E1A]/25 flex items-center justify-center space-x-2 transition active:scale-[0.99] text-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>🚨 Emergency Alert (Live GPS Location)</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <Link to="/dashboard" className="text-xs text-indigo-600 font-semibold hover:underline">
            Are you the vehicle owner? Manage account & quota →
          </Link>
        </div>
      </div>

      {/* EMERGENCY MODAL WITH LOCATION DISPATCH */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center">
            {gettingLocation ? (
              <div className="py-8 space-y-4">
                <Navigation className="w-12 h-12 text-red-600 animate-bounce mx-auto" />
                <h3 className="font-bold text-lg text-slate-900">Fetching GPS Location...</h3>
                <p className="text-xs text-slate-500">
                  Getting accurate coordinates to dispatch with emergency alert...
                </p>
              </div>
            ) : emergencyResult ? (
              <div className="space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="font-black text-xl text-slate-900">Emergency Dispatched!</h3>
                <p className="text-xs text-slate-600">{emergencyResult.message}</p>

                {emergencyResult.mapsLink && (
                  <a
                    href={emergencyResult.mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>View Dispatched Location Link ↗</span>
                  </a>
                )}

                {/* Emergency Contacts Links */}
                {emergencyResult.emergencyContacts?.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-200 space-y-2 mt-4">
                    <div className="text-xs font-bold text-slate-700">Designated Emergency Contacts:</div>
                    {emergencyResult.emergencyContacts.map((c, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-slate-500 font-mono">{c.number}</div>
                        </div>
                        <div className="flex space-x-1.5">
                          <a
                            href={`tel:${c.number}`}
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold hover:bg-emerald-100"
                          >
                            📞 Call
                          </a>
                          {c.whatsappLink && (
                            <a
                              href={c.whatsappLink}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-indigo-700 shadow-xs"
                            >
                              💬 Alert
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition text-sm mt-2"
                >
                  Done
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 2. USER DASHBOARD INTERFACE (/dashboard)
// -------------------------------------------------------------
function UserDashboardView() {
  const [token, setToken] = useState(localStorage.getItem('safe_drive_user_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('safe_drive_user_data') || 'null'));

  // Login Mode: 'MOBILE_OTP' | 'PASSWORD'
  const [loginMode, setLoginMode] = useState('MOBILE_OTP');

  // Password Auth Form
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Mobile OTP Auth Form
  const [loginPhone, setLoginPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard Navigation Tabs: 'QRS' | 'ORDERS'
  const [dashTab, setDashTab] = useState('QRS');

  // Dashboard Data
  const [dashData, setDashData] = useState(null);
  const [loadingDash, setLoadingDash] = useState(false);

  // Orders Data
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [viewingDigitalPass, setViewingDigitalPass] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);

  // Packages & Quota Modals
  const [packages, setPackages] = useState([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyingLoading, setBuyingLoading] = useState(false);

  // Ledger History Modal
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Activate Purchased QR Modal
  const [activatingQR, setActivatingQR] = useState(null);
  const [activationForm, setActivationForm] = useState({
    vehicleBrand: '',
    vehicleName: '',
    vehicleNumber: '',
    contact1Name: '',
    contact1Phone: '',
    contact2Name: '',
    contact2Phone: ''
  });
  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    city: '',
    state: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // 1. Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { phone, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('safe_drive_user_token', res.data.token);
        localStorage.setItem('safe_drive_user_data', JSON.stringify(res.data.user));
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. Send Login OTP to Mobile Phone
  const handleSendLoginOTP = async (e) => {
    e.preventDefault();
    const cleanPhone = loginPhone.trim();
    if (!cleanPhone) {
      setAuthError('Please enter your registered mobile number');
      return;
    }
    setOtpLoading(true);
    setAuthError('');
    setOtpSuccessMsg('');
    try {
      const res = await axios.post(`${API_BASE}/auth/send-login-otp`, { phone: cleanPhone });
      if (res.data.success) {
        setOtpSent(true);
        setOtpSuccessMsg(res.data.message || `OTP sent to mobile ${cleanPhone}`);
        setLoginOtp('123456'); // Auto-fill default test OTP for convenience
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Could not send login OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // 3. Verify Login OTP
  const handleVerifyLoginOTP = async (e) => {
    e.preventDefault();
    if (!loginOtp || loginOtp.length < 4) {
      setAuthError('Please enter valid OTP code');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/verify-login-otp`, {
        phone: loginPhone.trim(),
        otp: loginOtp.trim()
      });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('safe_drive_user_token', res.data.token);
        localStorage.setItem('safe_drive_user_data', JSON.stringify(res.data.user));
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('safe_drive_user_token');
    localStorage.removeItem('safe_drive_user_data');
  };

  const fetchDashboard = async () => {
    if (!token) return;
    setLoadingDash(true);
    try {
      const res = await axios.get(`${API_BASE}/user/dashboard`, authHeader);
      if (res.data.success) {
        setDashData(res.data);
        if (res.data.user) {
          setProfileForm({
            name: res.data.user.name || '',
            email: res.data.user.email || '',
            phone: res.data.user.phone || '',
            whatsappNumber: res.data.user.whatsappNumber || res.data.user.phone || '',
            address: res.data.user.address || '',
            city: res.data.user.city || '',
            state: res.data.user.state || ''
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDash(false);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await axios.get(`${API_BASE}/user/orders`, authHeader);
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API_BASE}/user/packages`, authHeader);
      if (res.data.success) {
        setPackages(res.data.packages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLedger = async () => {
    setLoadingLedger(true);
    try {
      const res = await axios.get(`${API_BASE}/user/ledger`, authHeader);
      if (res.data.success) {
        setLedger(res.data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard();
      fetchPackages();
      fetchOrders();
    }
  }, [token]);

  // Activate Purchased QR set
  const handleActivateQRSubmit = async (e) => {
    e.preventDefault();
    if (!activationForm.vehicleBrand || !activationForm.vehicleName || !activationForm.vehicleNumber) {
      setActivationError('Please fill in all vehicle details.');
      return;
    }
    if (!activationForm.contact1Phone || !activationForm.contact2Phone) {
      setActivationError('Please provide 2 emergency contact numbers.');
      return;
    }

    setActivatingLoading(true);
    setActivationError('');
    try {
      const payload = {
        qrId: activatingQR._id,
        vehicleBrand: activationForm.vehicleBrand,
        vehicleName: activationForm.vehicleName,
        vehicleNumber: activationForm.vehicleNumber,
        emergencyContacts: [
          { name: activationForm.contact1Name || 'Primary Contact', number: activationForm.contact1Phone },
          { name: activationForm.contact2Name || 'Secondary Contact', number: activationForm.contact2Phone }
        ]
      };
      const res = await axios.post(`${API_BASE}/user/qr/activate`, payload, authHeader);
      if (res.data.success) {
        alert(res.data.message);
        setActivatingQR(null);
        fetchDashboard();
      }
    } catch (err) {
      setActivationError(err.response?.data?.message || 'Activation failed');
    } finally {
      setActivatingLoading(false);
    }
  };

  // Buy Booster Quota
  const handleBuyPackage = async (pkg) => {
    if (!dashData?.qrs?.[0]) {
      alert('No active QR found');
      return;
    }
    setBuyingLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/user/quota/buy`,
        { qrId: dashData.qrs[0]._id, packageId: pkg._id },
        authHeader
      );
      if (res.data.success) {
        alert(`🎉 ${res.data.message}`);
        setShowBuyModal(false);
        fetchDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Purchase failed');
    } finally {
      setBuyingLoading(false);
    }
  };

  // Renew Subscription
  const handleRenewSubscription = async (qrId) => {
    if (!confirm('Renew QR protection for 365 Days for ₹199? Your existing unused quota will be safely preserved + 10 bonus calls and 20 bonus messages will be added.')) return;
    try {
      const res = await axios.post(
        `${API_BASE}/user/subscription/renew`,
        { qrId, renewalPrice: 199 },
        authHeader
      );
      if (res.data.success) {
        alert(`🎉 ${res.data.message}`);
        fetchDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Renewal failed');
    }
  };

  // Update Profile Info
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const res = await axios.put(`${API_BASE}/user/profile`, profileForm, authHeader);
      if (res.data.success) {
        setProfileSuccess(res.data.message);
        localStorage.setItem('safe_drive_user_data', JSON.stringify(res.data.user));
        fetchDashboard();
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // If not logged in, render User Login Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-center space-x-3 pb-4 border-b border-slate-100">
            <div className="p-3 bg-[#1D56A5] text-white rounded-2xl shadow-md shadow-[#1D56A5]/25">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">SAFE DRIVE</h1>
              <p className="text-xs uppercase tracking-widest text-[#1D56A5] font-bold">Customer Portal & Dashboard</p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 bg-red-50 border border-[#E94E1A]/30 rounded-2xl text-[#E94E1A] text-xs font-semibold">
              {authError}
            </div>
          )}

          {/* MOBILE OTP LOGIN FORM */}
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendLoginOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-xs text-slate-400 font-mono font-bold">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-900 text-sm font-mono tracking-wider focus:bg-white focus:outline-none focus:border-[#1D56A5] transition"
                      placeholder="9876543210"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Enter the 10-digit mobile number linked to your QR safety tag.</p>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || loginPhone.length < 10}
                  className="w-full bg-[#1D56A5] hover:bg-[#164382] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#1D56A5]/25 transition flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
                >
                  {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Login OTP Code →</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyLoginOTP} className="space-y-4 text-center">
                {otpSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-[#259A3A]/30 rounded-xl text-[#259A3A] text-xs font-semibold">
                    {otpSuccessMsg}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Enter 6-Digit OTP Code for +91 {loginPhone}
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    autoFocus
                    required
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-44 mx-auto bg-slate-50 border-2 border-[#1D56A5] rounded-2xl py-3 text-center text-3xl font-black font-mono tracking-widest text-slate-900 focus:bg-white focus:outline-none"
                    placeholder="123456"
                  />
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">Default Test OTP: <span className="font-mono font-bold text-[#1D56A5]">123456</span></p>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-1/3 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs hover:bg-slate-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={authLoading || loginOtp.length < 6}
                    className="w-2/3 bg-[#259A3A] hover:bg-[#1e7e2e] text-white font-bold py-3 rounded-xl shadow-md text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Login →</span>}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <Link
              to="/store"
              className="inline-flex items-center space-x-2 bg-[#E9DFEE] hover:bg-[#d9cbe0] text-[#1D56A5] font-bold px-4 py-2.5 rounded-xl text-xs transition border border-[#1D56A5]/20 shadow-2xs w-full justify-center"
            >
              <span>🛒 Buy QR Safety Kit in Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Group unlinked QRs by unique productId so copies belong to 1 kit
  const unlinkedKitMap = {};
  (dashData?.qrs?.filter((q) => q.status === 'SOLD' || !q.vehicleId) || []).forEach((q) => {
    const pId = q.productId || q.copyCode;
    if (!unlinkedKitMap[pId]) {
      unlinkedKitMap[pId] = {
        productId: pId,
        primaryQR: q,
        qrType: q.qrType,
        qrFor: q.qrFor,
        status: q.status,
        copies: []
      };
    }
    unlinkedKitMap[pId].copies.push(q);
  });
  const unlinkedKits = Object.values(unlinkedKitMap);
  const activeVehicles = dashData?.vehicles || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 p-5 rounded-3xl shadow-sm gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#1D56A5] text-white rounded-2xl shadow-md shadow-[#1D56A5]/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">{dashData?.user?.name || user?.name}</h1>
              <p className="text-xs text-slate-500 font-mono">{dashData?.user?.email || dashData?.user?.phone || user?.phone}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            <Link
              to="/store"
              className="flex items-center space-x-1.5 bg-[#1D56A5] hover:bg-[#164382] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs transition"
            >
              <span>🛒 Store</span>
            </Link>
            <button
              onClick={() => {
                setShowLedgerModal(true);
                fetchLedger();
              }}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 transition"
            >
              <History className="w-4 h-4 text-[#1D56A5]" />
              <span className="hidden sm:inline">Ledger</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs: MY ITEMS & MY ORDERS & MY PROFILE */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setDashTab('QRS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              dashTab === 'QRS'
                ? 'bg-[#1D56A5] text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            🏷️ Protected Items & QR Tags ({activeVehicles.length || unlinkedKits.length || 0})
          </button>
          <button
            onClick={() => {
              setDashTab('ORDERS');
              fetchOrders();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              dashTab === 'ORDERS'
                ? 'bg-[#1D56A5] text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            📦 My Order Invoices ({orders.length})
          </button>
          <button
            onClick={() => setDashTab('PROFILE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              dashTab === 'PROFILE'
                ? 'bg-[#1D56A5] text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            👤 My Profile & Address
          </button>
        </div>

        {/* TAB 1: PROTECTED ITEMS & QR TAGS */}
        {dashTab === 'QRS' && (
          <div className="space-y-6">
            {/* Quota Wallet Cards */}
            {dashData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* VOICE CALL QUOTA */}
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs uppercase font-bold text-[#259A3A] tracking-wider">Voice Call Quota</span>
                      <div className="text-4xl font-black text-slate-900 mt-1">
                        {dashData.summary?.totalCallsRemaining}{' '}
                        <span className="text-sm font-normal text-slate-500">Calls left</span>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 text-[#259A3A] rounded-2xl">
                      <Phone className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mb-4">
                    Total Used: <span className="font-bold text-slate-900">{dashData.summary?.totalCallsUsed} calls</span>
                  </div>
                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="w-full bg-[#259A3A] hover:bg-[#1e7e2e] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-[#259A3A]/20"
                  >
                    + Buy Call Booster
                  </button>
                </div>

                {/* MESSAGE QUOTA */}
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs uppercase font-bold text-[#1D56A5] tracking-wider">Message / SMS Quota</span>
                      <div className="text-4xl font-black text-slate-900 mt-1">
                        {dashData.summary?.totalMessagesRemaining}{' '}
                        <span className="text-sm font-normal text-slate-500">Msgs left</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 text-[#1D56A5] rounded-2xl">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mb-4">
                    Total Used: <span className="font-bold text-slate-900">{dashData.summary?.totalMessagesUsed} msgs</span>
                  </div>
                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="w-full bg-[#1D56A5] hover:bg-[#164382] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-[#1D56A5]/20"
                  >
                    + Buy Message Booster
                  </button>
                </div>
              </div>
            )}

            {/* UNLINKED PURCHASED QR KITS (SOLD STATUS) */}
            {unlinkedKits.length > 0 && (
              <div className="bg-amber-50/70 border-2 border-amber-200 p-6 rounded-3xl space-y-4">
                <div className="flex items-center space-x-2 text-amber-900 font-black text-base">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span>Purchased QR Kits Ready for Activation ({unlinkedKits.length})</span>
                </div>
                <p className="text-xs text-amber-700">
                  You have purchased the following QR safety kit(s). Link your item/vehicle tag identifier and emergency contacts to activate protection.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {unlinkedKits.map((kit) => (
                    <div key={kit.productId} className="bg-white border border-amber-200 p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-slate-900 text-base">🏷️ {kit.productId}</span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                            Ready to Link
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Includes {kit.copies.length} Stickers ({kit.copies.map(c => c.copyCode).join(', ')})
                        </p>
                      </div>

                      <Link
                        to={`/q/${kit.primaryQR.publicToken}`}
                        target="_blank"
                        className="w-full bg-[#1D56A5] hover:bg-[#164382] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm text-center block"
                      >
                        🏷️ Link Item / Vehicle & Activate ↗
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIVATED ITEMS & QR TAGS TABLE */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-[#1D56A5]" />
                    <span>Protected Items & Active QR Tags ({activeVehicles.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vehicles, bags, luggage, and personal assets actively secured with Safe Drive QR smart tags
                  </p>
                </div>
              </div>

              {activeVehicles.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No active items or vehicles registered yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Item / Asset</th>
                        <th className="py-3 px-4">Tag / Plate ID</th>
                        <th className="py-3 px-4">QR Kit Set</th>
                        <th className="py-3 px-4">Emergency Contacts</th>
                        <th className="py-3 px-4">Validity</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeVehicles.map((v) => {
                        const vehicleQRs = dashData.qrs?.filter((q) => q.vehicleId?._id === v._id || q.vehicleId === v._id) || [];
                        const primaryQR = vehicleQRs[0];
                        const copiesList = vehicleQRs.map(q => q.copyCode).join(', ');
                        const qrCategory = primaryQR?.qrFor || 'Protected Item';
                        const isDigital = primaryQR?.qrType === 'DIGITAL';

                        return (
                          <tr key={v._id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-4">
                              <div className="font-black text-slate-900 text-sm flex items-center space-x-1.5">
                                <span>🏷️</span>
                                <span>{v.vehicleBrand} {v.vehicleName}</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-0.5 inline-block">
                                {qrCategory}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                              <span className="bg-[#E9DFEE] text-[#1D56A5] px-2.5 py-1 rounded-lg border border-[#1D56A5]/20">
                                {v.vehicleNumber}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-1.5 font-mono font-bold text-slate-900">
                                <span>{primaryQR?.productId || 'SD-KIT'}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                  isDigital ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-800'
                                }`}>
                                  {isDigital ? 'DIGITAL' : 'PHYSICAL'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Copies: {copiesList || '1 Sticker'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-[11px] text-slate-600 space-y-0.5">
                              {v.emergencyContacts && v.emergencyContacts.length > 0 ? (
                                v.emergencyContacts.map((c, i) => (
                                  <div key={i} className="truncate">
                                    <span className="font-bold">{c.name}:</span> {c.number}
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#259A3A] border border-[#259A3A]/30 mb-0.5">
                                Active
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Exp: {primaryQR?.expiryDate ? new Date(primaryQR.expiryDate).toLocaleDateString() : '365 Days'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right space-y-1">
                              {primaryQR && (
                                <div className="flex items-center justify-end space-x-1.5">
                                  <Link
                                    to={`/q/${primaryQR.publicToken}`}
                                    target="_blank"
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition inline-flex items-center space-x-1"
                                    title="View Public Scan Page"
                                  >
                                    <ExternalLink className="w-3 h-3 text-[#1D56A5]" />
                                    <span>Scan Page</span>
                                  </Link>
                                  <button
                                    onClick={() => handleRenewSubscription(primaryQR._id)}
                                    className="bg-[#1D56A5] hover:bg-[#164382] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition shadow-2xs inline-flex items-center space-x-1"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Renew</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ORDER HISTORY INVOICES */}
        {dashTab === 'ORDERS' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-[#1D56A5]" />
                  <span>My Purchase Orders & Invoices ({orders.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track your physical sticker kit shipments and access your digital E-QR passes
                </p>
              </div>
              <button
                onClick={fetchOrders}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition text-xs font-bold flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {loadingOrders ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#1D56A5]" />
                <span className="text-xs font-semibold">Loading order history...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Package className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-700">No orders recorded yet</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You haven't bought any QR safety kits yet. Visit our official store to protect your vehicle.
                </p>
                <Link
                  to="/store"
                  className="inline-flex items-center space-x-1.5 bg-[#1D56A5] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition mt-2"
                >
                  <span>🛒 Visit Store</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => {
                  const isDigital = ord.productType === 'DIGITAL';
                  const prodImg = ord.productId?.imageUrl;
                  const prodTitle = ord.productName || ord.productId?.title || ord.productId?.name || 'QR Safety Kit';
                  const allottedCode = ord.claimedProductId || (ord.allocatedQRIds && ord.allocatedQRIds[0]?.productId) || null;

                  return (
                    <div
                      key={ord._id}
                      className="border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition shadow-2xs space-y-4 bg-slate-50/40"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200/60">
                        <div className="flex items-center space-x-3">
                          {prodImg ? (
                            <img
                              src={prodImg}
                              alt={prodTitle}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#E9DFEE] text-[#1D56A5] flex items-center justify-center font-black shrink-0">
                              <QrCode className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-slate-900 text-sm">{prodTitle}</h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  isDigital
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {isDigital ? '💻 DIGITAL PASS' : '📦 PHYSICAL KIT'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Order #{ord.orderNumber || ord.orderId} • {new Date(ord.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="text-lg font-black text-[#1D56A5]">₹{ord.amount}</div>
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ {ord.paymentStatus || 'PAID'}
                          </span>
                        </div>
                      </div>

                      {/* Order Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Quantity & Items</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {ord.quantity || 1} {ord.quantity > 1 ? 'Kit Sets' : 'Kit Set'} ({isDigital ? 'E-Pass' : 'Physical Stickers'})
                          </span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Status / Fulfillment</span>
                          <span className="font-bold text-slate-800">
                            {isDigital ? '⚡ Instant Digital Access' : `🚚 ${ord.deliveryStatus || 'PROCESSING'}`}
                          </span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Payment Reference</span>
                          <span className="font-mono text-slate-600 truncate block">
                            {ord.razorpayPaymentId || ord.paymentId || 'Simulated'}
                          </span>
                        </div>
                      </div>

                      {/* Physical Product Notice & Delivery Address (NO QR details) */}
                      {!isDigital && (
                        <div className="space-y-2">
                          {ord.deliveryAddress && (
                            <div className="text-xs bg-white p-3 rounded-xl border border-slate-200 text-slate-600 flex items-start space-x-2">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-800">Shipping Address: </span>
                                {ord.deliveryAddress}, {ord.city} {ord.state} - {ord.pincode}
                              </div>
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500 bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-xl flex items-center space-x-2">
                            <Package className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>
                              Physical stickers will be delivered to your address. Once delivered, scan any sticker with your phone to register your vehicle.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Digital Product QR Details, Preview, Download & Print */}
                      {isDigital && ord.allocatedQRIds && ord.allocatedQRIds.length > 0 && (
                        <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/60 rounded-2xl space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
                              <QrCode className="w-4 h-4 text-[#1D56A5]" />
                              <span>Digital QR Safety Stickers ({ord.allocatedQRIds.length})</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold text-[#1D56A5] bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                              Kit: {allottedCode || 'SD-PASS'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ord.allocatedQRIds.map((qrItem, idx) => {
                              const scanUrl = `${window.location.origin}/q/${qrItem.publicToken}`;
                              const svgElemId = `qr-card-svg-${qrItem.copyCode || idx}`;

                              return (
                                <div
                                  key={qrItem._id || idx}
                                  className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center space-x-3 shadow-2xs"
                                >
                                  <SafeDriveQRCode
                                    id={svgElemId}
                                    value={scanUrl}
                                    size={64}
                                    className="bg-white p-1 rounded-lg border border-slate-200 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-mono font-black text-xs text-slate-900 truncate">
                                      {qrItem.copyCode}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      Token: {qrItem.publicToken?.slice(0, 10)}...
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <button
                                        type="button"
                                        onClick={() => downloadQRCodeSVG(svgElemId, `${qrItem.copyCode}-SafeDrive.png`)}
                                        className="text-[10px] font-bold text-[#1D56A5] hover:bg-blue-50 px-2 py-1 rounded-lg border border-[#1D56A5]/25 flex items-center space-x-1 transition"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>Download</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setViewingDigitalPass(ord)}
                                        className="text-[10px] font-bold text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 flex items-center space-x-1 transition"
                                      >
                                        <Printer className="w-3 h-3" />
                                        <span>Print</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200/60">
                        <button
                          onClick={() => setViewingOrder(ord)}
                          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs flex items-center space-x-1.5 transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#1D56A5]" />
                          <span>View Order Details</span>
                        </button>

                        {isDigital && ord.allocatedQRIds && ord.allocatedQRIds.length > 0 && (
                          <button
                            onClick={() => setViewingDigitalPass(ord)}
                            className="bg-[#1D56A5] hover:bg-[#164382] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-[#1D56A5]/20 flex items-center space-x-1.5 transition"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>View & Print E-Pass</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USER PROFILE */}
        {dashTab === 'PROFILE' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <User className="w-5 h-5 text-[#1D56A5]" />
                <span>Account Profile & Delivery Details</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your name, email, WhatsApp alert number, and delivery address
              </p>
            </div>

            {profileSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-[#259A3A]/30 rounded-2xl text-[#259A3A] text-xs font-semibold">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="p-3.5 bg-red-50 border border-[#E94E1A]/30 rounded-2xl text-[#E94E1A] text-xs font-semibold">
                {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1D56A5]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Registered Phone (Primary)</label>
                  <input
                    type="tel"
                    disabled
                    value={profileForm.phone}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1D56A5]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">WhatsApp Alert Mobile</label>
                  <input
                    type="tel"
                    value={profileForm.whatsappNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, whatsappNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1D56A5]"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Delivery Address</label>
                <textarea
                  rows="2"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#1D56A5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#1D56A5]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">State</label>
                  <input
                    type="text"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#1D56A5]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="bg-[#1D56A5] hover:bg-[#164382] text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-[#1D56A5]/25 transition flex items-center space-x-2"
              >
                {profileSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Save Profile Changes</span>}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ACTIVATE QR MODAL */}
      {activatingQR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl my-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900">Activate Vehicle Protection</h3>
                <p className="text-xs text-slate-500">Binding QR Kit: <strong className="text-[#1D56A5]">{activatingQR.copyCode}</strong></p>
              </div>
              <button onClick={() => setActivatingQR(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            {activationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                {activationError}
              </div>
            )}

            <form onSubmit={handleActivateQRSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyundai, Tata"
                    value={activationForm.vehicleBrand}
                    onChange={(e) => setActivationForm({ ...activationForm, vehicleBrand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Model Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Creta, Nexon"
                    value={activationForm.vehicleName}
                    onChange={(e) => setActivationForm({ ...activationForm, vehicleName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Number Plate *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UP32AB1234"
                  value={activationForm.vehicleNumber}
                  onChange={(e) => setActivationForm({ ...activationForm, vehicleNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold uppercase"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">2 Emergency Contacts *</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Contact 1 Name"
                    value={activationForm.contact1Name}
                    onChange={(e) => setActivationForm({ ...activationForm, contact1Name: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit Phone"
                    value={activationForm.contact1Phone}
                    onChange={(e) => setActivationForm({ ...activationForm, contact1Phone: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Contact 2 Name"
                    value={activationForm.contact2Name}
                    onChange={(e) => setActivationForm({ ...activationForm, contact2Name: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit Phone"
                    value={activationForm.contact2Phone}
                    onChange={(e) => setActivationForm({ ...activationForm, contact2Phone: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivatingQR(null)}
                  className="w-1/3 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={activatingLoading}
                  className="w-2/3 bg-[#1D56A5] hover:bg-[#164382] text-white font-bold py-2.5 rounded-xl shadow-md text-xs transition flex items-center justify-center space-x-2"
                >
                  {activatingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Activate Vehicle</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BUY QUOTA MODAL */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Buy Call / Message Booster</span>
              </h3>
              <button onClick={() => setShowBuyModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {packages.map((pkg) => (
                <div key={pkg._id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{pkg.name}</h4>
                    <p className="text-xs text-slate-500">
                      Adds <span className="font-bold text-emerald-600">+{pkg.quantity}</span> {pkg.category} quota instantly
                    </p>
                  </div>
                  <button
                    onClick={() => handleBuyPackage(pkg)}
                    disabled={buyingLoading}
                    className="bg-[#1D56A5] hover:bg-[#164382] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-[#1D56A5]/20"
                  >
                    Pay ₹{pkg.price}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LEDGER MODAL */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
                <History className="w-5 h-5 text-[#1D56A5]" />
                <span>Quota Audit Ledger</span>
              </h3>
              <button onClick={() => setShowLedgerModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 pr-1">
              {loadingLedger ? (
                <div className="p-8 text-center text-slate-500">Loading ledger records...</div>
              ) : ledger.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No transactions recorded yet.</div>
              ) : (
                ledger.map((tx) => (
                  <div key={tx._id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{tx.reason}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">{new Date(tx.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-mono font-bold ${
                          tx.type === 'CREDIT' ? 'text-[#259A3A]' : 'text-[#E94E1A]'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? '+' : '-'}{tx.quantity} {tx.category}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Bal: {tx.balanceAfter}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL E-QR PASS MODAL */}
      {viewingDigitalPass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-7 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#1D56A5]/10 text-[#1D56A5] flex items-center justify-center font-bold shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">Digital E-QR Safety Passes</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Kit #{viewingDigitalPass.claimedProductId || viewingDigitalPass.allocatedQRIds?.[0]?.productId || 'SD-PASS'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingDigitalPass(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-base p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-blue-50/70 border border-blue-200/60 p-3.5 rounded-2xl text-xs text-blue-900 leading-relaxed">
              💡 <strong>How to Activate:</strong> Scan any of the QR codes below with your smartphone camera to register your vehicle details with OTP verification.
            </div>

            {/* QR Passes List */}
            <div className="space-y-4">
              {(viewingDigitalPass.allocatedQRIds?.length > 0
                ? viewingDigitalPass.allocatedQRIds
                : [{ copyCode: 'SD001C1', publicToken: 'sample_token' }]
              ).map((qrItem, idx) => {
                const token = qrItem.publicToken || 'digital_token';
                const scanUrl = `${window.location.origin}/q/${token}`;
                const svgId = `modal-qr-svg-${qrItem.copyCode || idx}`;

                return (
                  <div
                    key={qrItem._id || idx}
                    className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
                  >
                    <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs shrink-0">
                      <SafeDriveQRCode id={svgId} value={scanUrl} size={130} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="inline-block font-mono font-black text-slate-900 text-sm bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        🏷️ {qrItem.copyCode || `Pass Copy ${idx + 1}`}
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate">
                        Scan URL: <span className="text-[#1D56A5]">{scanUrl}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Validity: 365 Days Protection • Calls & SMS Masked
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => downloadQRCodeSVG(svgId, `${qrItem.copyCode || 'SafeDrive-QR'}.png`)}
                          className="bg-white hover:bg-slate-100 text-[#1D56A5] border border-[#1D56A5]/30 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs flex items-center space-x-1.5 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PNG</span>
                        </button>

                        <a
                          href={scanUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#1D56A5] hover:bg-[#164382] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs flex items-center space-x-1.5 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Test Scan / Open</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print All Passes</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingDigitalPass(null)}
                className="w-1/2 bg-[#1D56A5] hover:bg-[#164382] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-[#1D56A5]/25"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS & INVOICE MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-7 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* 1. Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#1D56A5]/10 text-[#1D56A5] flex items-center justify-center font-bold shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">Order Details & Receipt</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    #{viewingOrder.orderNumber || viewingOrder.orderId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-base p-1"
              >
                ✕
              </button>
            </div>

            {/* 2. Product Summary Banner */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center space-x-3.5">
              {viewingOrder.productId?.imageUrl ? (
                <img
                  src={viewingOrder.productId.imageUrl}
                  alt={viewingOrder.productName}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#E9DFEE] text-[#1D56A5] flex items-center justify-center font-black shrink-0">
                  <ShoppingBag className="w-7 h-7" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    viewingOrder.productType === 'DIGITAL'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {viewingOrder.productType === 'DIGITAL' ? '💻 DIGITAL PASS' : '📦 PHYSICAL STICKER KIT'}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-sm truncate">
                  {viewingOrder.productName || viewingOrder.productId?.title || viewingOrder.productId?.name || 'QR Protection Kit'}
                </h4>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  📞 {viewingOrder.metadata?.initialCalls || viewingOrder.productId?.initialCalls || 10} Calls • 💬 {viewingOrder.metadata?.initialMessages || viewingOrder.productId?.initialMessages || 20} SMS • ⏱️ {viewingOrder.metadata?.validityDays || viewingOrder.productId?.validityDays || 365} Days
                </div>
              </div>
            </div>

            {/* 3. Transaction & Pricing Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Purchase Date & Time</span>
                <span className="font-bold text-slate-900 block">
                  {new Date(viewingOrder.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Amount Paid</span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-base font-black text-[#1D56A5]">₹{viewingOrder.amount}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">✓ Paid</span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Quantity</span>
                <span className="font-bold text-slate-900 text-sm">
                  {viewingOrder.quantity || 1} Kit Set ({viewingOrder.productType === 'DIGITAL' ? 'E-Pass' : 'Physical Stickers'})
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Fulfillment Status</span>
                <span className="font-bold text-slate-900 block">
                  {viewingOrder.productType === 'DIGITAL' ? '⚡ Instant Active Access' : `🚚 ${viewingOrder.deliveryStatus || 'PROCESSING'}`}
                </span>
              </div>
            </div>

            {/* 4. Payment & Gateway IDs */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Payment Reference:</span>
                <span className="font-bold text-slate-800">{viewingOrder.razorpayPaymentId || viewingOrder.paymentId || 'Simulated'}</span>
              </div>
              {viewingOrder.razorpayOrderId && (
                <div className="flex justify-between text-slate-500">
                  <span>Gateway Order:</span>
                  <span className="font-bold text-slate-800">{viewingOrder.razorpayOrderId}</span>
                </div>
              )}
            </div>

            {/* 5. Customer & Shipping Contact */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer & Delivery:</div>
              <div className="text-slate-800 font-medium">
                <strong>{viewingOrder.customerName || viewingOrder.userId?.name}</strong> • 📱 {viewingOrder.customerPhone || viewingOrder.userId?.phone}
              </div>
              {viewingOrder.customerEmail && (
                <div className="text-slate-600 text-[11px]">
                  ✉️ {viewingOrder.customerEmail}
                </div>
              )}
              {viewingOrder.deliveryAddress && (
                <div className="text-slate-700 text-[11px] pt-1.5 border-t border-slate-100 flex items-start space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{viewingOrder.deliveryAddress}, {viewingOrder.city} {viewingOrder.state} - {viewingOrder.pincode}</span>
                </div>
              )}
            </div>

            {/* 6. Physical Notice vs Digital QR Code Preview */}
            {viewingOrder.productType !== 'DIGITAL' ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start space-x-2.5">
                <Package className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Physical Stickers Delivery</div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Your reflective QR sticker kit is being prepared for shipment. Once delivered to your address, scan any sticker to register your vehicle and activate.
                  </div>
                </div>
              </div>
            ) : viewingOrder.allocatedQRIds?.length > 0 && (
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-indigo-950">
                  <span>Digital QR Codes Ready</span>
                  <span className="text-[10px] text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    Kit: {viewingOrder.claimedProductId || viewingOrder.allocatedQRIds?.[0]?.productId || 'SD-PASS'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {viewingOrder.allocatedQRIds.map((qrItem, idx) => {
                    const scanUrl = `${window.location.origin}/q/${qrItem.publicToken}`;
                    const svgId = `order-modal-qr-svg-${qrItem.copyCode || idx}`;

                    return (
                      <div
                        key={qrItem._id || idx}
                        className="bg-white p-2.5 rounded-xl border border-indigo-100 flex items-center space-x-2.5 shadow-2xs"
                      >
                        <SafeDriveQRCode id={svgId} value={scanUrl} size={48} />
                        <div>
                          <div className="font-mono font-bold text-xs text-slate-900">{qrItem.copyCode}</div>
                          <button
                            type="button"
                            onClick={() => downloadQRCodeSVG(svgId, `${qrItem.copyCode}-SafeDrive.png`)}
                            className="text-[10px] text-[#1D56A5] font-bold hover:underline flex items-center space-x-1 mt-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download PNG</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. Modal Actions */}
            <div className="flex space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Receipt</span>
              </button>

              {viewingOrder.productType === 'DIGITAL' && viewingOrder.allocatedQRIds?.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const ord = viewingOrder;
                    setViewingOrder(null);
                    setViewingDigitalPass(ord);
                  }}
                  className="w-1/2 bg-[#1D56A5] hover:bg-[#164382] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-[#1D56A5]/25 flex items-center justify-center space-x-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Open E-QR Pass</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="w-1/2 bg-[#1D56A5] hover:bg-[#164382] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-[#1D56A5]/25"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MAIN ROUTER
// -------------------------------------------------------------
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/store" element={<Store />} />
        <Route path="/q/:token" element={<PublicQRScanView />} />
        <Route path="/dashboard" element={<UserDashboardView />} />
        <Route path="/" element={<UserDashboardView />} />
      </Routes>
    </Router>
  );
}
