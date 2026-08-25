import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  Headphones,
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { API_BASE } from '../config/api';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [companyInfo, setCompanyInfo] = useState({
    supportEmail: 'support@safedrivetag.in',
    supportPhone: '+91 98765 43210',
    address: 'Lucknow, Uttar Pradesh, India'
  });

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch dynamic company contact info from backend if available
    const fetchCompanyData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/public/landing-data`);
        if (res.data.success && res.data.company) {
          setCompanyInfo({
            supportEmail: res.data.company.supportEmail || 'support@safedrivetag.in',
            supportPhone: res.data.company.supportPhone || '+91 98765 43210',
            address: res.data.company.address || 'Lucknow, Uttar Pradesh, India'
          });
        }
      } catch (err) {
        console.log('Contact company data load:', err.message);
      }
    };

    fetchCompanyData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message || formData.message.trim().length < 2) {
      setErrorMsg('Please enter your query or message');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await axios.post(`${API_BASE}/public/contact-inquiry`, formData);
      if (res.data.success) {
        setSuccessMsg('✓ ' + (res.data.message || 'Your inquiry has been submitted! Our support team will get in touch shortly.'));
        setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not submit your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: 'How does SafeDrive-Tag protect my phone number privacy?',
      a: 'When someone scans your vehicle QR code, they cannot see your personal mobile number. The call and alerts are routed through our secure masked cloud system.'
    },
    {
      q: 'How fast does the emergency alert work?',
      a: 'The alert is delivered in real-time within 2-3 seconds as a high-priority push notification with a distinctive loud siren ringtone on your mobile phone.'
    },
    {
      q: 'Can I transfer my QR tag to another car or bike?',
      a: 'Yes! You can easily update your registered vehicle number and model anytime from your Owner Dashboard.'
    }
  ];

  return (
    <div className="bg-slate-50 text-slate-900 font-sans selection:bg-[#F36F21] selection:text-white">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-12 pb-20 px-4 text-center relative overflow-hidden border-b border-slate-800">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F36F21]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#1E8A38]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-400 border border-white/15">
            <Headphones className="w-3.5 h-3.5 text-[#F36F21]" />
            <span>24/7 Citizen & Owner Support</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            We're Here to <span className="text-[#F36F21]">Help You</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Have questions about SafeDrive-Tag, bulk orders for fleets, or need technical help? Send us a message and our support team will respond promptly.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. CONTACT CARDS & FORM CONTAINER */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left 4 Cards: Direct Contact Info */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
              <h3 className="font-black text-lg text-slate-900">Direct Support Channels</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect with our dedicated vehicle safety team through any of the channels below.
              </p>

              <div className="space-y-3 pt-2">
                
                {/* Email */}
                <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#1E8A38] transition">
                  <div className="p-2.5 bg-emerald-50 text-[#1E8A38] rounded-xl border border-emerald-100 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Email Support</span>
                    <div className="text-xs font-bold text-slate-900">{companyInfo.supportEmail}</div>
                    <span className="text-[10px] text-slate-400">Response within 2-4 business hours</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#F36F21] transition">
                  <div className="p-2.5 bg-orange-50 text-[#F36F21] rounded-xl border border-orange-100 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Helpline / WhatsApp</span>
                    <div className="text-xs font-bold text-slate-900">{companyInfo.supportPhone}</div>
                    <span className="text-[10px] text-slate-400">Mon - Sat: 9:00 AM - 8:00 PM</span>
                  </div>
                </div>

                {/* Office Location */}
                <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-300 transition">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Headquarters</span>
                    <div className="text-xs font-bold text-slate-900">{companyInfo.address}</div>
                    <span className="text-[10px] text-slate-400">Serving customers all across India</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Guarantee Badge */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-md border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-black text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Privacy & Quick Resolution</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                All inquiries are securely logged and assigned to dedicated relationship managers for immediate resolution.
              </p>
            </div>

          </div>

          {/* Right 7: Contact Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900">Send an Inquiry / Message</h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill out the form below and we will get back to you with all required assistance.
              </p>
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-[#1E8A38] text-xs font-bold leading-relaxed flex items-center space-x-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold animate-fadeIn">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Rahul Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#F36F21] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs text-slate-400 font-mono font-bold">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(-10) })}
                      placeholder="9876543210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#F36F21] transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rahul@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#F36F21] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Your Message / Query *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please describe how we can help you with SafeDrive-Tag..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#F36F21] transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-[#1E8A38] hover:bg-[#16702c] text-white font-black px-8 py-3.5 rounded-xl shadow-lg shadow-[#1E8A38]/25 text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting Message...' : 'Submit Inquiry →'}</span>
                </button>
              </div>

            </form>

          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. FREQUENTLY ASKED QUESTIONS STRIP */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-16 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#F36F21] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-2">Common Inquiries</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl space-y-2">
                <h4 className="font-black text-xs text-slate-900">{faq.q}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

    </div>
  );
}
