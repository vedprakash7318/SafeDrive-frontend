import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import {
  ShieldCheck,
  Phone,
  MessageSquare,
  AlertTriangle,
  Car,
  Bike,
  Truck,
  Bus,
  CheckCircle,
  Play,
  X,
  Lock,
  Zap,
  HelpCircle,
  Users,
  QrCode,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Clock,
  Star,
  Mail,
  MapPin,
  Send,
  Heart,
  Headphones,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  Check,
  Compass,
  CheckCheck,
  Radio,
  Eye
} from 'lucide-react';
import axios from 'axios';
import SafeDrivePhysicalSticker from '../components/SafeDrivePhysicalSticker';
import { API_BASE } from '../config/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [samplePlate, setSamplePlate] = useState('UP32 AN 0909');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [selectedReasonPreview, setSelectedReasonPreview] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // Live Backend Data States
  const [products, setProducts] = useState([]);
  const [scanReasons, setScanReasons] = useState([]);
  const [stats, setStats] = useState({
    totalTagsSold: '50,000+',
    totalActiveDrivers: '20,000+',
    positiveRating: '99.5%',
    support: '24/7'
  });
  const [companyInfo, setCompanyInfo] = useState({
    supportEmail: 'support@safedrivetag.in',
    supportPhone: '+91 98765 43210',
    address: 'Lucknow, Uttar Pradesh, India',
    companyName: 'SafeDrive-Tag'
  });

  useEffect(() => {
    const fetchLiveLandingData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/public/landing-data`);
        if (res.data.success) {
          if (res.data.products && res.data.products.length > 0) {
            setProducts(res.data.products);
          }
          if (res.data.scanReasons && res.data.scanReasons.length > 0) {
            setScanReasons(res.data.scanReasons);
            setSelectedReasonPreview(res.data.scanReasons[0]?.title || 'Wrong Parking');
          }
          if (res.data.stats) {
            setStats(res.data.stats);
          }
          if (res.data.company) {
            setCompanyInfo(res.data.company);
          }
        }
      } catch (err) {
        console.log('Landing page live data load:', err.message);
      } finally {
        setLoadingData(false);
      }
    };

    fetchLiveLandingData();
  }, []);

  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccessMsg, setContactSuccessMsg] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    setSubscribing(true);
    setSubscribeMsg('');
    try {
      const res = await axios.post(`${API_BASE}/public/subscribe-newsletter`, {
        email: newsletterEmail
      });
      if (res.data.success) {
        setNewsletterSubscribed(true);
        setSubscribeMsg('✓ ' + (res.data.message || 'Subscribed successfully!'));
        setNewsletterEmail('');
      }
    } catch (err) {
      setSubscribeMsg(err.response?.data?.message || 'Subscription failed. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    if (!contactForm.message) return;
    setContactLoading(true);
    setContactSuccessMsg('');
    try {
      const res = await axios.post(`${API_BASE}/public/contact-inquiry`, contactForm);
      if (res.data.success) {
        setContactSuccessMsg('✓ ' + res.data.message);
        setContactForm({ name: '', phone: '', email: '', message: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not submit message.');
    } finally {
      setContactLoading(false);
    }
  };

  const commonReasons = [
    { label: 'Wrong Parking', icon: '🚫', desc: 'Blocked gate or parking' },
    { label: 'Accidental Alert', icon: '⚠️', desc: 'Dent, scratch or collision' },
    { label: 'Vehicle Issue', icon: '🚗', desc: 'Flat tire or lights on' },
    { label: 'Emergency Contact', icon: '📞', desc: 'Urgent owner contact' },
    { label: 'Window / Gate Open', icon: '🪟', desc: 'Glass down in rain' },
    { label: 'Other Issue', icon: '💬', desc: 'Custom instant message' },
  ];

  const vehicleCategories = [
    {
      title: 'Cars & SUVs',
      desc: 'Sedan, Hatchback, SUV & Luxury cars',
      price: '₹299',
      tag: 'Best Seller',
      img: '🚗',
      features: ['Rear Windshield Fit', 'Weatherproof Vinyl', 'Instant Push + Call']
    },
    {
      title: 'Bikes & Scooters',
      desc: 'Motorcycles, EV Scooters & Superbikes',
      price: '₹199',
      tag: 'Most Popular',
      img: '🏍️',
      features: ['Compact Mudguard Fit', 'Sun & Rain Proof', 'Quick SOS Trigger']
    },
    {
      title: 'Commercial Trucks',
      desc: 'Heavy cargo, Loaders & Pickups',
      price: '₹349',
      tag: 'Fleet Grade',
      img: '🚚',
      features: ['Heavy Duty Adhesive', 'Reflective Coating', 'Fleet Tracking Ready']
    },
    {
      title: 'Buses & Transits',
      desc: 'School, Tour & City Transit Buses',
      price: '₹399',
      tag: 'Transit Grade',
      img: '🚌',
      features: ['Multi-Passenger Alert', 'Emergency SOS', 'High Visibility']
    },
    {
      title: 'Cabs & Taxis',
      desc: 'Ride-share, Rental & Taxi Fleets',
      price: '₹299',
      tag: 'Commercial',
      img: '🚕',
      features: ['Driver Privacy Mask', 'Passenger Lost & Found', 'Instant Alert']
    },
    {
      title: 'Bags & Luggage',
      desc: 'Travel Bags, Laptops & Valuables',
      price: '₹149',
      tag: 'Lifestyle',
      img: '🧳',
      features: ['Smart Lost & Found', 'Worldwide Scan', 'Zero App Needed']
    }
  ];

  const whyChooseUs = [
    {
      title: '100% Privacy & Call Masking',
      desc: 'Your mobile number is never displayed to public scanners. All calls and alerts are masked and encrypted.',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-[#1E8A38] border-emerald-200'
    },
    {
      title: 'Easy 30-Second Installation',
      desc: 'Pre-cut, waterproof, scratch-proof vinyl sticker. Just peel and paste on your windshield or bumper.',
      icon: CheckCircle2,
      color: 'bg-amber-50 text-[#F36F21] border-amber-200'
    },
    {
      title: 'Works Offline Everywhere',
      desc: 'No battery, no recharging, and no SIM card required for the tag. It works anytime, anywhere across India.',
      icon: QrCode,
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      title: 'Zero App Needed for Scanners',
      desc: 'Anyone with any smartphone (Android, iPhone, Google Lens, Paytm, WhatsApp) can scan and connect in 5 seconds.',
      icon: Smartphone,
      color: 'bg-orange-50 text-orange-600 border-orange-200'
    },
    {
      title: 'Real-Time Audio & Push Alerts',
      desc: 'Receive immediate loud ringtone audio alerts and Web Push notifications directly on your smartphone.',
      icon: Zap,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      title: 'GPS Emergency SOS Dispatch',
      desc: 'In severe accidents, scanners can trigger emergency alerts that notify your family with live GPS map location.',
      icon: ShieldAlert,
      color: 'bg-rose-50 text-rose-600 border-rose-200'
    }
  ];

  const testimonials = [
    {
      name: 'Rahul Sharma',
      city: 'Lucknow, UP',
      role: 'Hyundai Creta Owner',
      comment: 'Saved my car from getting towed! Someone parked blocking my car, and they scanned the tag to notify me instantly. Brilliant service!',
      avatar: '👨‍💼'
    },
    {
      name: 'Priya Verma',
      city: 'Kanpur, UP',
      role: 'Tata Nexon EV Owner',
      comment: 'As a woman driver, safety and privacy are my #1 concern. SafeDrive Tag lets people alert me without exposing my personal phone number.',
      avatar: '👩‍💼'
    },
    {
      name: 'Aman Singh',
      city: 'Delhi NCR',
      role: 'Royal Enfield & Kia Seltos',
      comment: 'The sticker quality is top notch! Weatherproof, premium finish, and the ringtone alert works even when the phone is locked. Must-have for everyone.',
      avatar: '👨‍💻'
    }
  ];

  return (
    <div className="bg-slate-50 text-slate-900 font-sans selection:bg-[#F36F21] selection:text-white">

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section id="home" className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-gradient-to-b from-orange-50/40 via-emerald-50/20 to-white">
        
        {/* Ambient Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#F36F21]/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#1E8A38]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              
              {/* Trust Badge */}
              <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E8A38] animate-ping" />
                <span>🛡️ India's #1 QR Vehicle Security & Emergency Alert</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Scan QR to Contact <br />
                <span className="text-[#F36F21] underline decoration-[#1E8A38] decoration-wavy decoration-2">
                  the Vehicle Owner
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                A smart and secure way to connect with vehicle owners instantly in case of wrong parking, accidents, or emergencies — <strong>without sharing your personal mobile number</strong>.
              </p>

              {/* 4 Feature Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-lg mx-auto lg:mx-0">
                <div className="bg-white border border-slate-200/90 p-3 rounded-2xl text-center shadow-xs hover:border-[#1E8A38] transition">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#1E8A38] flex items-center justify-center mx-auto mb-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-slate-900">100% Privacy</div>
                  <div className="text-[10px] text-slate-400">Number stays safe</div>
                </div>

                <div className="bg-white border border-slate-200/90 p-3 rounded-2xl text-center shadow-xs hover:border-blue-500 transition">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1.5 font-bold">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-slate-900">Instant Connect</div>
                  <div className="text-[10px] text-slate-400">Direct WhatsApp/Call</div>
                </div>

                <div className="bg-white border border-slate-200/90 p-3 rounded-2xl text-center shadow-xs hover:border-rose-500 transition">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-1.5 font-bold">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-slate-900">Emergency SOS</div>
                  <div className="text-[10px] text-slate-400">Live GPS Location</div>
                </div>

                <div className="bg-white border border-slate-200/90 p-3 rounded-2xl text-center shadow-xs hover:border-amber-500 transition">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#F36F21] flex items-center justify-center mx-auto mb-1.5 font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-slate-900">Easy to Use</div>
                  <div className="text-[10px] text-slate-400">Scan & alert in 5s</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  to="/store"
                  className="w-full sm:w-auto bg-[#1E8A38] hover:bg-[#16702c] text-white text-base font-black px-8 py-4 rounded-2xl shadow-xl shadow-[#1E8A38]/30 flex items-center justify-center space-x-3 transition active:scale-95"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Buy Your Tag Now (₹299)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => setShowVideoModal(true)}
                  className="w-full sm:w-auto bg-white hover:bg-orange-50/60 border-2 border-[#F36F21] text-[#F36F21] text-sm font-black px-6 py-3.5 rounded-2xl shadow-sm flex items-center justify-center space-x-2.5 transition active:scale-95"
                >
                  <div className="w-7 h-7 rounded-full bg-[#F36F21] text-white flex items-center justify-center shadow-xs">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-slate-900">Watch Live Demo</div>
                    <div className="text-[10px] text-slate-500">See how it alerts owner</div>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-center lg:justify-start space-x-4 text-xs font-bold text-slate-500 pt-1">
                <span className="flex items-center space-x-1"><Check className="w-3.5 h-3.5 text-[#1E8A38]" /> <span>Free Delivery</span></span>
                <span>•</span>
                <span className="flex items-center space-x-1"><Check className="w-3.5 h-3.5 text-[#1E8A38]" /> <span>No App Needed</span></span>
                <span>•</span>
                <span className="flex items-center space-x-1"><Check className="w-3.5 h-3.5 text-[#1E8A38]" /> <span>Cash on Delivery</span></span>
              </div>

            </div>

            {/* Right Side: LIVE REALISTIC CARD STICKER MOCKUP */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
              
              <div className="relative w-full max-w-lg">
                {/* Floating badge */}
                <div className="absolute -top-4 -right-2 z-20 bg-gradient-to-r from-[#F36F21] to-[#1E8A38] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg flex items-center space-x-1.5 animate-bounce">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Official QR Vinyl Sticker</span>
                </div>

                {/* The Physical Card Sticker Component */}
                <div className="transform hover:scale-[1.02] transition-transform duration-300">
                  <SafeDrivePhysicalSticker
                    qrValue="https://safedrivetag.in/demo"
                    vehicleNumber={samplePlate}
                  />
                </div>

                {/* Sample Plate Selector Interactive Widget */}
                <div className="mt-4 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-slate-700 font-bold">
                    <span>🚗 Sample Plate:</span>
                    <input
                      type="text"
                      value={samplePlate}
                      onChange={(e) => setSamplePlate(e.target.value.toUpperCase())}
                      placeholder="UP32 AN 0909"
                      className="bg-slate-100 border border-slate-300 font-mono font-black text-slate-900 px-2.5 py-1 rounded-lg w-32 uppercase text-xs focus:outline-none focus:border-[#F36F21]"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ✓ Waterproof Vinyl & Sunproof
                  </span>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. COMMON REASONS FOR SCANNING BAR */}
      {/* ------------------------------------------------------------- */}
      <section className="border-y border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            
            <div className="text-center lg:text-left shrink-0">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Standard Scanner Actions</span>
              <div className="text-base font-black text-[#F36F21]">When People Scan SafeDrive Tag:</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full lg:w-auto">
              {commonReasons.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-bold shadow-2xs transition cursor-pointer text-center ${
                    selectedReasonPreview === r.label
                      ? 'bg-slate-900 text-white border-slate-900 scale-105'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                  onClick={() => setSelectedReasonPreview(r.label)}
                >
                  <span className="text-sm">{r.icon}</span>
                  <span className="truncate">{r.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. HOW SAFEDRIVE-TAG WORKS (4 STEPS TIMELINE) */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="py-16 md:py-24 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <span className="text-xs uppercase font-black tracking-widest text-[#F36F21] bg-orange-100/70 border border-orange-200 px-3.5 py-1 rounded-full">
            SIMPLE & 100% RELIABLE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mt-3 tracking-tight">
            How <span className="text-[#1E8A38]">SafeDrive-Tag</span> Works
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto mt-2">
            No special app needed. Works instantly on any Android, iPhone, Google Lens, or Camera.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 relative">
            
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center hover:shadow-xl hover:border-[#1E8A38] transition relative group">
              <div className="w-10 h-10 rounded-full bg-[#1E8A38] text-white font-black text-sm flex items-center justify-center mx-auto mb-4 shadow-md">
                1
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#1E8A38] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition shadow-xs">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">1. Scan QR Code</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Public scanner spots the SafeDrive sticker on your windshield and scans it using their phone camera.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center hover:shadow-xl hover:border-[#F36F21] transition relative group">
              <div className="w-10 h-10 rounded-full bg-[#F36F21] text-white font-black text-sm flex items-center justify-center mx-auto mb-4 shadow-md">
                2
              </div>
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#F36F21] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition shadow-xs">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">2. Choose Reason</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                They select the reason (Wrong Parking, Accidental, Vehicle Issue, or custom message).
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center hover:shadow-xl hover:border-[#1E8A38] transition relative group">
              <div className="w-10 h-10 rounded-full bg-[#1E8A38] text-white font-black text-sm flex items-center justify-center mx-auto mb-4 shadow-md">
                3
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#1E8A38] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition shadow-xs">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">3. Contact Owner</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                They send a push alert, masked phone call, or WhatsApp message without seeing your private number.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center hover:shadow-xl hover:border-[#F36F21] transition relative group">
              <div className="w-10 h-10 rounded-full bg-[#F36F21] text-white font-black text-sm flex items-center justify-center mx-auto mb-4 shadow-md">
                4
              </div>
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#F36F21] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">4. Issue Resolved</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Your phone rings instantly with a loud alert. You resolve the issue quickly and keep your vehicle safe!
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. PERFECT FOR EVERY VEHICLE (PRODUCT CATALOG - LIVE BACKEND DATA) */}
      {/* ------------------------------------------------------------- */}
      <section id="vehicles" className="py-16 md:py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <span className="text-xs uppercase font-black tracking-widest text-[#1E8A38] bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full">
            OFFICIAL PRODUCT CATALOG
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mt-3 tracking-tight">
            Perfect for <span className="text-[#F36F21]">Every Vehicle</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto mt-2">
            Tailor-made waterproof vinyl QR tags for cars, bikes, heavy commercial fleets & personal assets.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 text-left">
            {vehicleCategories.map((v, i) => (
              <div
                key={i}
                className="bg-slate-50/70 border-2 border-slate-200/90 rounded-3xl p-6 hover:border-[#1E8A38] hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-4xl p-3 bg-white rounded-2xl shadow-xs border border-slate-200 group-hover:scale-110 transition">
                      {v.img}
                    </div>
                    <span className="text-[10px] font-black text-[#1E8A38] bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      {v.tag}
                    </span>
                  </div>

                  <h3 className="font-black text-lg text-slate-900">{v.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{v.desc}</p>

                  <div className="mt-4 space-y-1.5 pt-3 border-t border-slate-200">
                    {v.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                        <Check className="w-3.5 h-3.5 text-[#1E8A38]" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Starting At</span>
                    <div className="text-2xl font-black text-slate-900">{v.price}</div>
                  </div>
                  <Link
                    to="/store"
                    className="bg-[#1E8A38] hover:bg-[#16702c] text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition flex items-center space-x-1.5 active:scale-95"
                  >
                    <span>Order Kit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>



      {/* ------------------------------------------------------------- */}
      {/* 7. WHY THOUSANDS TRUST US (DARK NAVY STATS BANNER) */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-slate-950 text-white py-16 md:py-24 relative overflow-hidden border-y border-slate-800">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F36F21]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1E8A38]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Stats */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#1E8A38] bg-[#1E8A38]/20 px-3 py-1 rounded-full border border-[#1E8A38]/40">
                  INDIA'S MOST TRUSTED VEHICLE SAFETY
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mt-3 tracking-tight">
                  Why Thousands <span className="text-[#F36F21]">Trust Us</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto lg:mx-0">
                  Join tens of thousands of smart car, bike, and fleet owners who protect their loved ones and vehicles every single day.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl text-center shadow-lg">
                  <div className="text-3xl sm:text-4xl font-black text-white">{stats.totalTagsSold}</div>
                  <div className="text-xs text-slate-400 mt-1 font-bold">Tags Sold</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl text-center shadow-lg">
                  <div className="text-3xl sm:text-4xl font-black text-[#1E8A38]">{stats.totalActiveDrivers}</div>
                  <div className="text-xs text-slate-400 mt-1 font-bold">Happy Drivers</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl text-center shadow-lg">
                  <div className="text-3xl sm:text-4xl font-black text-[#F36F21]">{stats.positiveRating}</div>
                  <div className="text-xs text-slate-400 mt-1 font-bold">Positive Rating</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl text-center shadow-lg">
                  <div className="text-3xl sm:text-4xl font-black text-blue-400">{stats.support}</div>
                  <div className="text-xs text-slate-400 mt-1 font-bold">Instant Support</div>
                </div>
              </div>
            </div>

            {/* Right Card / Family Visual */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-800 border-2 border-slate-700 rounded-3xl p-7 shadow-2xl max-w-md text-center space-y-4">
                <div className="text-6xl">👨‍👩‍👧‍👦</div>
                <h3 className="font-black text-xl text-white">Safe Journey for Every Family</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "SafeDrive-Tag gives me immense peace of mind whenever my family is traveling. Any emergency contact can reach me immediately with live GPS."
                </p>
                <div className="inline-flex items-center space-x-1 text-amber-400 text-base">
                  {'★'.repeat(5)}
                </div>
                <div className="pt-2">
                  <Link
                    to="/store"
                    className="block w-full bg-[#1E8A38] hover:bg-[#16702c] text-white text-xs font-black py-3 rounded-xl transition shadow-md"
                  >
                    Protect Your Vehicle Now →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>



      {/* ------------------------------------------------------------- */}
      {/* 9. BOTTOM HIGH-CONVERTING CTA BANNER (ORANGE/GREEN GRADIENT) */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-gradient-to-r from-[#F36F21] via-[#E94E1A] to-[#1E8A38] text-white py-14 md:py-20 shadow-2xl relative overflow-hidden">
        
        {/* Glow overlay */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
            
            <div className="space-y-3 max-w-2xl">
              <span className="text-xs uppercase font-black tracking-widest bg-white/20 px-3.5 py-1 rounded-full">
                JOIN 50,000+ VEHICLE OWNERS
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Make the roads safer for everyone. <br />
                Get your SafeDrive-Tag today!
              </h2>
              <p className="text-xs sm:text-sm text-white/90 font-medium">
                ⚡ 100% Privacy • Masked Voice Calls & Alerts • Easy 30-Sec Installation • Lifetime QR Validity
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-center space-y-2">
              <Link
                to="/store"
                className="bg-slate-950 hover:bg-black text-white font-black px-10 py-5 rounded-2xl text-base md:text-lg shadow-2xl shadow-black/40 flex items-center space-x-3 transition active:scale-95 border-2 border-white/20"
              >
                <ShoppingBag className="w-5 h-5 text-[#F36F21]" />
                <span>Buy Tag Now (₹299) 🛒</span>
                <ArrowRight className="w-5 h-5 text-[#1E8A38]" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 11. WATCH VIDEO DEMO MODAL */}
      {/* ------------------------------------------------------------- */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
                <Play className="w-4 h-4 text-[#F36F21] fill-current" />
                <span>How SafeDrive-Tag Alerts the Vehicle Owner</span>
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 rounded-2xl p-6 text-center text-white space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1E8A38] text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <QrCode className="w-8 h-8" />
              </div>
              <h4 className="font-black text-lg">Instant QR Scan Simulation</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                1. Any citizen scans your SafeDrive QR sticker using their phone camera.<br />
                2. Selects reason: <strong>Wrong Parking, Accident, or Emergency</strong>.<br />
                3. Your phone immediately plays the ringtone alarm & displays the message!
              </p>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-emerald-400 font-mono">
                ✓ 100% Privacy Protected • Owner Mobile Number Never Shared
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowVideoModal(false)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition"
              >
                Close Demo
              </button>
              <Link
                to="/store"
                className="w-1/2 bg-[#1E8A38] hover:bg-[#16702c] text-white font-bold py-3 rounded-xl text-xs shadow-md transition text-center flex items-center justify-center space-x-1"
              >
                <span>Buy Tag Now (₹299) →</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 12. CONTACT SUPPORT MODAL (CONNECTED TO BACKEND API) */}
      {/* ------------------------------------------------------------- */}
      {showContactModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900">Contact Support Team</h3>
                <p className="text-xs text-slate-500">We respond to inquiries within 24 business hours</p>
              </div>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setContactSuccessMsg('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {contactSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold text-center space-y-3">
                <p>{contactSuccessMsg}</p>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="bg-[#1E8A38] text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitContact} className="space-y-3 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Rahul Sharma"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#1E8A38]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value.replace(/\D/g, '').slice(-10) })}
                      placeholder="9876543210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#1E8A38]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#1E8A38]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Message / Query *</label>
                  <textarea
                    required
                    rows={3}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="How can we help you regarding SafeDrive-Tag?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#1E8A38]"
                  />
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-2/3 bg-[#1E8A38] hover:bg-[#16702c] text-white font-bold py-3 rounded-xl text-xs shadow-md transition disabled:opacity-50"
                  >
                    {contactLoading ? 'Submitting...' : 'Send Message →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
