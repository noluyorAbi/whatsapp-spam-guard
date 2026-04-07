'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SubmissionForm() {
  const [messageText, setMessageText] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!messageText.trim()) return;

    setStatus('submitting');
    const { error } = await supabase.from('submissions').insert({
      message_text: messageText.trim(),
      submitted_by: submittedBy.trim() || null,
    });

    if (error) {
      console.error('Submission failed:', error);
      setStatus('error');
    } else {
      setStatus('success');
      setMessageText('');
      setSubmittedBy('');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
          Paste the spam message
        </label>
        <textarea
          id="message"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={6}
          required
          placeholder="Paste the full spam message here..."
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-y"
        />
      </div>

      <div>
        <label htmlFor="submittedBy" className="block text-sm font-medium text-gray-300 mb-1">
          Your name or email <span className="text-gray-500">(optional)</span>
        </label>
        <input
          id="submittedBy"
          type="text"
          value={submittedBy}
          onChange={(e) => setSubmittedBy(e.target.value)}
          placeholder="So we can follow up if needed"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting' || !messageText.trim()}
        className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors"
      >
        {status === 'submitting' ? 'Submitting...' : 'Report Spam'}
      </button>

      {status === 'success' && (
        <p className="text-green-400 text-sm text-center">Thanks! Your report has been submitted for review.</p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm text-center">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
