import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CheckoutModal from '../components/CheckoutModal';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import {
  ShieldCheck,
  QrCode,
  Check,
  Zap,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Lock,
  Truck
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AppLoader from '../components/AppLoader';

export default function Store() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/purchase/products`);
      if (res.data.success) {
        setProducts(res.data.products || []);
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

  // Category visual mapping for products
  const getProductVisual = (p) => {
    if (p.imageUrl) return p.imageUrl;
    const name = (p.title || p.name || p.qrFor || '').toLowerCase();
    if (name.includes('bike') || name.includes('scooter')) return '🏍️';
    if (name.includes('truck') || name.includes('commercial')) return '🚚';
    if (name.includes('bus') || name.includes('van')) return '🚌';
    return '🚗';
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans selection:bg-[#F36F21] selection:text-white">

      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-10 pb-20 px-4 text-center relative overflow-hidden border-b border-slate-800">
        
        {/* Glow Spheres */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F36F21]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#1E8A38]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-400 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-[#F36F21]" />
            <span>Official SafeDrive Tag Store</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Protect Your Vehicle with <br />
            <span className="text-[#F36F21]">Smart QR Safety Kits</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Choose your tailored safety kit. Instant cloud-masked calling, WhatsApp direct alerts, and weatherproof QR protection.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. PRODUCT CARDS (TITLE, DESCRIPTION, PRICE, DETAILS TEXT, BUY) */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 pb-16 w-full">
        {loading ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
            <AppLoader message="Loading safety products..." fullScreen={false} />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xl text-center space-y-3 max-w-md mx-auto">
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
              <QrCode className="w-7 h-7 text-[#F36F21]" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No Products Available</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              New vehicle safety kits are being updated. Please check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p, idx) => {
              const isPopular = idx === 0;
              const visual = getProductVisual(p);
              const isImage = typeof visual === 'string' && visual.startsWith('http');

              const mrp = p.originalPrice || (p.price + (p.discount || 150));
              const hasDiscount = mrp > p.price;
              const discountVal = hasDiscount ? (p.discount || (mrp - p.price)) : 0;
              const discountPct = hasDiscount ? Math.round((discountVal / mrp) * 100) : 40;

              return (
                <div
                  key={p._id}
                  className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between shadow-lg relative group ${
                    isPopular
                      ? 'border-2 border-[#1E8A38] shadow-[#1E8A38]/15 scale-[1.01]'
                      : 'border-slate-200 hover:border-[#F36F21] hover:shadow-xl'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#F36F21] to-[#1E8A38] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                      ⭐ MOST POPULAR KIT
                    </div>
                  )}

                  <div>
                    {/* 1. PRODUCT IMAGE (Only if image is uploaded by admin) */}
                    {p.imageUrl ? (
                      <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 border border-slate-100 bg-slate-50 flex items-center justify-center p-2">
                        <img
                          src={p.imageUrl}
                          alt={p.name || p.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    ) : null}

                    {/* 2. TITLE */}
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{p.title || p.name}</h3>

                    {/* 3. DESCRIPTION */}
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {p.description || `Premium weatherproof vinyl safety kit with cloud masked calling and instant notification alerts.`}
                    </p>

                    {/* 4. PRICE */}
                    <div className="my-4 pb-4 border-b border-slate-100">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-black text-slate-900">₹{p.price}</span>
                        {hasDiscount && (
                          <span className="text-sm text-slate-400 line-through font-mono">₹{mrp}</span>
                        )}
                        {hasDiscount && (
                          <span className="text-[10px] font-black text-[#1E8A38] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 5. DETAILS (TEXT / FEATURES LIST) */}
                    <div className="space-y-2 mb-6">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                        Product Details:
                      </div>
                      {(p.features && p.features.length > 0 ? p.features : [
                        p.qrType === 'DIGITAL' ? 'High-Resolution Digital QR Pass' : 'Pre-cut Weatherproof Vinyl Sticker',
                        'Instant Masked Voice Call to Owner',
                        'Anti-Harassment Plate Security',
                        'Instant Push & WhatsApp Notifications'
                      ]).map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                          <Check className="w-3.5 h-3.5 text-[#1E8A38] shrink-0" />
                          <span className="truncate">{typeof feat === 'string' ? feat : feat.title || 'Feature included'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 6. BUY / ORDER BUTTON */}
                  <button
                    onClick={() => setSelectedProduct(p)}
                    className={`w-full font-black py-3.5 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-md cursor-pointer active:scale-95 ${
                      isPopular
                        ? 'bg-[#1E8A38] hover:bg-[#16702c] text-white shadow-[#1E8A38]/25'
                        : 'bg-slate-950 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{p.qrType === 'DIGITAL' ? '⚡ Buy & Download Instantly' : '🛒 Order Safety Kit'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. TRUST FEATURES STRIP */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 w-full">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1E8A38] flex items-center justify-center mx-auto border border-emerald-100">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-slate-900">Zero Mobile Spam</h4>
            <p className="text-xs text-slate-500">Your phone number is never exposed to public QR scanners.</p>
          </div>

          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F36F21] flex items-center justify-center mx-auto border border-orange-100">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-slate-900">Instant 30-Sec Setup</h4>
            <p className="text-xs text-slate-500">Receive stickers, scan once, and link your vehicle with 1-tap OTP.</p>
          </div>

          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1E8A38] flex items-center justify-center mx-auto border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-slate-900">100% Privacy Protected</h4>
            <p className="text-xs text-slate-500">All alerts and calls are routed through secure masked bridges.</p>
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
