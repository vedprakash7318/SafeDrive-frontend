import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  ArrowRight,
  MapPin,
  Sparkles,
  QrCode,
  Download,
  Eye,
  Edit3,
  Check,
  Save,
  Tag,
  Calendar,
  AlertCircle,
  Share2,
  Printer,
  CreditCard,
  History,
  X,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import SafeDriveQRCode, { downloadQRCodeSVG } from '../components/SafeDriveQRCode';
import { API_BASE } from '../config/api';
import UserNavbar from '../components/UserNavbar';
import AppLoader from '../components/AppLoader';

export default function QRDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem('safe_drive_user_token');
  const authHeader = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  // Edit Mode Toggle
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    whatsappNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact1Name: '',
    contact1Phone: '',
    contact2Name: '',
    contact2Phone: ''
  });

  // Top-up Booster Quota State
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [packages, setPackages] = useState([]);
  const [buyingLoading, setBuyingLoading] = useState(false);

  // Dedicated 2-Step OTP + Payment Renewal State
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewOtp, setRenewOtp] = useState('');
  const [renewPhone, setRenewPhone] = useState('');
  const [sendingRenewOtp, setSendingRenewOtp] = useState(false);
  const [processingRenew, setProcessingRenew] = useState(false);
  const [renewError, setRenewError] = useState('');
  const [renewSuccessMsg, setRenewSuccessMsg] = useState('');

  // Fetch QR Details
  const fetchDetails = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/user/qr/${id}`, authHeader);
      if (res.data.success) {
        setData(res.data);
        const u = res.data.user || {};
        const v = res.data.vehicle || {};
        const ec1 = v.emergencyContacts?.[0] || {};
        const ec2 = v.emergencyContacts?.[1] || {};

        setEditForm({
          name: u.name || '',
          email: u.email || '',
          whatsappNumber: u.whatsappNumber || u.phone || '',
          address: u.address || '',
          city: u.city || '',
          state: u.state || '',
          pincode: u.pincode || '',
          contact1Name: ec1.name || '',
          contact1Phone: ec1.number || '',
          contact2Name: ec2.name || '',
          contact2Phone: ec2.number || ''
        });
      } else {
        setError(res.data.message || 'Could not load QR details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch QR details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Quota Packages
  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API_BASE}/user/packages`, authHeader);
      if (res.data.success) {
        setPackages(res.data.packages || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchDetails();
    fetchPackages();
  }, [id]);

  // Handle Edit Submit (Emergency Contacts + Personal Details)
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!editForm.contact1Phone || !editForm.contact2Phone) {
      setEditError('Please provide 2 valid emergency contact phone numbers.');
      return;
    }

    setSavingEdit(true);
    setEditError('');
    setEditSuccess('');

    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        whatsappNumber: editForm.whatsappNumber,
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        pincode: editForm.pincode,
        emergencyContacts: [
          { name: editForm.contact1Name || 'Emergency Contact 1', number: editForm.contact1Phone },
          { name: editForm.contact2Name || 'Emergency Contact 2', number: editForm.contact2Phone }
        ]
      };

      const res = await axios.put(`${API_BASE}/user/qr/${id}/details`, payload, authHeader);
      if (res.data.success) {
        setEditSuccess('✓ Emergency contacts and profile details updated successfully!');
        setIsEditing(false);
        fetchDetails();
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update details');
    } finally {
      setSavingEdit(false);
    }
  };

  // 1. INITIATE RENEWAL: Send OTP & Check 2-Year Cap
  const handleStartRenewal = async () => {
    const fee = data?.qr?.renewalAmount || 199;
    const now = new Date();
    const remainingDays = data?.qr?.expiryDate ? Math.ceil((new Date(data.qr.expiryDate) - now) / (1000 * 60 * 60 * 24)) : 0;

    // Check Max 2-Year Cap (730 Days)
    if (remainingDays >= 730) {
      alert(`❌ Maximum Renewal Limit Reached: This QR Tag already has full 2-Year protection active (${remainingDays} days remaining). You cannot renew beyond 2 years.`);
      return;
    }

    setSendingRenewOtp(true);
    setRenewError('');
    setRenewOtp('');

    try {
      const res = await axios.post(
        `${API_BASE}/user/subscription/send-otp`,
        { qrId: data.qr._id },
        authHeader
      );

      if (res.data.success) {
        setRenewPhone(res.data.phone || 'registered number');
        setShowRenewModal(true);
      } else {
        alert(res.data.message || 'Could not send OTP');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate renewal OTP. Max limit might be reached.');
    } finally {
      setSendingRenewOtp(false);
    }
  };

  // Helper to load Razorpay
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 2. VERIFY OTP & OPEN PAYMENT GATEWAY -> FINALIZE RENEWAL
  const handleVerifyOtpAndPay = async (e) => {
    e.preventDefault();
    if (!renewOtp || renewOtp.trim().length !== 6) {
      setRenewError('Please enter the 6-digit OTP code sent to your registered mobile.');
      return;
    }

    setProcessingRenew(true);
    setRenewError('');

    try {
      const fee = data?.qr?.renewalAmount || 199;

      // Create Order on Backend
      const orderRes = await axios.post(
        `${API_BASE}/user/subscription/create-order`,
        { qrId: data.qr._id, renewalPrice: fee },
        authHeader
      );

      if (!orderRes.data.success) {
        setRenewError(orderRes.data.message || 'Payment initiation failed.');
        setProcessingRenew(false);
        return;
      }

      const orderData = orderRes.data;

      // Handle Simulated/Test Payment vs Live Razorpay
      if (orderData.isSimulated || !orderData.keyId) {
        // Direct renewal verification with simulated transaction
        const renewRes = await axios.post(
          `${API_BASE}/user/subscription/renew`,
          {
            qrId: data.qr._id,
            otp: renewOtp.trim(),
            paymentMethod: 'ONLINE_PREPAID',
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`
          },
          authHeader
        );

        if (renewRes.data.success) {
          setShowRenewModal(false);
          setRenewSuccessMsg('🎉 ' + renewRes.data.message);
          fetchDetails();
        } else {
          setRenewError(renewRes.data.message || 'Renewal failed.');
        }
        setProcessingRenew(false);
        return;
      }

      // Live Razorpay Gateway
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setRenewError('Razorpay SDK failed to load. Please check your internet connection.');
        setProcessingRenew(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'SafeDrive Security',
        description: `Annual Protection Renewal (1 Year Extension) for ${data.qr.productId}`,
        order_id: orderData.orderId,
        prefill: {
          name: data.user?.name || '',
          email: data.user?.email || '',
          contact: data.user?.phone || ''
        },
        theme: { color: '#1E8A38' },
        handler: async (response) => {
          try {
            const renewRes = await axios.post(
              `${API_BASE}/user/subscription/renew`,
              {
                qrId: data.qr._id,
                otp: renewOtp.trim(),
                paymentMethod: 'RAZORPAY_GATEWAY',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              },
              authHeader
            );

            if (renewRes.data.success) {
              setShowRenewModal(false);
              setRenewSuccessMsg('🎉 ' + renewRes.data.message);
              fetchDetails();
            } else {
              setRenewError(renewRes.data.message || 'Payment processed but renewal failed.');
            }
          } catch (err) {
            setRenewError(err.response?.data?.message || 'Verification error after payment.');
          } finally {
            setProcessingRenew(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingRenew(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setRenewError(err.response?.data?.message || 'Could not complete renewal transaction.');
      setProcessingRenew(false);
    }
  };

  // Handle Buy Booster Quota
  const handleBuyPackage = async (pkg) => {
    setBuyingLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/user/quota/buy`,
        { qrId: data.qr._id, packageId: pkg._id },
        authHeader
      );
      if (res.data.success) {
        alert(`🎉 ${res.data.message}`);
        setShowBuyModal(false);
        fetchDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Purchase failed');
    } finally {
      setBuyingLoading(false);
    }
  };

  if (loading) {
    return <AppLoader message="Loading complete QR kit details..." />;
  }

  if (error || !data || !data.qr) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">QR Details Not Found</h2>
          <p className="text-sm text-slate-500">{error || 'This QR Kit was not found in your account.'}</p>
          <Link
            to="/dashboard"
            className="inline-block bg-[#1E8A38] hover:bg-[#16702c] text-white font-bold px-6 py-3 rounded-xl text-sm transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { qr, category, copies, wallet, vehicle, user } = data;
  const isActive = qr.status === 'ACTIVE';
  const isDigital = qr.qrType === 'DIGITAL';
  const renewalPrice = qr.renewalAmount || 199;

  const now = new Date();
  const remainingDays = qr.expiryDate ? Math.ceil((new Date(qr.expiryDate) - now) / (1000 * 60 * 60 * 24)) : 365;
  const isMax2YearCapped = remainingDays >= 730;

  const callsLeft = wallet?.callBalance || 0;
  const totalCalls = wallet?.totalCalls || Math.max(callsLeft, 10);
  const callsUsed = wallet?.totalCallsUsed || Math.max(0, totalCalls - callsLeft);
  const callsPct = Math.min(100, Math.round((callsLeft / (totalCalls || 1)) * 100));

  const msgsLeft = wallet?.messageBalance || 0;
  const totalMsgs = wallet?.totalMessages || Math.max(msgsLeft, 20);
  const msgsUsed = wallet?.totalMessagesUsed || Math.max(0, totalMsgs - msgsLeft);
  const msgsPct = Math.min(100, Math.round((msgsLeft / (totalMsgs || 1)) * 100));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#F36F21] selection:text-white">
      <UserNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs transition"
          >
            <span>← Back to Protected Vehicles</span>
          </Link>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-slate-400">Kit ID:</span>
            <span className="text-xs font-mono font-black text-[#F36F21] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
              {qr.productId}
            </span>
          </div>
        </div>

        {/* 1. TOP STATUS HERO HEADER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-2xl ${
                isActive ? 'bg-emerald-50 text-[#1E8A38] border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {qr.isVehicle === false
                      ? (vehicle?.itemName || vehicle?.vehicleName || qr.productId)
                      : (vehicle?.vehicleNumber || qr.productId)}
                  </h1>
                  <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border ${
                    isActive ? 'bg-emerald-50 text-[#1E8A38] border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {isActive ? `● Active (${remainingDays}d left)` : '⏸️ Paused'}
                  </span>
                </div>

                {qr.securityCode && (
                  <div className="inline-block mt-1 bg-amber-100 text-amber-950 border border-amber-300 font-mono font-black text-xs px-2.5 py-0.5 rounded-lg">
                    🔑 TAG PIN: <span className="tracking-widest">{qr.securityCode}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {qr.isVehicle === false
                      ? (vehicle?.itemType || category || 'Item')
                      : `${vehicle?.vehicleBrand || category} ${vehicle?.vehicleName || ''}`}
                  </span>
                  <span>•</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    isDigital ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-[#1E8A38]'
                  }`}>
                    {isDigital ? 'DIGITAL PASS' : 'WEATHERPROOF VINYL KIT'}
                  </span>
                  <span>•</span>
                  <span className="font-mono">{copies.length} QR Sticker{copies.length > 1 ? 's' : ''} Linked</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleStartRenewal}
                disabled={sendingRenewOtp || isMax2YearCapped}
                className={`text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-50 ${
                  isMax2YearCapped ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1E8A38] hover:bg-[#16702c]'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sendingRenewOtp ? 'animate-spin' : ''}`} />
                <span>{isMax2YearCapped ? 'Max 2-Yr Active' : `Renew +1 Year (₹${renewalPrice})`}</span>
              </button>

              <button
                onClick={() => setShowBuyModal(true)}
                className="bg-[#F36F21] hover:bg-[#d85810] text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buy Quota Booster</span>
              </button>
            </div>
          </div>

          {renewSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-[#1E8A38] text-xs font-bold animate-fadeIn">
              {renewSuccessMsg}
            </div>
          )}

          {/* Sibling Copies Info Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-[#1E8A38] shrink-0" />
              <span>
                <strong>Shared Kit Protection:</strong> All {copies.length} stickers share identical masked call routing and quota balance.
              </span>
            </div>
            <div className="font-mono font-bold text-[#F36F21]">
              {copies.map(c => c.copyCode).join(' • ')}
            </div>
          </div>
        </div>

        {/* 2-COLUMN BALANCED WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: QR STICKERS PREVIEW, LIVE QUOTA BALANCES & DEDICATED RENEWAL CARD (4 COLS) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* QR Sticker Cards */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-[#F36F21]" />
                <span>QR Sticker Codes ({copies.length})</span>
              </h2>

              <div className="space-y-4">
                {copies.map((copy) => (
                  <div
                    key={copy._id}
                    className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col items-center text-center space-y-4 shadow-sm hover:border-[#F36F21] transition"
                  >
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
                      <SafeDriveQRCode
                        value={`${window.location.origin}/q/${copy.publicToken}`}
                        size={150}
                        id={`qr-svg-${copy._id}`}
                      />
                    </div>

                    <div>
                      <span className="text-sm font-mono font-black text-slate-900 block">{copy.copyCode}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Token: {copy.publicToken.slice(0, 10)}...</span>
                    </div>

                    <div className="flex space-x-2 w-full pt-1">
                      <Link
                        to={`/q/${copy.publicToken}`}
                        target="_blank"
                        className="w-1/2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold py-2.5 rounded-xl border border-slate-200 flex items-center justify-center space-x-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#F36F21]" />
                        <span>Test Scan</span>
                      </Link>

                      <button
                        onClick={() => downloadQRCodeSVG(`qr-svg-${copy._id}`, `${copy.copyCode}-QR.png`)}
                        className="w-1/2 bg-[#1E8A38] hover:bg-[#16702c] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LIVE QUOTA BALANCES (SHOWING TOTAL, LEFT & USED) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Live Quota Balances
                </h3>
                <button
                  onClick={() => setShowBuyModal(true)}
                  className="text-xs font-bold text-[#1E8A38] hover:underline"
                >
                  + Add Booster
                </button>
              </div>

              {/* 1. Voice Calls */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-[#1E8A38]" />
                    <span className="text-xs font-black text-[#1E8A38] uppercase">Voice Calls</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">
                    <strong className="text-slate-900 text-sm">{callsLeft}</strong> Left / {totalCalls} Total
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#1E8A38] h-full rounded-full transition-all duration-500"
                    style={{ width: `${callsPct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold pt-0.5">
                  <span>Used: {callsUsed} calls</span>
                  <span className="text-[#1E8A38]">{callsPct}% available</span>
                </div>
              </div>

              {/* 2. SMS & Push Alerts */}
              <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-[#F36F21]" />
                    <span className="text-xs font-black text-[#F36F21] uppercase">SMS & Push Alerts</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">
                    <strong className="text-slate-900 text-sm">{msgsLeft}</strong> Left / {totalMsgs} Total
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-orange-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#F36F21] h-full rounded-full transition-all duration-500"
                    style={{ width: `${msgsPct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold pt-0.5">
                  <span>Used: {msgsUsed} alerts</span>
                  <span className="text-[#F36F21]">{msgsPct}% available</span>
                </div>
              </div>

            </div>

            {/* DEDICATED ANNUAL RENEWAL & VALIDITY CARD (MAX 2-YEAR CAP) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-50 text-[#1E8A38] rounded-xl border border-emerald-200">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Annual Protection Plan</h3>
                    <p className="text-[11px] text-slate-400">Max 2 Years (730 Days) Validity</p>
                  </div>
                </div>

                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  remainingDays > 30 ? 'bg-emerald-50 text-[#1E8A38] border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {remainingDays > 0 ? `${remainingDays} Days Left` : 'Expired'}
                </span>
              </div>

              {/* Expiry Details */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Current Expiry Date</span>
                <div className="text-xs font-black text-slate-900 font-mono">
                  {qr.expiryDate ? new Date(qr.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '365 Days from Activation'}
                </div>
              </div>

              {/* Inclusions */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#1E8A38] shrink-0" />
                  <span>+365 Days Extended Protection (Capped at 2 Yrs)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#1E8A38] shrink-0" />
                  <span>+10 Bonus Masked Voice Calls</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#1E8A38] shrink-0" />
                  <span>+20 Bonus Emergency SMS Alerts</span>
                </div>
              </div>

              {/* Price & Renew Button */}
              <div className="pt-2">
                {isMax2YearCapped ? (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-center text-xs font-bold text-slate-600">
                    🔒 Max 2-Year Protection Active ({remainingDays} Days)
                  </div>
                ) : (
                  <button
                    onClick={handleStartRenewal}
                    disabled={sendingRenewOtp}
                    className="w-full bg-[#1E8A38] hover:bg-[#16702c] text-white font-black py-3 rounded-2xl text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${sendingRenewOtp ? 'animate-spin' : ''}`} />
                    <span>Renew for ₹{renewalPrice} / Year (OTP Protected) →</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LOCKED VEHICLE SPECS + VIEW/EDIT DETAILS (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. LOCKED VEHICLE SPECIFICATIONS (READ-ONLY) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-orange-50 text-[#F36F21] rounded-2xl border border-orange-100">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Vehicle Specifications</h2>
                    <p className="text-xs text-slate-500">Asset permanently linked to this security tag</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Locked & Protected</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Plate Number</span>
                  <div className="text-base font-mono font-black text-[#F36F21] mt-0.5">
                    {vehicle?.vehicleNumber || 'NOT BOUND'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Brand / Make</span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {vehicle?.vehicleBrand || category}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Model Name</span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {vehicle?.vehicleName || 'Standard Vehicle'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Vehicle plate number is permanently bound to this physical QR kit for anti-theft and scam prevention.</span>
              </div>
            </div>

            {/* 2. EMERGENCY CONTACTS & PERSONAL DETAILS (WITH EDIT BUTTON TRIGGER) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-[#1E8A38]" />
                    <span>Emergency Contacts & Personal Details</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    SOS alert recipients and WhatsApp notifications line.
                  </p>
                </div>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setEditSuccess('');
                      setEditError('');
                    }}
                    className="bg-[#1E8A38] hover:bg-[#16702c] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>✏️ Edit Details</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditError('');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              {editSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-[#1E8A38] text-xs font-bold flex items-center space-x-2 animate-fadeIn">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{editSuccess}</span>
                </div>
              )}

              {editError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold animate-fadeIn">
                  {editError}
                </div>
              )}

              {/* VIEW MODE */}
              {!isEditing ? (
                <div className="space-y-6">
                  
                  {/* Emergency Contacts Summary */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Designated Emergency Contacts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                        <div className="text-[10px] font-black text-[#1E8A38] uppercase">Emergency Contact 1 (Primary)</div>
                        <div className="text-sm font-black text-slate-900">{editForm.contact1Name || 'Contact 1'}</div>
                        <div className="text-xs font-mono font-bold text-slate-700">+91 {editForm.contact1Phone || 'Not set'}</div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                        <div className="text-[10px] font-black text-[#F36F21] uppercase">Emergency Contact 2 (Secondary)</div>
                        <div className="text-sm font-black text-slate-900">{editForm.contact2Name || 'Contact 2'}</div>
                        <div className="text-xs font-mono font-bold text-slate-700">+91 {editForm.contact2Phone || 'Not set'}</div>
                      </div>

                    </div>
                  </div>

                  {/* Personal Details Summary */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Owner & Address Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Owner Name</span>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">{editForm.name || 'Owner'}</div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Email Address</span>
                        <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">{editForm.email || 'None'}</div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">WhatsApp Line</span>
                        <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">+91 {editForm.whatsappNumber || 'None'}</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Registered Address</span>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {editForm.address ? `${editForm.address}, ${editForm.city || ''} ${editForm.pincode || ''}` : 'No street address specified.'}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* EDIT FORM MODE */
                <form onSubmit={handleSaveDetails} className="space-y-6">
                  
                  {/* Emergency Contacts Inputs */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#F36F21]" />
                      <span>1. Designated Emergency Contacts</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Emergency Contact 1 */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                        <div className="flex items-center space-x-1.5 text-xs font-black text-[#1E8A38]">
                          <Phone className="w-3.5 h-3.5" />
                          <span>Emergency Contact 1 (Primary) *</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={editForm.contact1Name}
                          onChange={(e) => setEditForm({ ...editForm, contact1Name: e.target.value })}
                          placeholder="Contact Name"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono font-bold">+91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            value={editForm.contact1Phone}
                            onChange={(e) => setEditForm({ ...editForm, contact1Phone: e.target.value.replace(/\D/g, '').slice(-10) })}
                            placeholder="9876543210"
                            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-3 py-2 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      {/* Emergency Contact 2 */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                        <div className="flex items-center space-x-1.5 text-xs font-black text-[#F36F21]">
                          <Phone className="w-3.5 h-3.5" />
                          <span>Emergency Contact 2 (Secondary) *</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={editForm.contact2Name}
                          onChange={(e) => setEditForm({ ...editForm, contact2Name: e.target.value })}
                          placeholder="Contact Name"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono font-bold">+91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            value={editForm.contact2Phone}
                            onChange={(e) => setEditForm({ ...editForm, contact2Phone: e.target.value.replace(/\D/g, '').slice(-10) })}
                            placeholder="9876543210"
                            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-3 py-2 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Personal Contact Details Inputs */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-[#1E8A38]" />
                      <span>2. Owner Personal & WhatsApp Notification Details</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Rahul Sharma"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          placeholder="rahul@example.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Notification Line</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">+91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={editForm.whatsappNumber}
                            onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value.replace(/\D/g, '').slice(-10) })}
                            placeholder="9876543210"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                        <input
                          type="text"
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          placeholder="House No, Street, Area"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                        <input
                          type="text"
                          value={editForm.city}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          placeholder="Lucknow"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={editForm.pincode}
                          onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value.replace(/\D/g, '') })}
                          placeholder="226001"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-[#F36F21]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-2xl text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="bg-[#1E8A38] hover:bg-[#16702c] text-white font-black px-8 py-3 rounded-2xl shadow-md text-xs transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      {savingEdit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Changes →</span>
                    </button>
                  </div>

                </form>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* 2-STEP OTP & PAYMENT RENEWAL MODAL */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-[#1E8A38] rounded-xl border border-emerald-200">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Verify Renewal OTP</h3>
                  <p className="text-xs text-slate-500">Security verification for {qr.productId}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRenewModal(false);
                  setRenewError('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* OTP Instructions */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <p className="text-slate-700 leading-relaxed">
                A 6-digit verification OTP was sent to your registered mobile number:
                <strong className="block text-sm text-slate-900 font-mono mt-0.5">+91 {renewPhone}</strong>
              </p>
              <div className="flex items-center space-x-1.5 text-[11px] text-[#1E8A38] font-bold pt-1">
                <span>Demo Test OTP:</span>
                <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-[#1E8A38]">123456</span>
              </div>
            </div>

            {renewError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold animate-fadeIn">
                {renewError}
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndPay} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1.5 tracking-wider">
                  Enter 6-Digit OTP Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={renewOtp}
                  onChange={(e) => setRenewOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-center text-2xl font-mono font-black tracking-widest text-slate-900 py-3 focus:bg-white focus:outline-none focus:border-[#1E8A38]"
                />
              </div>

              {/* Renewal Cost & Inclusions Strip */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-black text-slate-900 block">+1 Year Plan (365 Days)</span>
                  <span className="text-[11px] text-slate-500">+10 Bonus Calls • +20 SMS</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-[#1E8A38]">₹{renewalPrice}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processingRenew || renewOtp.length !== 6}
                className="w-full bg-[#1E8A38] hover:bg-[#16702c] text-white font-black py-3.5 rounded-2xl text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {processingRenew ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying OTP & Opening Gateway...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Verify & Pay ₹{renewalPrice} →</span>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* BUY BOOSTER QUOTA MODAL */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900">Add Quota Booster</h3>
                <p className="text-xs text-slate-500">Instant top-up for {qr.productId}</p>
              </div>
              <button
                onClick={() => setShowBuyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {packages.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                  Standard boosters: ₹49 (10 Calls), ₹99 (25 Calls + 50 SMS).
                </div>
              ) : (
                packages.map((pkg) => (
                  <div
                    key={pkg._id}
                    className="p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#1E8A38] rounded-2xl flex justify-between items-center transition shadow-2xs"
                  >
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{pkg.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        +{pkg.callBalance || pkg.calls} Calls • +{pkg.messageBalance || pkg.messages} SMS
                      </p>
                    </div>
                    <button
                      onClick={() => handleBuyPackage(pkg)}
                      disabled={buyingLoading}
                      className="bg-[#1E8A38] hover:bg-[#16702c] text-white font-black px-4 py-2 rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      Buy for ₹{pkg.price}
                    </button>
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
