import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Sentinel Protocol — WhatsApp Spam Guard';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0b1326 0%, #131b2e 50%, #0b1326 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <svg width="64" height="64" viewBox="0 0 32 32">
            <path d="M16 2L4 7v8c0 7.73 5.12 14.96 12 17 6.88-2.04 12-9.27 12-17V7L16 2z" fill="#4edea3"/>
            <path d="M14 17l-3-3 1.41-1.41L14 14.17l5.59-5.59L21 10l-7 7z" fill="#0b1326"/>
          </svg>
          <span style={{ fontSize: 48, fontWeight: 700, color: '#4edea3' }}>
            Sentinel Protocol
          </span>
        </div>
        <span style={{ fontSize: 28, color: '#dae2fd', marginBottom: '16px' }}>
          WhatsApp Spam Guard
        </span>
        <span style={{ fontSize: 18, color: '#8892a8', maxWidth: '600px', textAlign: 'center' }}>
          Autonomous spam detection for university WhatsApp groups. AI-powered moderation with community reporting.
        </span>
      </div>
    ),
    { ...size }
  );
}
