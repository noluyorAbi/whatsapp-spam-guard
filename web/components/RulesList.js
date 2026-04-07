'use client';

import { useState, useEffect } from 'react';

const CATEGORY_CHIPS = {
  trading: 'bg-secondary/10 text-secondary',
  adult: 'bg-danger/10 text-danger',
  gambling: 'bg-tertiary/10 text-tertiary',
  academic: 'bg-primary/10 text-primary',
  other: 'bg-surface-container-highest text-on-surface-variant',
};

export default function RulesList({ refreshKey }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [unicodeNorm, setUnicodeNorm] = useState(true);

  async function fetchRules() {
    const res = await fetch('/api/rules');
    const data = await res.json();
    if (Array.isArray(data)) setRules(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchRules();
  }, [refreshKey]);

  async function deleteRule(id) {
    await fetch('/api/rules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchRules();
  }

  return (
    <div className="bg-surface-container rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-2">
            <span className="material-symbols-outlined text-sm">tune</span>
            Protocol Configuration
          </span>
          <h2 className="font-headline text-xl font-bold text-on-surface">
            Rule Management
            <span className="text-on-surface-variant font-normal text-sm ml-2 font-data">({rules.length})</span>
          </h2>
        </div>
        <button className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-lg">add</span>
          Add Rule
        </button>
      </div>

      {/* Toggle cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="bg-surface-container-high rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">psychology</span>
            <div>
              <p className="text-on-surface text-sm font-medium">AI Fallback Enabled</p>
              <p className="text-on-surface-variant text-xs">Use AI when no rule matches</p>
            </div>
          </div>
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`toggle-switch ${aiEnabled ? 'active' : ''}`}
          />
        </div>
        <div className="bg-surface-container-high rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">translate</span>
            <div>
              <p className="text-on-surface text-sm font-medium">Unicode Normalization Active</p>
              <p className="text-on-surface-variant text-xs">Normalize Unicode in messages</p>
            </div>
          </div>
          <button
            onClick={() => setUnicodeNorm(!unicodeNorm)}
            className={`toggle-switch ${unicodeNorm ? 'active' : ''}`}
          />
        </div>
      </div>

      {/* Rules table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-12 bg-surface-container-high rounded-xl animate-pulse" />)}
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">gavel</span>
          <p className="text-on-surface-variant text-sm">No custom rules yet. Approve submissions to add rules.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-surface-container-high/50">
            <span className="col-span-5 sentinel-label">Pattern</span>
            <span className="col-span-2 sentinel-label">Category</span>
            <span className="col-span-2 sentinel-label">Action</span>
            <span className="col-span-2 sentinel-label">Date Added</span>
            <span className="col-span-1 sentinel-label text-right">Actions</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-surface-container-highest/30">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-surface-container-high/30 transition-colors group"
              >
                <div className="col-span-5 flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    rule.type === 'domain'
                      ? 'bg-secondary/10 text-secondary'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {rule.type}
                  </span>
                  <span className="font-data text-on-surface text-sm truncate">{rule.value}</span>
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    CATEGORY_CHIPS[rule.category] || CATEGORY_CHIPS.other
                  }`}>
                    {rule.category}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-on-surface-variant text-sm">Block</span>
                </div>
                <div className="col-span-2">
                  <span className="font-data text-on-surface-variant text-xs">
                    {rule.created_at ? new Date(rule.created_at).toLocaleDateString() : '---'}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1.5 rounded-lg text-on-surface-variant/40 hover:text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
