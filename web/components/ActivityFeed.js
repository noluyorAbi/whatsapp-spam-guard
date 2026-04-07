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
  return d.toLocaleDateString();
}

function truncate(str, len) {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function SpamRow({ entry }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="group flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-high/50 transition-colors">
      {/* Icon circle */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-danger/15 flex items-center justify-center mt-0.5">
        <span className="material-symbols-outlined text-danger text-base">block</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-data text-[10px] text-on-surface-variant">{formatTimestamp(entry.created_at)}</span>

          {/* Status chip */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger/10 text-danger text-[10px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[11px]">shield</span>
            Blocked
          </span>

          {/* Classification chip */}
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

        {/* Message preview */}
        <p className="text-on-surface text-sm mb-1">{truncate(entry.message_text, 80)}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap text-[11px] text-on-surface-variant">
          {entry.sender_id && (
            <span className="font-data">
              <span className="text-on-surface-variant/50 mr-1">from</span>
              {entry.sender_id}
            </span>
          )}
          {entry.group_id && (
            <span className="font-data">
              <span className="text-on-surface-variant/50 mr-1">in</span>
              {entry.group_name || entry.group_id}
            </span>
          )}
          {entry.matched_rule && (
            <span className="text-on-surface-variant/70">
              rule: <span className="text-on-surface-variant font-medium">{truncate(entry.matched_rule, 50)}</span>
            </span>
          )}
        </div>

        {/* Expanded details */}
        {showDetails && (
          <div className="mt-2 p-3 rounded-lg bg-surface-container-highest/40 text-[11px] space-y-1">
            <div><span className="text-on-surface-variant/60 uppercase tracking-wider">Message:</span> <span className="font-data text-on-surface">{entry.message_text}</span></div>
            {entry.matched_rule && <div><span className="text-on-surface-variant/60 uppercase tracking-wider">Rule:</span> <span className="font-data text-on-surface">{entry.matched_rule}</span></div>}
            {entry.sender_id && <div><span className="text-on-surface-variant/60 uppercase tracking-wider">Sender:</span> <span className="font-data text-on-surface">{entry.sender_id}</span></div>}
            {entry.group_id && <div><span className="text-on-surface-variant/60 uppercase tracking-wider">Group ID:</span> <span className="font-data text-on-surface">{entry.group_id}</span></div>}
            <div><span className="text-on-surface-variant/60 uppercase tracking-wider">Action:</span> <span className="font-data text-on-surface">{entry.action_taken}</span></div>
          </div>
        )}
      </div>

      {/* Details button — appears on hover */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="shrink-0 px-2 py-1 rounded-lg text-[10px] font-medium text-on-surface-variant border border-surface-container-highest/60 hover:text-on-surface hover:border-primary/40 transition-all opacity-0 group-hover:opacity-100"
      >
        {showDetails ? 'Hide' : 'Details'}
      </button>
    </div>
  );
}

export default function ActivityFeed() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'critical'
  const [error, setError] = useState(null);

  async function fetchFeed() {
    try {
      const res = await fetch('/api/spam-log?limit=50');
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
  }, []);

  const displayed = filter === 'critical'
    ? entries.filter((e) => !e.was_ai_classified)
    : entries;

  return (
    <div className="bg-surface-container rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg">analytics</span>
          </div>
          <div>
            <h2 className="font-headline text-base font-bold text-on-surface">Live Protocol Feed</h2>
            <p className="text-on-surface-variant text-[11px]">Real-time spam interception events</p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
              filter === 'all'
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
              filter === 'critical'
                ? 'bg-danger/10 text-danger'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Critical Only
          </button>
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
          <p className="text-on-surface-variant/50 text-xs mt-1">Events will appear here as spam is detected</p>
        </div>
      ) : (
        <div className="space-y-1">
          {displayed.map((entry) => (
            <SpamRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-surface-container-highest/30 flex items-center justify-between">
        <span className="text-on-surface-variant text-[11px]">
          {displayed.length} event{displayed.length !== 1 ? 's' : ''} shown · auto-refreshes every 15s
        </span>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-on-surface-variant border border-surface-container-highest/50 hover:text-on-surface hover:border-primary/30 transition-all">
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          View Full Transaction Logs
        </button>
      </div>
    </div>
  );
}
