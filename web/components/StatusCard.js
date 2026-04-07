'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function StatusCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    const { data, error } = await supabase
      .from('bot_status')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      setStatus(null);
    } else {
      setStatus(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-32" />;
  }

  if (!status) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-500">No bot status data available.</p>
      </div>
    );
  }

  const lastUpdate = new Date(status.updated_at);
  const secondsAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
  const isConnected = status.status === 'connected' && secondsAgo < 90;

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
