import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import axios from 'axios';
import { API_BASE } from '../config/api';

export default function MainLayout() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccessMsg, setContactSuccessMsg] = useState('');

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#F36F21] selection:text-white flex flex-col justify-between">
      
      {/* 1. FIXED UNIVERSAL HEADER (IDENTICAL ON ALL PAGES) */}
      <AppHeader onContactClick={() => setShowContactModal(true)} />

      {/* 2. PAGE CONTENT OUTLET */}
      <div className="flex-1">
        <Outlet context={{ openContactModal: () => setShowContactModal(true) }} />
      </div>

      {/* 3. FIXED UNIVERSAL FOOTER (IDENTICAL ON ALL PAGES) */}
      <AppFooter onContactClick={() => setShowContactModal(true)} />

      {/* 4. GLOBAL CONTACT MODAL */}
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
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {contactSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold text-center space-y-3">
                <p>{contactSuccessMsg}</p>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="bg-[#1E8A38] text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
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
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-2/3 bg-[#1E8A38] hover:bg-[#16702c] text-white font-bold py-3 rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
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
