'use client';

import { useState, useEffect } from 'react';
import { WhatsAppText } from '@/lib/whatsapp-format';

const PRIORITY_MAP = {
  pending: { label: 'Analysis Pending', color: 'bg-secondary/10 text-secondary' },
  approved: { label: 'High Certainty', color: 'bg-primary/10 text-primary' },
  dismissed: { label: 'Low Priority', color: 'bg-tertiary/10 text-tertiary' },
};

export default function SubmissionList({ onAddRule, refreshKey }) {
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
  }, [filter, refreshKey]);

  async function dismiss(id) {
    await fetch('/api/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'dismissed' }),
    });
    fetchSubmissions();
  }

  async function resetToPending(id) {
    await fetch('/api/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'pending' }),
    });
    fetchSubmissions();
  }

  return (
    <div className="bg-surface-container rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <h2 className="font-headline text-lg font-semibold text-on-surface">Submissions</h2>
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold font-data">
            {submissions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-xl">filter_list</span>
          </button>
          <div className="flex gap-1 bg-surface-container-low rounded-lg p-1 overflow-x-auto">
            {['pending', 'approved', 'dismissed', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-3 pb-3">
        {loading ? (
          <div className="space-y-2 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface-container-high rounded-xl animate-pulse" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">inbox</span>
            <p className="text-on-surface-variant text-sm">No {filter === 'all' ? '' : filter} submissions.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {submissions.map((sub) => {
              const priority = PRIORITY_MAP[sub.status] || PRIORITY_MAP.pending;
              const isActive = expandedId === sub.id;

              return (
                <div
                  key={sub.id}
                  className={`rounded-xl overflow-hidden transition-all duration-200 hover:translate-x-1 ${
                    isActive
                      ? 'bg-surface-container-high ring-1 ring-primary/20 border-l-2 border-l-primary'
                      : 'hover:bg-surface-container-high/50'
                  }`}
                >
                  <button
                    onClick={() => setExpandedId(isActive ? null : sub.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priority.color}`}>
                            {priority.label}
                          </span>
                        </div>
                        <p className="text-on-surface text-sm font-medium truncate mb-1">
                          {sub.message_text.substring(0, 80)}
                        </p>
                        <p className="text-on-surface-variant text-xs">
                          {new Date(sub.created_at).toLocaleString()}
                          {sub.submitted_by && (
                            <span className="ml-2 text-on-surface-variant/60">
                              <span className="material-symbols-outlined text-xs align-middle">person</span> {sub.submitted_by}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-lg mt-1">
                        {isActive ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                  </button>

                  {isActive && (
                    <div className="px-4 pb-4">
                      <div className="text-on-surface text-sm whitespace-pre-wrap p-4 bg-surface-container-low rounded-xl max-h-64 overflow-y-auto leading-relaxed">
                        <WhatsAppText text={sub.message_text} />
                      </div>

                      {sub.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => onAddRule(sub)}
                            className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-lg">gavel</span>
                            Add to Rules
                          </button>
                          <button
                            onClick={() => dismiss(sub.id)}
                            className="btn-ghost text-sm py-2.5 px-5 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-lg">close</span>
                            Dismiss
                          </button>
                        </div>
                      )}

                      {(sub.status === 'approved' || sub.status === 'dismissed') && (
                        <div className="flex items-center justify-between mt-4 px-3 py-2 rounded-lg bg-surface-container-low">
                          <span className="text-on-surface-variant text-xs flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">
                              {sub.status === 'approved' ? 'check_circle' : 'cancel'}
                            </span>
                            {sub.status === 'approved' ? 'Approved — rules extracted' : 'Dismissed'}
                            {sub.reviewed_at && ` · ${new Date(sub.reviewed_at).toLocaleString()}`}
                          </span>
                          <button
                            onClick={() => resetToPending(sub.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-secondary/10 transition-all text-[11px] font-medium"
                          >
                            <span className="material-symbols-outlined text-sm">undo</span>
                            Undo
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
