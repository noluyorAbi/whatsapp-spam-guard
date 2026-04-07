'use client';

import { useState, useEffect } from 'react';

function formatTimestamp(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

function truncate(str, len) {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

const STATUS_STYLES = {
  blocked: { bg: 'bg-danger/10', text: 'text-danger', label: 'Blocked', icon: 'block' },
  false_positive: { bg: 'bg-secondary/10', text: 'text-secondary', label: 'Not Spam', icon: 'check_circle' },
  confirmed: { bg: 'bg-primary/10', text: 'text-primary', label: 'Confirmed', icon: 'verified' },
};

function SpamRow({ entry, onStatusChange, isExpanded, onToggle }) {
  const [reviewNote, setReviewNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const statusStyle = STATUS_STYLES[entry.status] || STATUS_STYLES.blocked;

  async function handleStatusChange(newStatus) {
    setUpdating(true);
    await onStatusChange(entry.id, newStatus, reviewNote);
    setUpdating(false);
    setReviewNote('');
  }

  return (
    <div className={`rounded-xl overflow-hidden transition-all duration-200 ${
      isExpanded ? 'bg-surface-container-high ring-1 ring-primary/20' : 'hover:bg-surface-container-high/50'
    }`}>
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-4 py-3 text-left"
      >
        {/* Icon */}
        <div className={`shrink-0 w-9 h-9 rounded-full ${statusStyle.bg} flex items-center justify-center mt-0.5`}>
          <span className={`material-symbols-outlined ${statusStyle.text} text-lg`}>{statusStyle.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-data text-[10px] text-on-surface-variant">{formatTimestamp(entry.created_at)}</span>

            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text} text-[10px] font-bold uppercase tracking-wider`}>
              {statusStyle.label}
            </span>

            {entry.was_ai_classified ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[11px]">psychology</span>
                AI
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[11px]">rule</span>
                Rule
              </span>
            )}
          </div>

          <p className="text-on-surface text-sm mb-1">{truncate(entry.message_text, 80)}</p>

          <div className="flex items-center gap-3 flex-wrap text-[11px] text-on-surface-variant">
            {entry.sender_id && (
              <span className="font-data">
                <span className="text-on-surface-variant/50 mr-1">from</span>
                {truncate(entry.sender_id, 20)}
              </span>
            )}
            {entry.group_id && (
              <span className="font-data">
                <span className="text-on-surface-variant/50 mr-1">in</span>
                {truncate(entry.group_name || entry.group_id, 25)}
              </span>
            )}
          </div>
        </div>

        <span className="material-symbols-outlined text-on-surface-variant text-lg shrink-0 mt-1">
          {isExpanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Expanded detail view */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Full message */}
          <div>
            <label className="sentinel-label block mb-2">Full Message</label>
            <pre className="text-on-surface text-sm whitespace-pre-wrap p-4 bg-surface-container-low rounded-xl max-h-48 overflow-y-auto font-data text-xs leading-relaxed border-l-2 border-danger/50">
              {entry.message_text}
            </pre>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface-container-low rounded-lg p-3">
              <span className="sentinel-label block mb-1">Matched Rule</span>
              <p className="font-data text-on-surface text-xs">{entry.matched_rule || '—'}</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-3">
              <span className="sentinel-label block mb-1">Detection</span>
              <p className="text-on-surface text-xs font-medium">{entry.was_ai_classified ? 'AI Classifier' : 'Rule Engine'}</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-3">
              <span className="sentinel-label block mb-1">Sender ID</span>
              <p className="font-data text-on-surface text-xs break-all">{entry.sender_id || '—'}</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-3">
              <span className="sentinel-label block mb-1">Group</span>
              <p className="font-data text-on-surface text-xs break-all">{entry.group_name || entry.group_id || '—'}</p>
            </div>
          </div>

          {/* Review note (if already reviewed) */}
          {entry.reviewed_at && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low text-xs">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">rate_review</span>
              <span className="text-on-surface-variant">
                Reviewed {formatTimestamp(entry.reviewed_at)}
                {entry.review_note && `: "${entry.review_note}"`}
              </span>
            </div>
          )}

          {/* Actions */}
          {entry.status === 'blocked' && (
            <div className="space-y-3">
              <div>
                <label className="sentinel-label block mb-2">Review Note (optional)</label>
                <input
                  type="text"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="e.g. This was a legitimate student message"
                  className="stealth-input text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange('false_positive')}
                  disabled={updating}
                  className="btn-ghost text-sm py-2 px-4 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg text-secondary">undo</span>
                  {updating ? 'Saving...' : 'Not Spam (False Positive)'}
                </button>
                <button
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={updating}
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">verified</span>
                  {updating ? 'Saving...' : 'Confirm Spam'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivityFeed() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState(null);

  async function fetchFeed() {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/spam-log?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  async function handleStatusChange(id, status, reviewNote) {
    await fetch('/api/spam-log', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, review_note: reviewNote }),
    });
    fetchFeed();
  }

  const displayed = filter === 'critical'
    ? entries.filter((e) => !e.was_ai_classified)
    : entries;

  return (
    <div className="bg-surface-container rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg">analytics</span>
          </div>
          <div>
            <h2 className="font-headline text-base font-bold text-on-surface">Live Protocol Feed</h2>
            <p className="text-on-surface-variant text-[11px]">Real-time spam interception events</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'blocked', label: 'Blocked' },
              { key: 'false_positive', label: 'Not Spam' },
              { key: 'confirmed', label: 'Confirmed' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  statusFilter === f.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Detection type filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                filter === 'all' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                filter === 'critical' ? 'bg-danger/10 text-danger' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Rule Only
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface-container-high rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-3xl text-danger/40 mb-2 block">error</span>
          <p className="text-on-surface-variant text-sm">Failed to load feed: {error}</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-10">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-3 block">shield_with_heart</span>
          <p className="text-on-surface-variant text-sm font-medium">No spam events recorded yet</p>
          <p className="text-on-surface-variant/50 text-xs mt-1">Events will appear here as spam is detected and logged by the bot</p>
        </div>
      ) : (
        <div className="space-y-1">
          {displayed.map((entry) => (
            <SpamRow
              key={entry.id}
              entry={entry}
              isExpanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-surface-container-highest/30 flex items-center justify-between">
        <span className="text-on-surface-variant text-[11px]">
          {displayed.length} event{displayed.length !== 1 ? 's' : ''} shown · auto-refreshes every 15s
        </span>
        <button
          onClick={fetchFeed}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-on-surface-variant border border-surface-container-highest/50 hover:text-on-surface hover:border-primary/30 transition-all"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh
        </button>
      </div>
    </div>
  );
}
