import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Phone,
  MessageSquare,
  Car,
  Clock,
  Plus,
  RefreshCw,
  Zap,
  ShoppingBag,
  Package,
  Printer,
  Download,
  Eye,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { API_BASE } from '../config/api';
import { requestFcmToken, setupOnMessageListener, playNotificationSound } from '../config/firebase';
import SafeDriveQRCode, { downloadQRCodeSVG } from '../components/SafeDriveQRCode';
import SafeDrivePhysicalSticker from '../components/SafeDrivePhysicalSticker';
import UserNavbar from '../components/UserNavbar';
import AppLoader from '../components/AppLoader';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('safe_drive_user_token');
  const storedUser = JSON.parse(localStorage.getItem('safe_drive_user_data') || '{}');

  const [dashData, setDashData] = useState(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [packages, setPackages] = useState([]);
  const [buyingPackage, setBuyingPackage] = useState(null);
  const [buyLoading, setBuyLoading] = useState(false);

  // Renewal state
  const [renewingQR, setRenewingQR] = useState(null);
  const [renewing, setRenewing] = useState(false);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchDashboard = async () => {
    if (!token) return;
    setLoadingDash(true);
    try {
      const res = await axios.get(`${API_BASE}/user/dashboard`, authHeader);
      if (res.data.success) {
        setDashData(res.data);
        const activeCount = (res.data.qrs || []).filter((q) => q.status === 'ACTIVE').length;
        if (activeCount === 0) {
          navigate('/orders');
        }
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoadingDash(false);
    }
  };

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
    if (!token) {
      navigate('/login');
      return;
    }

    fetchDashboard();
    fetchPackages();

    // Register FCM multi-device token
    requestFcmToken().then((fcmToken) => {
      if (fcmToken) {
        axios.post(`${API_BASE}/user/fcm-token`, { fcmToken }, authHeader)
          .catch((e) => console.log('FCM token warning:', e));
      }
    });

    const unsubscribeFCM = setupOnMessageListener(() => {
      playNotificationSound();
      fetchDashboard();
    });

    return () => {
      if (typeof unsubscribeFCM === 'function') unsubscribeFCM();
    };
  }, [token, navigate]);

  // Group active QRs by unique Product Kit
  const activeKitsMap = new Map();
  if (dashData?.qrs) {
    for (const qr of dashData.qrs.filter((q) => q.status === 'ACTIVE')) {
      const kitKey = qr.productId || qr._id;
      if (!activeKitsMap.has(kitKey)) {
        activeKitsMap.set(kitKey, {
          productId: qr.productId,
          vehicleNumber: qr.vehicleId?.vehicleNumber || qr.qrFor || 'Vehicle',
          vehicleBrand: qr.vehicleId?.brand || '',
          copies: [qr],
          qrFor: qr.qrFor || 'Car',
          createdAt: qr.createdAt,
          renewalAmount: qr.renewalAmount || 199
        });
      } else {
        activeKitsMap.get(kitKey).copies.push(qr);
      }
    }
  }
  const activeKitsList = Array.from(activeKitsMap.values());

  const handleBuyBooster = async (pkg) => {
    setBuyingPackage(pkg);
    setBuyLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/user/quota/create-order`,
        { packageId: pkg._id },
        authHeader
      );
      if (res.data.success) {
        alert(`Order created for ₹${pkg.price}. Payment gateway connected!`);
        setShowBuyModal(false);
        fetchDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate booster payment.');
    } finally {
      setBuyLoading(false);
    }
  };

  if (loadingDash) {
    return <AppLoader message="Loading owner dashboard & active tags..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#F36F21] selection:text-white">
      <UserNavbar user={dashData?.user || storedUser} activeTagsCount={activeKitsList.length} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-[#1E8A38] text-white rounded-2xl flex items-center justify-center font-black shadow-md shadow-[#1E8A38]/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">{dashData?.user?.name || 'Owner Dashboard'}</h1>
              <p className="text-xs text-slate-500 font-mono">+91 {dashData?.user?.phone} • {activeKitsList.length} Active Tags</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBuyModal(true)}
              className="bg-[#F36F21] hover:bg-[#d85810] text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>+ Add Quota Booster</span>
            </button>
            <Link
              to="/store"
              className="bg-[#1E8A38] hover:bg-[#16702c] text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition flex items-center space-x-1.5 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buy Kit</span>
            </Link>
          </div>
        </div>

        {/* Quota Wallet Balances */}
        {dashData && activeKitsList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Voice Call Quota Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs uppercase font-black text-[#1E8A38] tracking-wider">Voice Call Quota</span>
                  <div className="text-4xl font-black text-slate-900 mt-1">
                    {dashData.summary?.totalCallsRemaining || 0}{' '}
                    <span className="text-sm font-normal text-slate-400">Calls left</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 text-[#1E8A38] rounded-2xl border border-emerald-100">
                  <Phone className="w-6 h-6" />
                </div>
              </div>
              <div className="text-xs text-slate-500 mb-4">
                Total Used: <span className="font-bold text-slate-800">{dashData.summary?.totalCallsUsed || 0} calls</span>
              </div>
              <button
                onClick={() => setShowBuyModal(true)}
                className="w-full bg-[#1E8A38] hover:bg-[#16702c] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer active:scale-95"
              >
                + Buy Voice Call Booster
              </button>
            </div>

            {/* Message / WhatsApp Quota Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs uppercase font-black text-[#F36F21] tracking-wider">Message & Push Quota</span>
                  <div className="text-4xl font-black text-slate-900 mt-1">
                    {dashData.summary?.totalMessagesRemaining || 0}{' '}
                    <span className="text-sm font-normal text-slate-400">Msgs left</span>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 text-[#F36F21] rounded-2xl border border-orange-100">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>
              <div className="text-xs text-slate-500 mb-4">
                Total Used: <span className="font-bold text-slate-800">{dashData.summary?.totalMessagesUsed || 0} msgs</span>
              </div>
              <button
                onClick={() => setShowBuyModal(true)}
                className="w-full bg-[#F36F21] hover:bg-[#d85810] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer active:scale-95"
              >
                + Buy Message Booster
              </button>
            </div>

          </div>
        )}

        {/* Active QR Safety Kits */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-900">
              Active Protected Vehicles ({activeKitsList.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeKitsList.map((kit) => (
              <div
                key={kit.productId}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                      {kit.qrFor === 'Bike' ? '🏍️' : kit.qrFor === 'Truck' ? '🚚' : '🚗'}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900">{kit.vehicleNumber}</h3>
                      <p className="text-xs text-slate-500 font-bold">{kit.vehicleBrand || kit.qrFor} Protection Kit</p>
                    </div>
                  </div>

                  <span className="bg-emerald-50 text-[#1E8A38] border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                    Active & Shielded
                  </span>
                </div>

                {/* Copies / QR Codes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {kit.copies.map((qr) => (
                    <div
                      key={qr._id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col items-center text-center space-y-2"
                    >
                      <SafeDriveQRCode
                        value={`${window.location.origin}/q/${qr.publicToken}`}
                        size={90}
                        id={`qr-svg-${qr._id}`}
                      />
                      <span className="text-[11px] font-mono font-black text-slate-800">{qr.copyCode}</span>

                      <div className="flex space-x-1.5 w-full pt-1">
                        <Link
                          to={`/q/${qr.publicToken}`}
                          target="_blank"
                          className="w-1/2 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold py-1.5 rounded-lg border border-slate-200 flex items-center justify-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Test</span>
                        </Link>
                        <button
                          onClick={() => downloadQRCodeSVG(`qr-svg-${qr._id}`, `${qr.copyCode}-QR.png`)}
                          className="w-1/2 bg-[#1E8A38] hover:bg-[#16702c] text-white text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Direct View & Edit Details Button */}
                <div className="pt-2">
                  <Link
                    to={`/qr-details/${kit.productId || kit.copies[0]?._id}`}
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#F36F21]" />
                    <span>👁️ View & Manage Full Tag Details →</span>
                  </Link>
                </div>

              </div>
            ))}
          </div>
        </div>

      </main>

      {/* BUY QUOTA BOOSTER MODAL */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900">Add Quota Booster</h3>
                <p className="text-xs text-slate-500">Top-up your voice call & instant notification quotas</p>
              </div>
              <button
                onClick={() => setShowBuyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {(packages.length > 0 ? packages : [
                { _id: '1', name: 'Starter Call Pack', price: 99, callQuota: 50, messageQuota: 50 },
                { _id: '2', name: 'Pro Protection Booster', price: 199, callQuota: 150, messageQuota: 150 },
                { _id: '3', name: 'Annual Unlimited Shield', price: 399, callQuota: 500, messageQuota: 500 }
              ]).map((pkg) => (
                <div
                  key={pkg._id}
                  className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#1E8A38] p-4 rounded-2xl transition flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-black text-sm text-slate-900">{pkg.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📞 {pkg.callQuota} Calls • 💬 {pkg.messageQuota} WhatsApp Alerts
                    </p>
                  </div>

                  <button
                    onClick={() => handleBuyBooster(pkg)}
                    disabled={buyLoading}
                    className="bg-[#1E8A38] hover:bg-[#16702c] text-white font-black px-4 py-2 rounded-xl text-xs shadow-sm transition active:scale-95"
                  >
                    Buy ₹{pkg.price}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
