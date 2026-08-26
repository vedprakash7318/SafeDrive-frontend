import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Phone,
  MessageSquare,
  AlertTriangle,
  Car,
  Bell,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Send,
  ExternalLink,
  ChevronRight,
  User,
  KeyRound,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Check,
  Lock
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AppLoader from '../components/AppLoader';

const getReasonEmoji = (r) => {
  if (r.icon) return r.icon;
  switch (r.iconKey) {
    case 'luggage':
    case 'briefcase':
    case 'bag': return '🧳';
    case 'pet':
    case 'dog': return '🐾';
    case 'key': return '🔑';
    case 'laptop':
    case 'device': return '💻';
    case 'package':
    case 'box': return '📦';
    case 'wallet': return '👛';
    case 'phone': return '📱';
    case 'ban': return '🚫';
    case 'unlock': return '🔓';
    case 'car': return '🚗';
    case 'bike': return '🏍️';
    case 'truck': return '🚚';
    case 'alert':
    case 'warning': return '⚠️';
    case 'bell': return '🔔';
    case 'location': return '📍';
    case 'shield': return '🛡️';
    case 'other':
    case 'message': return '💬';
    default: return '📌';
  }
};

export default function PublicQRScan() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanReasons, setScanReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherText, setOtherText] = useState('');
  const [reasonValidationMsg, setReasonValidationMsg] = useState('');

  // -------------------------------------------------------------
  // REGISTRATION & ACTIVATION FLOW STATES (FOR UNREGISTERED QR)
  // -------------------------------------------------------------
  const [regStep, setRegStep] = useState(1); // 1 = OTP Verify, 2 = Details, 3 = Activated
  const [regPhone, setRegPhone] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [regSendingOtp, setRegSendingOtp] = useState(false);
  const [regVerifyingOtp, setRegVerifyingOtp] = useState(false);
  const [regActivating, setRegActivating] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [sameForWhatsApp, setSameForWhatsApp] = useState(true);

  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    gender: 'Male',
    whatsappNumber: '',
    vehicleNumber: '',
    vehicleBrand: '',
    vehicleName: '',
    itemName: '',
    itemType: '',
    securityCode: '',
    contact1Name: '',
    contact1Phone: '',
    contact2Name: '',
    contact2Phone: ''
  });

  // -------------------------------------------------------------
  // CITIZEN SCAN STATES (FOR ACTIVE QR)
  // -------------------------------------------------------------
  const [isPlateVerified, setIsPlateVerified] = useState(false);
  const [last4Input, setLast4Input] = useState('');
  const [verifyingPlate, setVerifyingPlate] = useState(false);
  const [plateVerifyError, setPlateVerifyError] = useState('');
  const [verifiedVehicleData, setVerifiedVehicleData] = useState(null);

  const [scannerPhone, setScannerPhone] = useState('');
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerInput, setScannerInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // 'MESSAGE' | 'CALL' | 'EMERGENCY'
  const [scannerModalError, setScannerModalError] = useState('');

  // Action status
  const [actionLoading, setActionLoading] = useState(false);
  const [publicAlertSuccessMsg, setPublicAlertSuccessMsg] = useState('');
  const [pushCooldown, setPushCooldown] = useState(0);
  const [callInitiated, setCallInitiated] = useState(false);
  const [callResponse, setCallResponse] = useState(null);
  const [phoneToCall, setPhoneToCall] = useState('');

  useEffect(() => {
    let timer;
    if (pushCooldown > 0) {
      timer = setInterval(() => {
        setPushCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pushCooldown]);

  const fetchQRInfo = async () => {
    try {
      const [qrRes, reasonRes] = await Promise.all([
        axios.get(`${API_BASE}/public/qr/${token}`),
        axios.get(`${API_BASE}/public/scan-reasons?token=${token}`)
      ]);

      if (qrRes.data.success) {
        setQrData(qrRes.data);
        if (qrRes.data.securityCode) {
          setRegForm(prev => ({ ...prev, securityCode: String(qrRes.data.securityCode) }));
        }
      } else {
        setQrData(qrRes.data);
      }

      if (reasonRes.data.success && reasonRes.data.reasons) {
        setScanReasons(reasonRes.data.reasons);
        if (reasonRes.data.reasons.length > 0) {
          setSelectedReason(reasonRes.data.reasons[0].title);
        }
      }
    } catch (err) {
      console.error('Fetch QR info error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQRInfo();
    }
  }, [token]);

  // =============================================================
  // ACTIVATION ACTIONS (UNREGISTERED QR)
  // =============================================================

  // 1. Send Activation OTP
  const handleSendActivationOTP = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = regPhone.trim().replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setRegError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setRegSendingOtp(true);
    setRegError('');

    try {
      const res = await axios.post(`${API_BASE}/public/send-activation-otp`, {
        phone: cleanPhone,
        productId: qrData?.productId,
        token
      });

      if (res.data.success) {
        setIsOtpSent(true);
      } else {
        setRegError(res.data.message || 'Could not send OTP.');
      }
    } catch (err) {
      setRegError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setRegSendingOtp(false);
    }
  };

  // 2. Verify Activation OTP
  const handleVerifyActivationOTP = async (e) => {
    if (e) e.preventDefault();
    if (!regOtp || regOtp.trim().length !== 6) {
      setRegError('Please enter the 6-digit OTP code.');
      return;
    }

    setRegVerifyingOtp(true);
    setRegError('');

    try {
      const res = await axios.post(`${API_BASE}/public/verify-activation-otp`, {
        phone: regPhone.trim().replace(/\D/g, '').slice(-10),
        otp: regOtp.trim()
      });

      if (res.data.success) {
        setIsOtpVerified(true);
        setRegStep(2); // Move to Details Form
      } else {
        setRegError(res.data.message || 'Invalid OTP. Please enter 123456');
      }
    } catch (err) {
      setRegError(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setRegVerifyingOtp(false);
    }
  };

  // 3. Register & Bind Vehicle or Item
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    const isVehicleTag = qrData?.isVehicle !== false;

    if (isVehicleTag) {
      const cleanPlate = regForm.vehicleNumber.trim().toUpperCase().replace(/\s+/g, ' ');
      if (!cleanPlate || cleanPlate.length < 4) {
        setRegError('Please enter a valid vehicle registration plate number.');
        return;
      }
    } else {
      if (!regForm.itemName.trim()) {
        setRegError('Please enter an item / luggage title or name.');
        return;
      }
      if (!regForm.securityCode || regForm.securityCode.trim().length !== 4) {
        setRegError('Please enter the 4-digit Security Tag PIN printed on your physical tag.');
        return;
      }
    }

    if (!regForm.contact1Phone || !regForm.contact2Phone) {
      setRegError('Please provide 2 designated emergency contact mobile numbers.');
      return;
    }

    setRegActivating(true);
    setRegError('');

    try {
      const cleanPhone = regPhone.trim().replace(/\D/g, '').slice(-10);
      const cleanWhatsApp = sameForWhatsApp
        ? cleanPhone
        : (regForm.whatsappNumber.trim().replace(/\D/g, '').slice(-10) || cleanPhone);

      const payload = {
        name: regForm.name || (isVehicleTag ? 'Vehicle Owner' : 'Item Owner'),
        phone: cleanPhone,
        whatsappNumber: cleanWhatsApp,
        email: regForm.email,
        gender: regForm.gender,
        // Vehicle fields
        vehicleNumber: isVehicleTag
          ? regForm.vehicleNumber.trim().toUpperCase().replace(/\s+/g, ' ')
          : `${qrData?.productId || 'ITEM'}-${regForm.securityCode.trim()}`,
        vehicleBrand: isVehicleTag ? (regForm.vehicleBrand || qrData?.qrFor || 'Vehicle') : (regForm.itemType || qrData?.qrFor || 'Luggage'),
        vehicleName: isVehicleTag ? (regForm.vehicleName || 'Standard Vehicle') : (regForm.itemName || `${qrData?.qrFor || 'Item'} Tag`),
        // Non-vehicle fields
        itemName: regForm.itemName.trim() || regForm.vehicleName,
        itemType: regForm.itemType.trim() || regForm.vehicleBrand || qrData?.qrFor || 'Luggage',
        securityCode: regForm.securityCode.trim(),
        emergencyContacts: [
          { name: regForm.contact1Name || 'Emergency Contact 1', number: regForm.contact1Phone },
          { name: regForm.contact2Name || 'Emergency Contact 2', number: regForm.contact2Phone }
        ]
      };

      const res = await axios.post(`${API_BASE}/public/qr/${token}/register`, payload);

      if (res.data.success) {
        setRegSuccess(isVehicleTag ? '🎉 Your Vehicle is Now Shielded with SafeDrive Protection!' : `🎉 Your ${qrData?.qrFor || 'Item'} is Now Shielded with SafeDrive Protection!`);
        setRegStep(3); // Success state

        if (res.data.token && res.data.user) {
          localStorage.setItem('safe_drive_user_token', res.data.token);
          localStorage.setItem('safe_drive_user_data', JSON.stringify(res.data.user));
        }

        // Refresh info
        fetchQRInfo();
      } else {
        setRegError(res.data.message || 'Registration failed.');
      }
    } catch (err) {
      setRegError(err.response?.data?.message || 'Activation failed.');
    } finally {
      setRegActivating(false);
    }
  };

  // 1. Verify Last 4 Digits of Plate OR 4-Digit Security Tag PIN
  const handleVerifyLast4Digits = async (e) => {
    if (e) e.preventDefault();
    const isVehicleTag = qrData?.isVehicle !== false;
    const cleanDigits = last4Input.trim().toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanDigits || cleanDigits.length !== 4) {
      setPlateVerifyError(isVehicleTag ? 'Please enter the last 4 digits of the vehicle plate.' : 'Please enter the 4-digit Security Tag PIN.');
      return;
    }

    setVerifyingPlate(true);
    setPlateVerifyError('');

    try {
      const res = await axios.post(`${API_BASE}/public/qr/${token}/verify-plate`, {
        last4Digits: cleanDigits,
        securityCode: cleanDigits
      });

      if (res.data.success && res.data.verified) {
        setIsPlateVerified(true);
        setVerifiedVehicleData(res.data.vehicle);
      } else {
        setPlateVerifyError(res.data.message || 'Incorrect 4 digits. Please check and retry.');
      }
    } catch (err) {
      setPlateVerifyError(err.response?.data?.message || (isVehicleTag ? 'Incorrect digits. Please check the vehicle number plate.' : 'Incorrect 4-digit Security PIN. Please check the physical tag.'));
    } finally {
      setVerifyingPlate(false);
    }
  };

  const isOtherSelected = selectedReason.toLowerCase().includes('other');

  // Direct Push Notification
  const handleSendPushNotification = async () => {
    if (!selectedReason) {
      setReasonValidationMsg('⚠️ Please select a reason from above.');
      return;
    }
    if (isOtherSelected && !otherText.trim()) {
      setReasonValidationMsg('⚠️ Please type your message in the text box.');
      return;
    }
    setReasonValidationMsg('');
    setActionLoading(true);
    setPublicAlertSuccessMsg('');
    try {
      const cleanScannerMsg = isOtherSelected ? otherText.trim() : selectedReason;
      const res = await axios.post(`${API_BASE}/public/qr/${token}/push-notification`, {
        messageText: cleanScannerMsg,
        reason: cleanScannerMsg
      });
      if (res.data.success) {
        setPublicAlertSuccessMsg('✓ Push Notification & Instant Ringtone Alert sent to vehicle owner!');
        setPushCooldown(30); // Start default 30s countdown on success
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send push notification.';
      alert(errMsg);
      
      // Parse wait time if 429 rate limit hit
      if (err.response?.status === 429) {
        const match = errMsg.match(/wait (\d+) seconds/);
        if (match && match[1]) {
          setPushCooldown(parseInt(match[1], 10));
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  const promptScannerPhoneAndProceed = (actionType) => {
    setPendingAction(actionType);
    setScannerInput(scannerPhone || '');
    setScannerModalError('');
    setShowScannerModal(true);
  };

  const handleConfirmScannerPhone = (e) => {
    if (e) e.preventDefault();
    const clean = scannerInput.trim().replace(/\D/g, '').slice(-10);
    if (!clean || clean.length < 10) {
      setScannerModalError('Please enter a valid 10-digit mobile number');
      return;
    }
    setScannerPhone(clean);
    setShowScannerModal(false);

    if (pendingAction === 'MESSAGE') {
      executeSendMessage(clean);
    } else if (pendingAction === 'CALL') {
      executeCallOwner(clean);
    } else if (pendingAction === 'EMERGENCY') {
      executeEmergencyTrigger(clean);
    }
    setPendingAction(null);
  };

  const handleSendMessage = () => {
    if (!selectedReason) {
      setReasonValidationMsg('⚠️ Please select a reason from above.');
      return;
    }
    if (isOtherSelected && !otherText.trim()) {
      setReasonValidationMsg('⚠️ Please type your message in the text box.');
      return;
    }
    setReasonValidationMsg('');
    promptScannerPhoneAndProceed('MESSAGE');
  };

  const executeSendMessage = async (phone) => {
    setActionLoading(true);
    try {
      const cleanScannerMsg = isOtherSelected ? otherText.trim() : selectedReason;
      const res = await axios.post(`${API_BASE}/public/qr/${token}/message`, {
        messageText: cleanScannerMsg,
        scannerPhone: phone,
        callerPhone: phone,
        reason: cleanScannerMsg
      });
      if (res.data.success && res.data.whatsappUrl) {
        window.open(res.data.whatsappUrl, '_blank');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send WhatsApp alert.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallOwner = () => {
    if (!selectedReason) {
      setReasonValidationMsg('⚠️ Please select a reason from above.');
      return;
    }
    setReasonValidationMsg('');
    promptScannerPhoneAndProceed('CALL');
  };

  const executeCallOwner = async (phone) => {
    setActionLoading(true);
    setPhoneToCall('');
    setCallResponse(null);
    try {
      const res = await axios.post(`${API_BASE}/public/qr/${token}/call`, {
        scannerPhone: phone,
        callerPhone: phone,
        reason: selectedReason
      });
      if (res.data.success) {
        setCallResponse(res.data);
        setPhoneToCall(res.data.targetPhone);
        setCallInitiated(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to initiate call. Quota may be exhausted.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmergencyTrigger = () => {
    promptScannerPhoneAndProceed('EMERGENCY');
  };

  const executeEmergencyTrigger = async (phone) => {
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/public/qr/${token}/emergency`, {
        scannerPhone: phone,
        callerPhone: phone,
        reason: 'Emergency Accident Assistance'
      });
      if (res.data.success) {
        setPublicAlertSuccessMsg('🚨 Emergency SOS alert sent to owner and registered family contacts!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to trigger emergency SOS.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <AppLoader message="Verifying SafeDrive QR Security Tag..." />;
  }

  const isVehicleTag = qrData?.isVehicle !== false;
  const qrForLabel = qrData?.qrFor || (isVehicleTag ? 'Vehicle' : 'Item');

  // =============================================================
  // FLOW A: UNREGISTERED / INACTIVE QR CODE (ACTIVATION FLOW)
  // =============================================================
  if (qrData?.status === 'UNREGISTERED' || ['GENERATED', 'IN STOCK', 'SOLD'].includes(qrData?.status)) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-[#F36F21] selection:text-white">
        
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Brand Header */}
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
            <span className="text-[10px] uppercase font-black tracking-widest text-[#F36F21] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              ✨ Activate Your {qrForLabel} Protection Tag
            </span>
          </div>

          {/* Kit Information Banner */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center shadow-md">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Security Kit ID</span>
              <div className="text-lg font-black tracking-wider text-white font-mono">
                {qrData?.productId || 'NEW KIT'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-[#1E8A38] text-white font-bold px-2.5 py-1 rounded-lg uppercase">
                {qrForLabel} Set
              </span>
            </div>
          </div>

          {regError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold animate-fadeIn">
              {regError}
            </div>
          )}

          {/* STEP 1: MOBILE & OTP VERIFICATION */}
          {regStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Step 1: Verify Registered Mobile</h3>
                <p className="text-xs text-slate-500">Enter the purchase mobile number to verify and claim your tag.</p>
              </div>

              {!isOtpSent ? (
                <form onSubmit={handleSendActivationOTP} className="space-y-3" autoComplete="off">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-xs text-slate-400 font-mono font-bold">+91</span>
                      <input
                        type="tel"
                        autoComplete="off"
                        maxLength={10}
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(-10))}
                        placeholder="9876543210"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={regSendingOtp || regPhone.length !== 10}
                    className="w-full bg-[#F36F21] hover:bg-[#d85810] text-white font-black py-3 rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {regSendingOtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    <span>Send Verification OTP →</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyActivationOTP} className="space-y-3" autoComplete="off">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                    <span className="text-slate-600">OTP sent to: <strong>+91 {regPhone}</strong></span>
                    <button
                      type="button"
                      onClick={() => setIsOtpSent(false)}
                      className="text-[#F36F21] font-bold hover:underline text-[11px]"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit OTP *</label>
                    <input
                      type="text"
                      autoComplete="off"
                      maxLength={6}
                      required
                      value={regOtp}
                      onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-mono font-black tracking-widest text-slate-900 py-2.5 focus:bg-white focus:outline-none focus:border-[#1E8A38]"
                    />
                    <span className="block text-[10px] text-slate-400 text-center mt-1">Demo OTP code is: <strong>123456</strong></span>
                  </div>

                  <button
                    type="submit"
                    disabled={regVerifyingOtp || regOtp.length !== 6}
                    className="w-full bg-[#1E8A38] hover:bg-[#16702c] text-white font-black py-3 rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {regVerifyingOtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Verify & Continue →</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: DETAILS & SAFETY CONTACTS FORM */}
          {regStep === 2 && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4" autoComplete="off">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {isVehicleTag ? 'Step 2: Vehicle & Safety Contacts' : `Step 2: ${qrForLabel} Details & Safety Contacts`}
                </h3>
                <p className="text-xs text-slate-500">
                  {isVehicleTag
                    ? 'Bind your vehicle registration and set emergency alert lines.'
                    : `Configure your ${qrForLabel} item details and emergency contact lines.`}
                </p>
              </div>

              <div className="space-y-3">
                {isVehicleTag ? (
                  <>
                    {/* Vehicle Plate */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Plate / Reg Number *</label>
                      <input
                        type="text"
                        autoComplete="off"
                        required
                        value={regForm.vehicleNumber}
                        onChange={(e) => setRegForm({ ...regForm, vehicleNumber: e.target.value.toUpperCase() })}
                        placeholder="UP 32 AB 1234"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-black text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                      />
                    </div>

                    {/* Brand & Model Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Make *</label>
                        <input
                          type="text"
                          autoComplete="off"
                          required
                          value={regForm.vehicleBrand}
                          onChange={(e) => setRegForm({ ...regForm, vehicleBrand: e.target.value })}
                          placeholder="e.g. Tata / Hyundai / Hero"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Model / Name *</label>
                        <input
                          type="text"
                          autoComplete="off"
                          required
                          value={regForm.vehicleName}
                          onChange={(e) => setRegForm({ ...regForm, vehicleName: e.target.value })}
                          placeholder="e.g. Nexon / Creta / Splendor"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Non-Vehicle: 4-Digit Security Tag PIN */}
                    <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-black text-amber-950 uppercase tracking-wider">
                          🔑 4-Digit Security Tag PIN *
                        </label>
                        {qrData?.securityCode && (
                          <span className="text-[11px] bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded-md font-mono border border-amber-300">
                            PIN: {qrData.securityCode}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Enter the 4-digit security PIN printed directly on your physical tag sticker or assigned to your digital pass.
                      </p>
                      <input
                        type="text"
                        autoComplete="off"
                        maxLength={4}
                        required
                        value={regForm.securityCode}
                        onChange={(e) => setRegForm({ ...regForm, securityCode: e.target.value.replace(/\D/g, '') })}
                        placeholder={qrData?.securityCode || "e.g. 5831"}
                        className="w-full bg-white border-2 border-amber-300 rounded-xl text-center text-xl font-mono font-black tracking-widest text-slate-900 py-2 focus:outline-none focus:border-amber-600 shadow-inner"
                      />
                      {qrData?.securityCode && regForm.securityCode !== qrData.securityCode && (
                        <button
                          type="button"
                          onClick={() => setRegForm({ ...regForm, securityCode: qrData.securityCode })}
                          className="text-[11px] font-bold text-amber-900 underline hover:text-amber-700 block text-center w-full mt-1"
                        >
                          Auto-fill PIN ({qrData.securityCode})
                        </button>
                      )}
                    </div>

                    {/* Non-Vehicle: Item Name & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Item / Tag Title *</label>
                        <input
                          type="text"
                          autoComplete="off"
                          required
                          value={regForm.itemName}
                          onChange={(e) => setRegForm({ ...regForm, itemName: e.target.value })}
                          placeholder="e.g. Blue Safari Trolley Bag"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Item Category / Type *</label>
                        <input
                          type="text"
                          autoComplete="off"
                          required
                          value={regForm.itemType || qrForLabel}
                          onChange={(e) => setRegForm({ ...regForm, itemType: e.target.value })}
                          placeholder="e.g. Luggage / Backpack / Pet"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Owner Name & Gender Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name *</label>
                    <input
                      type="text"
                      autoComplete="off"
                      required
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                    <select
                      value={regForm.gender}
                      onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                    >
                      <option value="Male">👨 Male</option>
                      <option value="Female">👩 Female</option>
                      <option value="Other">⚧ Other</option>
                    </select>
                  </div>
                </div>

                {/* WhatsApp Notification Number Setting */}
                <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3.5 space-y-2.5">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sameForWhatsApp}
                      onChange={(e) => setSameForWhatsApp(e.target.checked)}
                      className="w-4 h-4 text-[#1E8A38] rounded border-emerald-300 focus:ring-[#1E8A38] accent-[#1E8A38] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Use same mobile number (+91 {regPhone}) for WhatsApp alerts
                    </span>
                  </label>

                  {!sameForWhatsApp && (
                    <div className="pt-2 border-t border-emerald-200/70 animate-fadeIn">
                      <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">
                        Dedicated WhatsApp Alert Number *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono font-bold">+91</span>
                        <input
                          type="tel"
                          autoComplete="off"
                          maxLength={10}
                          required={!sameForWhatsApp}
                          value={regForm.whatsappNumber}
                          onChange={(e) => setRegForm({ ...regForm, whatsappNumber: e.target.value.replace(/\D/g, '').slice(-10) })}
                          placeholder="Enter 10-digit WhatsApp number"
                          className="w-full bg-white border border-emerald-300 rounded-xl pl-11 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1E8A38]"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Scanner alerts and messages will be routed to this WhatsApp number.
                      </span>
                    </div>
                  )}
                </div>

                {/* Emergency Contact 1 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="text-[11px] font-black text-[#1E8A38] block">Emergency Contact 1 (Primary) *</span>
                  <input
                    type="text"
                    autoComplete="off"
                    required
                    value={regForm.contact1Name}
                    onChange={(e) => setRegForm({ ...regForm, contact1Name: e.target.value })}
                    placeholder="Name (e.g. Brother / Spouse / Friend)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1.5 text-xs text-slate-400 font-mono font-bold">+91</span>
                    <input
                      type="tel"
                      autoComplete="off"
                      maxLength={10}
                      required
                      value={regForm.contact1Phone}
                      onChange={(e) => setRegForm({ ...regForm, contact1Phone: e.target.value.replace(/\D/g, '').slice(-10) })}
                      placeholder="9876543210"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-3 py-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Emergency Contact 2 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="text-[11px] font-black text-[#F36F21] block">Emergency Contact 2 (Secondary) *</span>
                  <input
                    type="text"
                    autoComplete="off"
                    required
                    value={regForm.contact2Name}
                    onChange={(e) => setRegForm({ ...regForm, contact2Name: e.target.value })}
                    placeholder="Name (e.g. Father / Mother / Colleague)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1.5 text-xs text-slate-400 font-mono font-bold">+91</span>
                    <input
                      type="tel"
                      autoComplete="off"
                      maxLength={10}
                      required
                      value={regForm.contact2Phone}
                      onChange={(e) => setRegForm({ ...regForm, contact2Phone: e.target.value.replace(/\D/g, '').slice(-10) })}
                      placeholder="9876543210"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-3 py-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={regActivating}
                className="w-full bg-[#1E8A38] hover:bg-[#16702c] text-white font-black py-3.5 rounded-2xl text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {regActivating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Activate & Shield {qrForLabel} Now →</span>
              </button>
            </form>
          )}

          {/* STEP 3: ACTIVATION SUCCESS */}
          {regStep === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-emerald-50 text-[#1E8A38] rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">{qrForLabel} Protected & Active!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your QR Tag is now active and permanently bound. Anyone scanning will be able to alert you seamlessly via masked calls and WhatsApp.
              </p>

              <Link
                to="/dashboard"
                className="inline-block bg-[#1E8A38] hover:bg-[#16702c] text-white font-black px-6 py-3 rounded-2xl text-xs shadow-md transition cursor-pointer"
              >
                Go to Owner Dashboard →
              </Link>
            </div>
          )}

        </div>

      </div>
    );
  }

  // =============================================================
  // FLOW B: ACTIVE QR CODE (CITIZEN SCANNER INTERFACE)
  // =============================================================

  // STEP 1 OF CITIZEN SCAN: 4 DIGITS VERIFICATION GATE
  if (!isPlateVerified) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-[#F36F21] selection:text-white">
        
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Brand Header */}
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
            <span className="text-[10px] uppercase font-black tracking-widest text-[#1D56A5] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              🔒 {isVehicleTag ? 'Vehicle Security Verification' : `${qrForLabel} Security Verification`}
            </span>
          </div>

          {/* Masked Badge */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-slate-800 rounded-xl">
                {isVehicleTag ? <Car className="w-6 h-6 text-[#F36F21]" /> : <ShieldCheck className="w-6 h-6 text-[#F36F21]" />}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                  {isVehicleTag ? 'Shielded Vehicle Plate' : `Shielded ${qrForLabel} Tag`}
                </span>
                <div className="text-xl font-black tracking-widest text-white font-mono">
                  {isVehicleTag ? (qrData?.maskedPlate || '••••••••') : (qrData?.productId || 'PROTECTED TAG')}
                </div>
                {(qrData?.itemName || qrData?.vehicleName || qrData?.vehicleBrand) && (
                  <span className="text-[11px] text-emerald-400 font-bold">
                    {qrData.itemName || `${qrData.vehicleBrand || ''} ${qrData.vehicleName || ''}`}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="w-3 h-3 rounded-full bg-[#1E8A38] inline-block animate-ping" />
            </div>
          </div>

          {plateVerifyError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold animate-fadeIn">
              {plateVerifyError}
            </div>
          )}

          {/* 4 Digits Prompt Form */}
          <form onSubmit={handleVerifyLast4Digits} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                {isVehicleTag
                  ? 'Enter Last 4 Digits of Vehicle Plate: *'
                  : 'Enter 4-Digit Security Tag PIN (Printed on Tag): *'}
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                {isVehicleTag
                  ? 'Enter the last 4 characters of the vehicle registration plate (e.g. 9090) to connect with the owner.'
                  : 'Enter the 4-digit security code physically printed on this tag sticker to connect with the owner.'}
              </p>
              <input
                type="text"
                autoComplete="off"
                maxLength={4}
                required
                autoFocus
                value={last4Input}
                onChange={(e) => setLast4Input(e.target.value.toUpperCase().replace(/[^a-zA-Z0-9]/g, ''))}
                placeholder={isVehicleTag ? '9090' : '5831'}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl text-center text-2xl font-mono font-black tracking-widest text-slate-900 py-3 focus:bg-white focus:outline-none focus:border-[#F36F21] transition shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={verifyingPlate || last4Input.length !== 4}
              className="w-full bg-[#F36F21] hover:bg-[#d85810] text-white font-black py-3.5 rounded-2xl text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {verifyingPlate ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>{isVehicleTag ? 'Verify Plate & Connect with Owner →' : 'Verify PIN & Connect with Owner →'}</span>
            </button>
          </form>

          {/* Security Footnote */}
          <div className="text-[10px] text-slate-400 text-center flex items-center justify-center space-x-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1E8A38]" />
            <span>Anti-Spam Verification • Privacy Protection Enabled</span>
          </div>

        </div>

      </div>
    );
  }

  // STEP 2 OF CITIZEN SCAN: FULL UNLOCKED CONTACT SCREEN
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-[#F36F21] selection:text-white">
      
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Brand Header */}
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
          <span className="text-[10px] uppercase font-black tracking-widest text-[#1E8A38] bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200">
            ✓ Verified Secure {isVehicleTag ? 'Vehicle' : (qrForLabel || 'Item')} Connection
          </span>
        </div>

        {/* Verified Badge */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-800 rounded-xl">
              {isVehicleTag ? <Car className="w-5 h-5 text-[#1E8A38]" /> : <ShieldCheck className="w-5 h-5 text-[#1E8A38]" />}
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>{isVehicleTag ? 'Verified Shielded Vehicle' : `Verified Shielded ${qrForLabel}`}</span>
              </span>
              <div className="text-base font-black tracking-wider text-white font-mono">
                {isVehicleTag
                  ? (verifiedVehicleData?.vehicleNumber || qrData?.vehicleNumber || 'PROTECTED VEHICLE')
                  : (verifiedVehicleData?.itemName || qrData?.itemName || `${qrForLabel} Tag`)}
              </div>
              {(verifiedVehicleData?.vehicleBrand || qrData?.vehicleBrand || verifiedVehicleData?.itemType || qrData?.itemType) && (
                <span className="text-[10px] text-slate-300 font-bold">
                  {isVehicleTag
                    ? `${verifiedVehicleData?.vehicleBrand || qrData?.vehicleBrand || ''} ${verifiedVehicleData?.vehicleName || qrData?.vehicleName || ''}`
                    : (verifiedVehicleData?.itemType || qrData?.itemType || qrForLabel)}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E8A38] inline-block animate-ping" />
          </div>
        </div>

        {publicAlertSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-[#1E8A38] text-xs font-bold leading-relaxed animate-fadeIn">
            {publicAlertSuccessMsg}
          </div>
        )}

        {reasonValidationMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold animate-fadeIn">
            {reasonValidationMsg}
          </div>
        )}

        {/* Reason Selector */}
        <div className="space-y-2.5">
          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
            Select Reason for Contacting Owner:
          </label>

          <div className="grid grid-cols-2 gap-2">
            {scanReasons.map((r) => (
              <button
                key={r._id || r.title}
                type="button"
                onClick={() => setSelectedReason(r.title)}
                className={`p-3 rounded-2xl border text-xs font-bold transition text-left cursor-pointer flex items-center space-x-2 ${
                  selectedReason === r.title
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-102'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span className="text-base">{getReasonEmoji(r)}</span>
                <span className="truncate">{r.title}</span>
              </button>
            ))}
          </div>

          {isOtherSelected && (
            <textarea
              rows="2"
              placeholder="Type your message for the vehicle owner here..."
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21] transition mt-2"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          
          {/* Push Notification Button */}
          <button
            type="button"
            onClick={handleSendPushNotification}
            disabled={actionLoading || pushCooldown > 0}
            className={`w-full font-bold py-3.5 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer active:scale-95 disabled:opacity-50 ${
              pushCooldown > 0 ? 'bg-slate-400 text-white' : 'bg-[#F36F21] hover:bg-[#d85810] text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>
              {pushCooldown > 0 
                ? `Wait ${pushCooldown}s to Send Again` 
                : '🔔 Send Instant Push Alert'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {/* Call Owner Button */}
            <button
              type="button"
              onClick={handleCallOwner}
              disabled={actionLoading}
              className="bg-[#1E8A38] hover:bg-[#16702c] text-white font-bold py-3.5 rounded-2xl shadow-md transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Phone className="w-4 h-4" />
              <span>Call Owner</span>
            </button>

            {/* WhatsApp Alert Button */}
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={actionLoading}
              className="bg-[#107c30] hover:bg-[#0c6225] text-white font-bold py-3.5 rounded-2xl shadow-md transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Emergency SOS Button */}
          <button
            type="button"
            onClick={handleEmergencyTrigger}
            disabled={actionLoading}
            className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-black py-3 rounded-2xl transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>🚨 Critical Accident Emergency SOS</span>
          </button>
        </div>

        {/* Call Initiated / Masked Bridge Status */}
        {callInitiated && (
          <div className={`p-4 rounded-2xl text-center space-y-2.5 animate-fadeIn shadow-md border-2 ${
            callResponse?.masked
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300'
              : 'bg-amber-50 border-amber-300'
          }`}>
            <div className="flex items-center justify-center space-x-2 font-black text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${callResponse?.masked ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              <span className={callResponse?.masked ? 'text-emerald-800' : 'text-amber-900'}>
                {callResponse?.masked ? '📞 Masked Call Bridge Connected' : '📞 Call Connecting...'}
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {callResponse?.message || `Exotel is calling your number +91 ${scannerPhone}. Please pick up to connect with the owner.`}
            </p>
            {callResponse?.masked && (
              <div className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 py-1 px-3 rounded-lg inline-block">
                🔒 SafeDrive Privacy Shield Active • Virtual Caller (08040265530)
              </div>
            )}
          </div>
        )}

        {/* Security Footer Note */}
        <div className="text-[10px] text-slate-400 text-center flex items-center justify-center space-x-1 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1E8A38]" />
          <span>SafeDrive Security Masking Enabled • Encrypted Bridge</span>
        </div>

      </div>

      {/* SCANNER PHONE PROMPT MODAL */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">
                {pendingAction === 'CALL' ? '📞 Enter Number to Call Owner' : '💬 Enter Your Contact Number'}
              </h3>
              <button
                onClick={() => setShowScannerModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {pendingAction === 'CALL'
                ? 'Enter your 10-digit mobile number. Our SafeDrive Exotel Bridge will call your phone and connect you securely with the owner.'
                : 'Please enter your 10-digit mobile number so the vehicle owner can identify this contact request.'}
            </p>

            {scannerModalError && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold">
                {scannerModalError}
              </div>
            )}

            <form onSubmit={handleConfirmScannerPhone} className="space-y-3">
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono font-bold">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  autoFocus
                  value={scannerInput}
                  onChange={(e) => setScannerInput(e.target.value.replace(/\D/g, '').slice(-10))}
                  placeholder="9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1E8A38]"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-[#1E8A38] hover:bg-[#16702c] text-white font-black py-3 rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>{pendingAction === 'CALL' ? '📞 Connect Secure Masked Call →' : 'Continue to WhatsApp →'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
