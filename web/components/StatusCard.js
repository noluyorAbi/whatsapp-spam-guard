'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function StatusCard({ onNavigate }) {
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
      icon: 'block',
      label: 'Spam Blocked',
      value: status.spam_blocked ?? 0,
      accent: 'bg-tertiary',
      clickable: true,
      tab: 'stats',
    },
    {
      icon: 'verified',
      label: 'Confirmed',
      value: status.confirmed_spam ?? 0,
      accent: 'bg-primary',
      clickable: true,
      tab: 'stats',
    },
    {
      icon: 'flag',
      label: 'False Positives',
      value: status.false_positives ?? 0,
      accent: 'bg-secondary',
      clickable: true,
      tab: 'stats',
    },
    {
      icon: 'forum',
      label: 'Messages Scanned',
      value: status.messages_processed ?? 0,
      accent: 'bg-primary',
      clickable: false,
    },
  ];

  // Timeline chart data
  const timeline = status.timeline || [];
  const hourlyDist = status.hourly_distribution || new Array(24).fill(0);
  const maxHourly = Math.max(...hourlyDist, 1);

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
          <div
            key={stat.label}
            onClick={stat.clickable && onNavigate ? () => onNavigate(stat.tab) : undefined}
            className={`bg-surface-container rounded-2xl p-5 relative overflow-hidden transition-all ${
              stat.clickable ? 'cursor-pointer hover:bg-surface-container-high hover:scale-[1.02] group' : ''
            }`}
          >
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${stat.accent}`} />
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">{stat.icon}</span>
              </div>
              {stat.clickable && (
                <span className="material-symbols-outlined text-on-surface-variant/30 text-lg group-hover:text-primary transition-colors">
                  arrow_forward
                </span>
              )}
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface mb-1">{stat.value}</p>
            <p className="sentinel-label">{stat.label}</p>
            {stat.clickable && (
              <p className="text-on-surface-variant/40 text-[10px] mt-1 group-hover:text-primary/60 transition-colors">Click to view details</p>
            )}
          </div>
        ))}
      </div>

      {/* Analytics section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Timeline chart */}
        <div className="bg-surface-container rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-lg">timeline</span>
            <h3 className="font-headline text-sm font-semibold text-on-surface">Spam Timeline</h3>
            <span className="text-on-surface-variant text-[10px] ml-auto">{timeline.length > 0 ? 'Last 30 days' : 'No data yet'}</span>
          </div>
          {timeline.length > 0 ? (
            <div className="flex items-end gap-1 h-24">
              {timeline.map((day) => {
                const maxVal = Math.max(...timeline.map(d => d.total), 1);
                const height = Math.max((day.total / maxVal) * 100, 4);
                const aiPct = day.ai / (day.total || 1) * 100;
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-0.5 group relative"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest px-2 py-1 rounded text-[9px] text-on-surface whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      {day.date.slice(5)}: {day.total} blocked ({day.rule} rule, {day.ai} AI)
                    </div>
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-danger/60 to-danger/30 hover:from-danger/80 hover:to-danger/50 transition-all cursor-pointer"
                      style={{ height: `${height}%`, minHeight: '3px' }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 text-on-surface-variant/30 text-xs">
              Chart will appear when spam is detected
            </div>
          )}
        </div>

        {/* Hourly distribution */}
        <div className="bg-surface-container rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-secondary text-lg">schedule</span>
            <h3 className="font-headline text-sm font-semibold text-on-surface">Peak Spam Hours</h3>
            <span className="text-on-surface-variant text-[10px] ml-auto">24h distribution</span>
          </div>
          {status.total_events > 0 ? (
            <div className="flex items-end gap-px h-24">
              {hourlyDist.map((count, hour) => {
                const height = Math.max((count / maxHourly) * 100, 2);
                const isPeak = count === maxHourly && count > 0;
                return (
                  <div
                    key={hour}
                    className="flex-1 flex flex-col items-center group relative"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest px-2 py-1 rounded text-[9px] text-on-surface whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      {hour.toString().padStart(2, '0')}:00 — {count} event{count !== 1 ? 's' : ''}
                    </div>
                    <div
                      className={`w-full rounded-t transition-all cursor-pointer ${
                        isPeak
                          ? 'bg-secondary hover:bg-secondary/80'
                          : count > 0
                            ? 'bg-secondary/40 hover:bg-secondary/60'
                            : 'bg-surface-container-high'
                      }`}
                      style={{ height: `${height}%`, minHeight: '2px' }}
                    />
                    {hour % 6 === 0 && (
                      <span className="text-[8px] text-on-surface-variant/50 mt-1 font-data">{hour}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 text-on-surface-variant/30 text-xs">
              Chart will appear when spam is detected
            </div>
          )}
        </div>
      </div>

      {/* Detection breakdown */}
      {(status.spam_blocked ?? 0) > 0 && (
        <div className="bg-surface-container rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-lg">pie_chart</span>
            <h3 className="font-headline text-sm font-semibold text-on-surface">Detection Breakdown</h3>
          </div>
          <div className="flex items-center gap-6">
            {/* Mini donut-style bars */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-danger" />
                    Blocked (pending review)
                  </span>
                  <span className="font-data text-on-surface">{(status.spam_blocked ?? 0) - (status.confirmed_spam ?? 0) - (status.false_positives ?? 0)}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-danger rounded-full transition-all"
                    style={{ width: `${(((status.spam_blocked ?? 0) - (status.confirmed_spam ?? 0) - (status.false_positives ?? 0)) / (status.spam_blocked || 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Confirmed spam
                  </span>
                  <span className="font-data text-on-surface">{status.confirmed_spam ?? 0}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${((status.confirmed_spam ?? 0) / (status.spam_blocked || 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    False positives
                  </span>
                  <span className="font-data text-on-surface">{status.false_positives ?? 0}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{ width: `${((status.false_positives ?? 0) / (status.spam_blocked || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Accuracy stat */}
            <div className="text-center px-4">
              <p className="font-headline text-3xl font-bold text-primary">
                {(status.confirmed_spam ?? 0) > 0
                  ? Math.round(((status.confirmed_spam ?? 0) / ((status.confirmed_spam ?? 0) + (status.false_positives ?? 0) || 1)) * 100)
                  : '—'}
                {(status.confirmed_spam ?? 0) > 0 && <span className="text-lg">%</span>}
              </p>
              <p className="sentinel-label mt-1">Accuracy</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
