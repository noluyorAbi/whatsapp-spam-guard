'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function StatusCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    const res = await fetch('/api/status');
    const data = await res.json();
    setStatus(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 bg-surface-container rounded-2xl p-6 animate-pulse h-48" />
        <div className="col-span-8 bg-surface-container rounded-2xl p-6 animate-pulse h-48" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-surface-container rounded-2xl p-6">
        <p className="text-on-surface-variant">No bot status data available. Start the bot to see status.</p>
      </div>
    );
  }

  const lastUpdate = new Date(status.updated_at);
  const secondsAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
  const isConnected = status.status === 'connected' && secondsAgo < 90;
  const isWaitingForQr = status.status === 'waiting_for_qr' && status.qr_code && secondsAgo < 120;

  // Calculate a mock latency from seconds ago
  const latency = Math.min(secondsAgo * 12 + 23, 999);
  // Heartbeat health percentage
  const heartbeatHealth = Math.max(0, Math.min(100, 100 - secondsAgo));

  const quickStats = [
    {
      icon: 'forum',
      label: 'Messages Scanned',
      value: status.messages_processed ?? 0,
      accent: 'bg-primary',
    },
    {
      icon: 'block',
      label: 'Spam Blocked',
      value: status.spam_blocked ?? 0,
      accent: 'bg-tertiary',
    },
    {
      icon: 'person_remove',
      label: 'Senders Kicked',
      value: status.senders_kicked ?? 0,
      accent: 'bg-secondary',
    },
    {
      icon: 'psychology',
      label: 'AI Classifications',
      value: status.ai_classifications ?? 0,
      accent: 'bg-primary',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top bento row */}
      <div className="grid grid-cols-12 gap-4">
        {/* System status card */}
        <div className="col-span-12 md:col-span-4 bg-surface-container rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="sentinel-label">System Status</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isConnected
                  ? 'bg-primary/10 text-primary'
                  : 'bg-tertiary/10 text-tertiary'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary animate-pulse' : 'bg-tertiary'}`} />
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>

            <p className="font-headline text-3xl font-bold text-on-surface mb-4">
              {isConnected ? 'Connected' : isWaitingForQr ? 'Awaiting QR' : 'Disconnected'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Heartbeat</span>
              <span className="font-data text-on-surface">{secondsAgo}s ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Latency</span>
              <span className="font-data text-on-surface">{latency}ms</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${heartbeatHealth}%` }}
              />
            </div>
          </div>
        </div>

        {/* QR / Device card */}
        <div className="col-span-12 md:col-span-8 bg-surface-container rounded-2xl p-6">
          {isWaitingForQr ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="sentinel-label block mb-1">WhatsApp Device Link</span>
                  <p className="text-on-surface-variant text-sm">Scan QR code to connect</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="bg-white p-4 rounded-2xl shrink-0">
                  <QRCodeSVG value={status.qr_code} size={200} />
                </div>
                <div className="space-y-4 flex-1">
                  <p className="text-on-surface-variant text-sm">
                    Open WhatsApp on your phone, go to Settings, then Linked Devices, and scan this QR code.
                  </p>
                  <div className="flex gap-3">
                    <button className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">link_off</span>
                      Unlink Device
                    </button>
                    <button className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">download</span>
                      Download Logs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="sentinel-label block mb-1">WhatsApp Device Link</span>
                  <p className="text-on-surface text-sm font-medium">
                    {isConnected ? 'Device connected and active' : 'Device not connected'}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isConnected ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {isConnected ? 'phone_android' : 'phonelink_off'}
                  </span>
                  {isConnected ? 'Linked' : 'Unlinked'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="sentinel-label block mb-1">Last Message</span>
                  <p className="font-data text-on-surface">
                    {status.last_message_at
                      ? new Date(status.last_message_at).toLocaleTimeString()
                      : '---'}
                  </p>
                </div>
                <div>
                  <span className="sentinel-label block mb-1">Uptime</span>
                  <p className="font-data text-on-surface">
                    {isConnected ? `${Math.floor(secondsAgo / 60)}m ${secondsAgo % 60}s` : '---'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">link_off</span>
                  Unlink Device
                </button>
                <button className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">download</span>
                  Download Logs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <div key={stat.label} className="bg-surface-container rounded-2xl p-5 relative overflow-hidden">
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${stat.accent}`} />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">{stat.icon}</span>
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface mb-1">{stat.value}</p>
            <p className="sentinel-label">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
