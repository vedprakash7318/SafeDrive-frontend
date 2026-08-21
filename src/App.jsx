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
  HelpCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
    setRegistering(true);
    setRegError('');
    try {
      const res = await axios.post(`${API_BASE}/public/qr/${token}/register`, regForm);
      if (res.data.success) {
        localStorage.setItem('safe_drive_user_token', res.data.token);
        localStorage.setItem('safe_drive_user_data', JSON.stringify(res.data.user));
        alert('🎉 Vehicle registered and QR activated successfully!');
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

  // STATE 1: UNREGISTERED QR (FIRST-TIME REGISTRATION)
  if (qrData.status === 'UNREGISTERED') {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 p-4 py-8 flex flex-col items-center">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">First-Time QR Activation</h1>
              <p className="text-xs font-mono text-indigo-600 font-bold">QR Code: {qrData.copyCode} ({qrData.productId})</p>
            </div>
          </div>

          {regError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {regError}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>1. Vehicle Owner Details</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="e.g. Ved Prakash"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number (Calling) *</label>
                    <input
                      type="tel"
                      required
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp Number</label>
                    <input
                      type="tel"
                      value={regForm.whatsappNumber}
                      onChange={(e) => setRegForm({ ...regForm, whatsappNumber: e.target.value })}
                      placeholder="WhatsApp (optional)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Address / City *</label>
                  <input
                    type="text"
                    required
                    value={regForm.address}
                    onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                    placeholder="e.g. Hazratganj, Lucknow"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center space-x-2">
                <Car className="w-4 h-4" />
                <span>2. Vehicle Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={regForm.vehicleBrand}
                    onChange={(e) => setRegForm({ ...regForm, vehicleBrand: e.target.value })}
                    placeholder="e.g. Hyundai"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Model Name *</label>
                  <input
                    type="text"
                    required
                    value={regForm.vehicleName}
                    onChange={(e) => setRegForm({ ...regForm, vehicleName: e.target.value })}
                    placeholder="e.g. Creta"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Number Plate *</label>
                  <input
                    type="text"
                    required
                    value={regForm.vehicleNumber}
                    onChange={(e) => setRegForm({ ...regForm, vehicleNumber: e.target.value })}
                    placeholder="e.g. UP32AB1234"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 mb-3 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>3. Emergency Contacts (2 Required)</span>
              </h3>

              <div className="p-3 bg-slate-50 rounded-xl mb-3 border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-2">Emergency Contact 1</div>
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
                    placeholder="Contact 1 Phone"
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
                <div className="text-xs font-bold text-slate-700 mb-2">Emergency Contact 2</div>
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
                    placeholder="Contact 2 Phone"
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

            <button
              type="submit"
              disabled={registering}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center space-x-2 text-base"
            >
              {registering ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Activate QR & Start Protection</span>}
            </button>
          </form>
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

  // Auth Forms
  const [phone, setPhone] = useState('8888888888');
  const [password, setPassword] = useState('user123');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard Data
  const [dashData, setDashData] = useState(null);
  const [loadingDash, setLoadingDash] = useState(false);

  // Packages & Quota Modals
  const [packages, setPackages] = useState([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyingLoading, setBuyingLoading] = useState(false);

  // Ledger History Modal
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const handleLogin = async (e) => {
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDash(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/packages`, authHeader);
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
    }
  }, [token]);

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

  // If not logged in, render User Login Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">SAFE DRIVE</h1>
              <p className="text-xs uppercase tracking-widest text-indigo-600 font-bold">Vehicle Owner Portal</p>
            </div>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Registered Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-sm focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                placeholder="e.g. 8888888888"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center space-x-2"
            >
              {authLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Login to Vehicle Dashboard</span>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Demo Credentials: <span className="text-indigo-600 font-mono font-bold">8888888888 / user123</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">{dashData?.user?.name || user?.name}</h1>
              <p className="text-xs text-slate-500 font-mono">{dashData?.user?.phone || user?.phone}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setShowLedgerModal(true);
                fetchLedger();
              }}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 transition"
            >
              <History className="w-4 h-4 text-indigo-600" />
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

        {/* Quota Wallet Cards */}
        {dashData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CALL QUOTA */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">Voice Call Quota</span>
                  <div className="text-4xl font-black text-slate-900 mt-1">
                    {dashData.summary?.totalCallsRemaining}{' '}
                    <span className="text-sm font-normal text-slate-500">Calls left</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Phone className="w-6 h-6" />
                </div>
              </div>
              <div className="text-xs text-slate-500 mb-4">
                Total Used: <span className="font-bold text-slate-900">{dashData.summary?.totalCallsUsed} calls</span>
              </div>
              <button
                onClick={() => setShowBuyModal(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-emerald-600/20"
              >
                + Buy Call Booster
              </button>
            </div>

            {/* MESSAGE QUOTA */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs uppercase font-bold text-blue-700 tracking-wider">Message / SMS Quota</span>
                  <div className="text-4xl font-black text-slate-900 mt-1">
                    {dashData.summary?.totalMessagesRemaining}{' '}
                    <span className="text-sm font-normal text-slate-500">Msgs left</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>
              <div className="text-xs text-slate-500 mb-4">
                Total Used: <span className="font-bold text-slate-900">{dashData.summary?.totalMessagesUsed} msgs</span>
              </div>
              <button
                onClick={() => setShowBuyModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-600/20"
              >
                + Buy Message Booster
              </button>
            </div>
          </div>
        )}

        {/* My Protected Vehicles & QRs */}
        {dashData?.vehicles?.map((v) => (
          <div key={v._id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {v.vehicleBrand} {v.vehicleName}
                </h2>
                <div className="font-mono text-sm text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-xl inline-block mt-1">
                  {v.vehicleNumber}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                  Protected & Active
                </span>
              </div>
            </div>

            {/* Linked QR Code Cards */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Linked Safe Drive QR Stickers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dashData.qrs
                  ?.filter((q) => q.vehicleId?._id === v._id || q.vehicleId === v._id)
                  .map((qr) => (
                    <div key={qr._id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-slate-900 text-base">{qr.copyCode}</div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Expires: <span className="text-slate-900 font-semibold">{qr.expiryDate ? new Date(qr.expiryDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <Link
                          to={`/q/${qr.publicToken}`}
                          target="_blank"
                          className="inline-block text-xs text-indigo-600 font-bold hover:underline mt-2"
                        >
                          View Public Scan Page ↗
                        </Link>
                      </div>

                      <button
                        onClick={() => handleRenewSubscription(qr._id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
                      >
                        Renew (₹199)
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Emergency Contacts (2)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {v.emergencyContacts?.map((c, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="font-mono text-emerald-700 font-bold">{c.number}</div>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">Contact {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Quota Preservation Guarantee Badge */}
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center space-x-3 text-xs text-indigo-900">
          <Info className="w-5 h-5 flex-shrink-0 text-indigo-600" />
          <span>
            <strong className="text-slate-900">Safe Drive Guarantee:</strong> Unused calls and messages are NEVER lost. Even after expiration, your balance is preserved and restored upon renewal.
          </span>
        </div>
      </div>

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
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20"
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
                <History className="w-5 h-5 text-indigo-600" />
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
                          tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'
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
        <Route path="/q/:token" element={<PublicQRScanView />} />
        <Route path="/dashboard" element={<UserDashboardView />} />
        <Route path="/" element={<UserDashboardView />} />
      </Routes>
    </Router>
  );
}
