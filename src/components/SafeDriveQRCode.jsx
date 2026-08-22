import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Exact vehicle badge with Brand Blue #1D56A5
export const CAR_CENTER_BADGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="46" fill="#1D56A5" stroke="#ffffff" stroke-width="6"/>
  <g fill="none" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M26 56 L26 49 C26 47.5 27 46.5 28.5 46 L34 44 L41 34 C42.5 32 44.5 31 47 31 L64 31 C66.5 31 68.5 32.5 69.5 34.5 L75 43.5 L77 45.5 C78.5 47 79 48 79 49.5 L79 56" />
    <path d="M26 56 L30 56" />
    <path d="M42 56 L60 56" />
    <path d="M72 56 L79 56" />
    <circle cx="36" cy="56" r="6" fill="#1D56A5" stroke="#ffffff" stroke-width="5" />
    <circle cx="66" cy="56" r="6" fill="#1D56A5" stroke="#ffffff" stroke-width="5" />
    <line x1="52" y1="33" x2="52" y2="44" stroke="#ffffff" stroke-width="4.5" />
  </g>
</svg>
`)}`;

/**
 * Helper to download QR SVG as PNG image
 */
export const downloadQRCodeSVG = (svgId, filename = 'SafeDrive-QR.png') => {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width + 40;
    canvas.height = img.height + 40;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 20, 20);
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
};

export default function SafeDriveQRCode({
  value,
  size = 140,
  className = '',
  includeMargin = true,
  id
}) {
  const logoSize = Math.round(size * 0.26);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <QRCodeSVG
        id={id}
        value={value}
        size={size}
        level="H"
        includeMargin={includeMargin}
        imageSettings={{
          src: CAR_CENTER_BADGE,
          x: undefined,
          y: undefined,
          height: logoSize,
          width: logoSize,
          excavate: true
        }}
      />
    </div>
  );
}
