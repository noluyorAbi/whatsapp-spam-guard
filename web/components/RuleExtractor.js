'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { extractDomains, extractKeywords } from '@/lib/extract-rules';

const CATEGORIES = ['trading', 'adult', 'gambling', 'academic', 'other'];

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
      await supabase.from('custom_rules').insert(rules);
    }

    await supabase
      .from('submissions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', submission.id);

    setSaving(false);
    onDone();
  }

  const totalSelected = selectedDomains.size + selectedKeywords.size;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Extract Rules</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  category === c
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {domains.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-300 mb-2">Domains found</p>
            <div className="space-y-1">
              {domains.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDomains.has(d)}
                    onChange={() => toggleDomain(d)}
                    className="rounded border-gray-600"
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>
        )}

        {keywords.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-300 mb-2">Keywords found</p>
            <div className="space-y-1">
              {keywords.map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedKeywords.has(k)}
                    onChange={() => toggleKeyword(k)}
                    className="rounded border-gray-600"
                  />
                  {k}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-300 mb-2">Add custom keyword</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomKeyword())}
              placeholder="e.g. exam help"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={addCustomKeyword}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {domains.length === 0 && keywords.length === 0 && (
          <p className="text-gray-500 text-sm mb-4">No domains or keywords auto-detected. Add custom keywords above.</p>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || totalSelected === 0}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : `Add ${totalSelected} Rule${totalSelected !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
