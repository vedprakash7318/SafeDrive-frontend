import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

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
  const logoSize = Math.round(size * 0.20);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <QRCodeSVG
        id={id}
        value={value}
        size={size}
        level="H"
        includeMargin={includeMargin}
        imageSettings={{
          src: '/logo.png',
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
