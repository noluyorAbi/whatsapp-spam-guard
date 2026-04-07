'use client';

import { useState, useEffect } from 'react';

const CATEGORY_COLORS = {
  trading: 'text-yellow-400',
  adult: 'text-red-400',
  gambling: 'text-purple-400',
  academic: 'text-blue-400',
  other: 'text-gray-400',
};

export default function RulesList({ refreshKey }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">
        Custom Rules <span className="text-gray-500 font-normal text-sm">({rules.length})</span>
      </h2>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-10 bg-gray-800 rounded-lg" />)}
        </div>
      ) : rules.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No custom rules yet. Approve submissions to add rules.</p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  rule.type === 'domain' ? 'bg-orange-900/50 text-orange-400' : 'bg-indigo-900/50 text-indigo-400'
                }`}>
                  {rule.type}
                </span>
                <span className="text-gray-300 text-sm truncate font-mono">{rule.value}</span>
                <span className={`text-xs ${CATEGORY_COLORS[rule.category] || 'text-gray-400'}`}>
                  {rule.category}
                </span>
              </div>
              <button
                onClick={() => deleteRule(rule.id)}
                className="text-gray-600 hover:text-red-400 text-sm ml-2 transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
