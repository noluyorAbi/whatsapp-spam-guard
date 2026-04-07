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
    return <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-32" />;
  }

  if (!status) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-500">No bot status data available. Start the bot to see status.</p>
      </div>
    );
  }

  const lastUpdate = new Date(status.updated_at);
  const secondsAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
  const isConnected = status.status === 'connected' && secondsAgo < 90;
  const isWaitingForQr = status.status === 'waiting_for_qr' && status.qr_code && secondsAgo < 120;

  // QR code view
  if (isWaitingForQr) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Bot Status</h2>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-900/50 text-yellow-400 border border-yellow-800">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Waiting for QR Scan
          </span>
        </div>

        <div className="flex flex-col items-center gap-4 py-4">
          <p className="text-gray-400 text-sm text-center">
            Scan this QR code with WhatsApp to connect the bot
          </p>
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={status.qr_code} size={256} />
          </div>
          <p className="text-gray-600 text-xs">
            Open WhatsApp → Settings → Linked Devices → Link a Device
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Bot Status</h2>
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
          isConnected
            ? 'bg-green-900/50 text-green-400 border border-green-800'
            : 'bg-red-900/50 text-red-400 border border-red-800'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Last Heartbeat</p>
          <p className="text-white font-mono">{secondsAgo}s ago</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Last Message</p>
          <p className="text-white font-mono">
            {status.last_message_at
              ? new Date(status.last_message_at).toLocaleTimeString()
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Messages Analyzed</p>
          <p className="text-white text-xl font-bold">{status.messages_processed}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Spam Blocked</p>
          <p className="text-red-400 text-xl font-bold">{status.spam_blocked}</p>
        </div>
      </div>
    </div>
  );
}
