import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, Heart } from 'lucide-react';
import { API_BASE } from '../config/api';

export default function AppFooter({ onContactClick }) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState('');

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
        setSubscribeMsg('✓ Thank you for subscribing!');
        setNewsletterEmail('');
      }
    } catch (err) {
      setSubscribeMsg(err.response?.data?.message || 'Subscription failed.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer id="contact" className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Column 1: Brand & Logo */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="/Safe Drive Tag Logo.jpg.jpeg"
                alt="SafeDrive Tag"
                className="h-12 w-auto object-contain bg-white rounded-xl p-1.5 shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/favicon.svg';
                }}
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              SafeDrive-Tag is India's premier smart vehicle QR security solution connecting vehicle owners and citizens securely in seconds without exposing personal phone numbers.
            </p>
            <div className="pt-1 text-xs font-bold text-slate-300">
              <span>📍 Made with ❤️ for Safer Roads across India</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/" className="hover:text-white transition">Home</Link></li>
              <li><Link to="/store" className="hover:text-white transition font-bold text-[#1E8A38]">🛒 Shop Safety Kits</Link></li>
              <li><a href="/#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><Link to="/contact" className="hover:text-white transition text-[#F36F21] font-bold">Contact Us</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Owner Portal Login</Link></li>
            </ul>
          </div>

          {/* Column 3: Support & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Support & Legal</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><span className="hover:text-white transition cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Terms & Conditions</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Refund & Cancellation</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Shipping & Delivery Policy</span></li>
              {onContactClick && (
                <li>
                  <button
                    type="button"
                    onClick={onContactClick}
                    className="hover:text-white transition text-xs font-bold text-[#F36F21] cursor-pointer"
                  >
                    Contact Support Team →
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Contact & Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Contact & Updates</h4>
            <div className="space-y-2 text-xs font-medium">
              <p className="flex items-center space-x-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-[#1E8A38]" />
                <span>support@safedrivetag.in</span>
              </p>
              <p className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-[#F36F21]" />
                <span>+91 98765 43210</span>
              </p>
              <p className="flex items-center space-x-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Lucknow, Uttar Pradesh, India</span>
              </p>
            </div>

            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="pt-2 flex space-x-1">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Your email address..."
                className="bg-slate-900 border border-slate-800 text-white px-3 py-2 rounded-xl text-xs flex-1 focus:outline-none focus:border-[#1E8A38]"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="bg-[#F36F21] hover:bg-[#d85810] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            {subscribeMsg && (
              <p className="text-[10px] font-bold mt-1 text-emerald-400">
                {subscribeMsg}
              </p>
            )}
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SafeDrive-Tag. All rights reserved. Registered Trademark.</p>
          <p className="flex items-center space-x-1">
            <span>Built for Safer Roads across India</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
}
