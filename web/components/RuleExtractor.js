'use client';

import { useState, useEffect } from 'react';
import { extractDomains, extractKeywords } from '@/lib/extract-rules';

const CATEGORIES = ['trading', 'adult', 'gambling', 'academic', 'other'];

const CATEGORY_CHIPS = {
  trading: 'bg-secondary/10 text-secondary',
  adult: 'bg-danger/10 text-danger',
  gambling: 'bg-tertiary/10 text-tertiary',
  academic: 'bg-primary/10 text-primary',
  other: 'bg-surface-container-highest text-on-surface-variant',
};

export default function RuleExtractor({ submission, onClose, onDone }) {
  const [domains, setDomains] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState(new Set());
  const [selectedKeywords, setSelectedKeywords] = useState(new Set());
  const [category, setCategory] = useState('academic');
  const [customKeyword, setCustomKeyword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d = extractDomains(submission.message_text);
    const k = extractKeywords(submission.message_text);
    setDomains(d);
    setKeywords(k);
    setSelectedDomains(new Set(d));
    setSelectedKeywords(new Set(k));
  }, [submission]);

  function toggleDomain(d) {
    const next = new Set(selectedDomains);
    next.has(d) ? next.delete(d) : next.add(d);
    setSelectedDomains(next);
  }

  function toggleKeyword(k) {
    const next = new Set(selectedKeywords);
    next.has(k) ? next.delete(k) : next.add(k);
    setSelectedKeywords(next);
  }

  function addCustomKeyword() {
    if (!customKeyword.trim()) return;
    const k = customKeyword.trim();
    setKeywords((prev) => [...prev, k]);
    setSelectedKeywords((prev) => new Set([...prev, k]));
    setCustomKeyword('');
  }

  async function handleSave() {
    setSaving(true);

    const rules = [];
    for (const d of selectedDomains) {
      rules.push({
        type: 'domain',
        value: d,
        category,
        source_submission_id: submission.id,
      });
    }
    for (const k of selectedKeywords) {
      rules.push({
        type: 'keyword',
        value: `\\b${k.replace(/\s+/g, '\\s*')}\\b`,
        category,
        source_submission_id: submission.id,
      });
    }

    if (rules.length > 0) {
      await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });
    }

    await fetch('/api/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: submission.id, status: 'approved' }),
    });

    setSaving(false);
    onDone();
  }

  const totalSelected = selectedDomains.size + selectedKeywords.size;

  return (
    <div className="fixed inset-0 bg-surface/70 backdrop-blur-xl flex items-center justify-center p-4 z-50">
      <div className="bg-surface-container-low rounded-[2rem] max-w-lg w-full max-h-[80vh] overflow-y-auto p-8 shadow-2xl shadow-black/30">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">shield</span>
          </div>
          <div>
            <h3 className="font-headline text-xl font-bold text-on-surface">Extract New Security Rule</h3>
            <p className="text-on-surface-variant text-xs">Define conditions from the reported message</p>
          </div>
        </div>

        {/* Rule Signature / Category */}
        <div className="mb-6">
          <label className="sentinel-label block mb-3">Rule Signature</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  category === c
                    ? CATEGORY_CHIPS[c] + ' ring-1 ring-current'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Conditions: Domains */}
        {domains.length > 0 && (
          <div className="mb-6">
            <label className="sentinel-label block mb-3">Domain Conditions</label>
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDomain(d)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-data transition-all ${
                    selectedDomains.has(d)
                      ? 'bg-secondary/10 text-secondary ring-1 ring-secondary/30'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {selectedDomains.has(d) ? 'check_circle' : 'circle'}
                  </span>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conditions: Keywords */}
        {keywords.length > 0 && (
          <div className="mb-6">
            <label className="sentinel-label block mb-3">Pattern Conditions</label>
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <button
                  key={k}
                  onClick={() => toggleKeyword(k)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-data transition-all ${
                    selectedKeywords.has(k)
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {selectedKeywords.has(k) ? 'check_circle' : 'circle'}
                  </span>
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add custom condition */}
        <div className="mb-6">
          <label className="sentinel-label block mb-3">Add Custom Condition</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomKeyword())}
              placeholder="e.g. exam help"
              className="stealth-input flex-1"
            />
            <button
              onClick={addCustomKeyword}
              className="btn-ghost text-sm py-2 px-4 flex items-center gap-1.5 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add
            </button>
          </div>
        </div>

        {domains.length === 0 && keywords.length === 0 && (
          <div className="text-center py-4 mb-4">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">search_off</span>
            <p className="text-on-surface-variant text-sm">No domains or keywords auto-detected. Add custom conditions above.</p>
          </div>
        )}

        {/* Action dropdown */}
        <div className="mb-8">
          <label className="sentinel-label block mb-3">Action</label>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">gavel</span>
            <select className="stealth-input appearance-none cursor-pointer">
              <option value="block">Block Message</option>
              <option value="warn">Warn Sender</option>
              <option value="flag">Flag for Review</option>
            </select>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-ghost text-sm py-2.5 px-5 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">close</span>
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving || totalSelected === 0}
            className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">publish</span>
            {saving ? 'Publishing...' : `Publish Rule${totalSelected !== 1 ? 's' : ''} (${totalSelected})`}
          </button>
        </div>
      </div>
    </div>
  );
}
