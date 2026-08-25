import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppHeader({ onContactClick }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoggedIn } = useAuth();

  const handleNavClick = (e, targetPath) => {
    if (targetPath.startsWith('/#')) {
      const hash = targetPath.replace('/', '');
      if (location.pathname === '/') {
        e.preventDefault();
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/store', highlight: true },
    { label: 'How It Works', path: '/#how-it-works' },
    { label: 'Contact Us', path: '/contact' }
  ];

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* TOP ANNOUNCEMENT BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-[#F36F21] via-[#E94E1A] to-[#1E8A38] text-white py-2 px-4 text-center text-xs font-bold shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2">
          <span className="bg-white text-[#F36F21] text-[10px] uppercase font-black px-2 py-0.5 rounded-full animate-pulse">
            Special Launch Offer
          </span>
          <span className="truncate">Get 40% OFF on all Vehicle QR Safety Kits! 🇮🇳</span>
          <Link to="/store" className="underline font-black hover:text-amber-200 ml-1 shrink-0 hidden sm:inline">
            Shop Now →
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN NAVBAR */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Official Logo */}
          <Link to="/" className="flex items-center group shrink-0">
            <img
              src="/Safe Drive Tag Logo.jpg.jpeg"
              alt="SafeDrive Tag"
              className="h-12 md:h-14 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/favicon.svg';
              }}
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-bold text-slate-600">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return item.path.startsWith('/#') ? (
                <a
                  key={item.label}
                  href={item.path}
                  onClick={(e) => handleNavClick(e, item.path)}
                  className="hover:text-[#F36F21] transition cursor-pointer"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`transition ${
                    isActive
                      ? 'text-[#F36F21] font-black'
                      : item.highlight
                      ? 'text-[#1E8A38] hover:text-[#16702c] font-black'
                      : 'hover:text-[#F36F21]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            
            {/* Shop Button */}
            <Link
              to="/store"
              className="hidden sm:flex items-center space-x-2 bg-[#1E8A38] hover:bg-[#16702c] text-white text-xs sm:text-sm font-black px-4 sm:px-5 py-2.5 rounded-full shadow-md shadow-[#1E8A38]/20 transition active:scale-95 group"
            >
              <ShoppingBag className="w-4 h-4 group-hover:rotate-12 transition" />
              <span>Shop Kits</span>
            </Link>

            {/* Login OR Profile Button Toggle */}
            {isLoggedIn ? (
              <Link
                to="/profile"
                className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-slate-900/20 transition active:scale-95"
                title="My Profile"
              >
                <div className="w-6 h-6 rounded-full bg-[#F36F21] text-white flex items-center justify-center text-[10px] font-black">
                  {user?.name ? user.name[0].toUpperCase() : 'P'}
                </div>
                <span className="font-bold max-w-[110px] truncate">
                  {user?.name || 'Profile'}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-sm transition active:scale-95"
              >
                <User className="w-4 h-4 text-[#F36F21]" />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 lg:hidden rounded-xl hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3 animate-fadeIn shadow-xl">
            <nav className="flex flex-col space-y-2 text-sm font-bold text-slate-700">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg"
              >
                🏠 Home
              </Link>
              <Link
                to="/store"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 bg-emerald-50 text-[#1E8A38] font-black rounded-lg flex items-center justify-between"
              >
                <span>🛒 Shop QR Safety Kits</span>
                <span className="text-[10px] bg-[#1E8A38] text-white px-2 py-0.5 rounded-full">Offer</span>
              </Link>
              <a
                href="/#how-it-works"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleNavClick(e, '/#how-it-works');
                }}
                className="p-2 hover:bg-slate-50 rounded-lg"
              >
                ⚙️ How It Works
              </a>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-700 font-bold"
              >
                📞 Contact Us
              </Link>
            </nav>

            <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
              {isLoggedIn ? (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl text-xs text-center flex items-center justify-center space-x-2 shadow-md"
                >
                  <User className="w-4 h-4 text-[#F36F21]" />
                  <span>My Profile ({user?.name || 'Owner'})</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-[#F36F21] hover:bg-[#d85810] text-white font-black py-3 rounded-xl text-xs text-center shadow-md flex items-center justify-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Owner Login →</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
