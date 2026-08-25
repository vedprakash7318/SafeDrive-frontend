import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function AppLoader({ message = 'Loading details...', fullScreen = true, size = 'default' }) {
  const isSmall = size === 'small';

  const spinner = (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 animate-fadeIn">
      {/* Brand Orange Circular Spinning Arrows */}
      <div className="relative flex items-center justify-center">
        <RefreshCw
          className={`${isSmall ? 'w-6 h-6' : 'w-12 h-12'} text-[#F36F21] animate-spin`}
          strokeWidth={2.5}
        />
      </div>

      {message && (
        <p className={`font-black text-slate-800 tracking-tight ${isSmall ? 'text-xs' : 'text-sm sm:text-base'}`}>
          {message}
        </p>
      )}
    </div>
  );

  if (!fullScreen) {
    return spinner;
  }

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
      {spinner}
    </div>
  );
}
