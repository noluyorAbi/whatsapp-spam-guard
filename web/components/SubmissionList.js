'use client';

import { useState, useEffect } from 'react';

const STATUS_COLORS = {
  pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  approved: 'bg-green-900/50 text-green-400 border-green-800',
  dismissed: 'bg-gray-800 text-gray-500 border-gray-700',
};

export default function SubmissionList({ onAddRule }) {
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchSubmissions() {
    const res = await fetch(`/api/submissions?status=${filter}`);
    const data = await res.json();
    if (Array.isArray(data)) setSubmissions(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  async function dismiss(id) {
    await fetch('/api/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'dismissed' }),
    });
    fetchSubmissions();
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Submissions</h2>
        <div className="flex gap-1">
          {['pending', 'approved', 'dismissed', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-lg" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No {filter === 'all' ? '' : filter} submissions.</p>
      ) : (
        <div className="space-y-2">
          {submissions.map((sub) => (
            <div key={sub.id} className="border border-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                className="w-full p-4 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-sm truncate">
                      {sub.message_text.substring(0, 100)}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {new Date(sub.created_at).toLocaleString()}
                      {sub.submitted_by && ` · by ${sub.submitted_by}`}
                    </p>
                  </div>
                  <span className={`ml-3 px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[sub.status]}`}>
                    {sub.status}
                  </span>
                </div>
              </button>

              {expandedId === sub.id && (
                <div className="px-4 pb-4 border-t border-gray-800">
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap mt-3 p-3 bg-gray-800 rounded-lg max-h-64 overflow-y-auto">
                    {sub.message_text}
                  </pre>

                  {sub.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onAddRule(sub)}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Add to Rules
                      </button>
                      <button
                        onClick={() => dismiss(sub.id)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
