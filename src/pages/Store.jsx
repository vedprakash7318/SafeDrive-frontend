import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CheckoutModal from '../components/CheckoutModal';
import {
  ShieldCheck,
  QrCode,
  Check,
  Star,
  Zap,
  Phone,
  MessageSquare,
  Lock,
  ArrowRight,
  RefreshCw,
  Car,
  Layers,
} from 'lucide-react';
import { API_BASE } from '../config/api';

export default function Store() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Auth State in Store
  const [token, setToken] = useState(localStorage.getItem('safe_drive_user_token') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('safe_drive_user_data') || 'null');
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('safe_drive_user_token');
    localStorage.removeItem('safe_drive_user_data');
    setToken('');
    setUser(null);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/purchase/products`);
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Error fetching store products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
      {/* TOP NAVBAR */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1D56A5] text-white flex items-center justify-center font-black shadow-md shadow-[#1D56A5]/25">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-black text-lg text-slate-900 tracking-tight">SAFE DRIVE</span>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              to="/store"
              className="text-xs font-bold text-[#1D56A5] bg-[#E9DFEE]/70 px-3.5 py-2 rounded-xl transition"
            >
              🛒 Store
            </Link>

            {token ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1.5 bg-[#1D56A5] hover:bg-[#164382] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-[#1D56A5]/20 transition"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-2 rounded-xl transition"
                  title="Logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1.5 bg-[#1D56A5] hover:bg-[#164382] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-[#1D56A5]/20 transition"
              >
                <span>🔑 Login / Portal</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-b from-[#1D56A5] to-[#164382] text-white pt-10 pb-20 px-4 text-center relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#E94E1A]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-blue-100 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#E94E1A]" />
            <span>Safe Drive Official Store</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Protect Your Vehicle with <br className="hidden sm:inline" />
            <span className="text-[#E94E1A]">Smart QR Safety Kits</span>
          </h1>

          <p className="text-sm md:text-base text-blue-100 max-w-xl mx-auto">
            Choose your safety kit. Instant masked calling, WhatsApp direct alerts, plate verification security & 1-year free cloud quota included.
          </p>
        </div>
      </section>

      {/* 2. PRODUCT CARDS SECTION */}
      <section className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xl text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#1D56A5] animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading store products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xl text-center space-y-3 max-w-md mx-auto">
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No Products Available</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              New vehicle safety kits are being added. Please check back shortly or create a product in the Admin Panel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((p, idx) => {
              const isPopular = idx === 0; // First item is highlighted popular
              return (
                <div
                  key={p._id}
                  className={`bg-white rounded-3xl p-7 border transition-all duration-300 flex flex-col justify-between shadow-lg relative ${
                    isPopular
                      ? 'border-2 border-[#1D56A5] shadow-[#1D56A5]/15 scale-[1.02]'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xl'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#1D56A5] to-[#E94E1A] text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md">
                      ⭐ Most Popular Kit
                    </div>
                  )}

                  <div>
                    {/* Product Image (if uploaded) */}
                    {p.imageUrl && (
                      <div className="w-full h-44 rounded-2xl overflow-hidden mb-4 border border-slate-100 bg-slate-50">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover hover:scale-105 transition duration-500"
                        />
                      </div>
                    )}

                    {/* Product Type Badges */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                            p.qrType === 'DIGITAL'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {p.qrType === 'DIGITAL' ? '💻 DIGITAL PASS' : '📦 PHYSICAL KIT'}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{p.title || p.name}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#1D56A5] flex-shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                      {p.description || `High-grade safety kit with cloud masked calling and instant emergency protection.`}
                    </p>

                    {/* Price & Discount */}
                    {(() => {
                      const mrp = p.originalPrice || (p.price + (p.discount || 0));
                      const hasDiscount = mrp > p.price;
                      const discountVal = hasDiscount ? (p.discount || (mrp - p.price)) : 0;
                      const discountPct = hasDiscount ? Math.round((discountVal / mrp) * 100) : 0;

                      return (
                        <div className="mb-4 pb-4 border-b border-slate-100">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-black text-slate-900">₹{p.price}</span>
                            {hasDiscount && (
                              <span className="text-sm text-slate-400 line-through font-mono">₹{mrp}</span>
                            )}
                            {hasDiscount && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                {discountPct}% OFF
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-1">
                            Annual Renewal: <strong className="text-slate-900">₹{p.renewalAmount || 199}/year</strong>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Included Quota Highlights */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center mb-6">
                      <div>
                        <div className="text-xs font-black text-emerald-700">📞 {p.initialCalls || 0}</div>
                        <div className="text-[10px] text-slate-400">Free Calls</div>
                      </div>
                      <div className="border-x border-slate-200">
                        <div className="text-xs font-black text-blue-700">💬 {p.initialMessages || 0}</div>
                        <div className="text-[10px] text-slate-400">Free SMS</div>
                      </div>
                      <div>
                        <div className="text-xs font-black text-[#1D56A5]">⏱️ {p.validityDays || 365}d</div>
                        <div className="text-[10px] text-slate-400">Validity</div>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 mb-6">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Features Included:
                      </div>
                      {(p.features && p.features.length > 0 ? p.features : [
                        p.qrType === 'DIGITAL' ? 'Instant High-Res Digital E-QR' : 'Reflective UV Weatherproof Stickers',
                        'Instant Masked Calling to Owner',
                        'Anti-Harassment Plate Verification',
                        '1 Year Cloud Activation Included'
                      ]).map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center space-x-2 text-xs text-slate-700">
                          <div className="w-4 h-4 rounded-full bg-emerald-50 text-[#259A3A] flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buy Now Button */}
                  <button
                    onClick={() => setSelectedProduct(p)}
                    className={`w-full font-bold py-3.5 rounded-2xl text-sm transition flex items-center justify-center space-x-2 shadow-md ${
                      isPopular
                        ? 'bg-[#1D56A5] hover:bg-[#164382] text-white shadow-[#1D56A5]/25'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{p.qrType === 'DIGITAL' ? 'Buy & Download Instantly' : 'Order Physical Delivery'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. TRUST FEATURES STRIP */}
      <section className="max-w-5xl mx-auto px-4 mt-16">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#259A3A] flex items-center justify-center mx-auto border border-emerald-100">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Zero Mobile Spam</h4>
            <p className="text-xs text-slate-500">Your phone number is never exposed to public QR scanners.</p>
          </div>

          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1D56A5] flex items-center justify-center mx-auto border border-blue-100">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Instant Activation</h4>
            <p className="text-xs text-slate-500">Buy once, receive stickers, and link your vehicle with 1 tap.</p>
          </div>

          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#E94E1A] flex items-center justify-center mx-auto border border-orange-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Live GPS Emergencies</h4>
            <p className="text-xs text-slate-500">Instant emergency location dispatch to your family contacts.</p>
          </div>
        </div>
      </section>

      {/* CHECKOUT MODAL */}
      {selectedProduct && (
        <CheckoutModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onPurchaseSuccess={(data) => {
            console.log('Purchase confirmed:', data);
          }}
        />
      )}
    </div>
  );
}
