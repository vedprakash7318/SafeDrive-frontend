import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function SafeDrivePhysicalSticker({
  qrValue = 'https://safedrivetag.in/demo',
  vehicleNumber = '',
  className = '',
  id
}) {
  return (
    <div
      id={id}
      className={`relative w-full max-w-[540px] aspect-[1.6/1] bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-slate-200/90 flex flex-row select-none ${className}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ------------------------------------------------------------- */}
      {/* LEFT HALF (WHITE BACKGROUND) */}
      {/* ------------------------------------------------------------- */}
      <div className="w-[52%] h-full p-4 sm:p-5 flex flex-col justify-between bg-white z-10">
        
        {/* Brand Logo */}
        <div className="flex items-center">
          <img
            src="/Safe Drive Tag Logo.jpg.jpeg"
            alt="SafeDrive Tag"
            className="h-10 sm:h-12 w-auto object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Main Headline */}
        <div className="my-auto py-1">
          <h2 className="text-xl sm:text-2xl md:text-[26px] font-black text-[#F36F21] leading-[1.12] tracking-tight">
            Scan the code <br />
            to contact the <br />
            vehicle owner.
          </h2>
          {vehicleNumber && (
            <div className="mt-2 inline-block bg-slate-100 text-slate-800 text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded border border-slate-200">
              {vehicleNumber}
            </div>
          )}
        </div>

        {/* Bottom Instructions with Scan Graphic */}
        <div className="pt-2 border-t-2 border-slate-900 flex items-center space-x-2">
          <div className="shrink-0 text-slate-900">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" fill="#f8fafc" />
              <path d="M12 18h.01" strokeWidth="3" strokeLinecap="round" />
              <path d="M9 6h6M9 9h6M9 12h3" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[7.5px] sm:text-[8.5px] font-black text-slate-800 uppercase leading-[1.15] tracking-tight">
            SCAN USING PHONE CAMERA, GOOGLE LENS OR ANY QR SCANNER APP. VISIT <span className="text-[#259A3A]">SAFEDRIVETAG.IN</span> FOR MORE.
          </p>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT HALF (ORANGE / GREEN SPLIT BACKGROUND WITH QR & ICONS) */}
      {/* ------------------------------------------------------------- */}
      <div className="w-[48%] h-full flex flex-col justify-between relative overflow-hidden">
        
        {/* Background Dual Tone Split: Top Orange, Bottom Green */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          <div className="h-[52%] bg-[#F36F21]" />
          <div className="h-[48%] bg-[#1E8A38]" />
        </div>

        {/* QR Code Container in Center */}
        <div className="relative z-10 pt-3 sm:pt-4 px-3 flex flex-col items-center">
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl border border-white/60 relative">
            <QRCodeSVG
              value={qrValue}
              size={130}
              level="M"
              includeMargin={false}
              className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32"
            />
            {/* Bottom Left Green Pill & Bottom Right Orange Pill */}
            <div className="flex justify-between items-center px-1 pt-1.5">
              <span className="w-5 h-2 rounded-full bg-[#1E8A38]" />
              <span className="w-5 h-2 rounded-full bg-[#F36F21]" />
            </div>
          </div>
        </div>

        {/* Bottom Icons & Subtext */}
        <div className="relative z-10 pb-2.5 px-2 text-center text-white">
          
          {/* 5 Icons Row */}
          <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm font-black pb-1">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-red-600 flex items-center justify-center shadow-xs">🚫</span>
            <span className="text-white/40 font-light">|</span>
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-[#1E8A38] flex items-center justify-center shadow-xs">📞</span>
            <span className="text-white/40 font-light">|</span>
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-amber-500 flex items-center justify-center shadow-xs">⚠️</span>
            <span className="text-white/40 font-light">|</span>
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-xs">🚚</span>
            <span className="text-white/40 font-light">|</span>
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-yellow-500 flex items-center justify-center shadow-xs">🚨</span>
          </div>

          <p className="text-[7.5px] sm:text-[9px] font-bold text-white leading-tight tracking-tight px-1 drop-shadow-xs">
            Wrong Parking, Emergency Contact, any issue with the vehicle, Scan the QR.
          </p>
        </div>

      </div>

    </div>
  );
}
