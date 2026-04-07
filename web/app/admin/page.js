'use client';

import { useState } from 'react';
import StatusCard from '@/components/StatusCard';
import SubmissionList from '@/components/SubmissionList';
import RuleExtractor from '@/components/RuleExtractor';
import RulesList from '@/components/RulesList';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractSub, setExtractSub] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      setAuthed(true);
    } else {
      setError(true);
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
            >
              Login
            </button>
            {error && <p className="text-red-400 text-sm text-center">Wrong password.</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">🛡️ Spam Guard Admin</h1>
        <button
          onClick={() => setAuthed(false)}
          className="text-gray-500 hover:text-gray-300 text-sm"
        >
          Logout
        </button>
      </div>

      <StatusCard />

      <div className="mt-6">
        <SubmissionList onAddRule={(sub) => setExtractSub(sub)} />
      </div>

      <div className="mt-6">
        <RulesList refreshKey={refreshKey} />
      </div>

      {extractSub && (
        <RuleExtractor
          submission={extractSub}
          onClose={() => setExtractSub(null)}
          onDone={() => {
            setExtractSub(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </main>
  );
}
