'use client';

import { useState } from 'react';

export default function SubmissionForm() {
  const [messageText, setMessageText] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!messageText.trim()) return;

    setStatus('submitting');
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message_text: messageText.trim(),
        submitted_by: submittedBy.trim() || null,
      }),
    });

    if (!res.ok) {
      setStatus('error');
    } else {
      setStatus('success');
      setMessageText('');
      setSubmittedBy('');
      setLinkUrl('');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Group Name */}
      <div>
        <label htmlFor="submittedBy" className="sentinel-label block mb-3">
          Group Name
        </label>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">group</span>
          <input
            id="submittedBy"
            type="text"
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            placeholder="e.g. CS 101 Study Group"
            className="stealth-input"
          />
        </div>
      </div>

      {/* Spam Message Text */}
      <div>
        <label htmlFor="message" className="sentinel-label block mb-3">
          Spam Message Text
        </label>
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-xl mt-1">chat_bubble</span>
          <textarea
            id="message"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={5}
            required
            placeholder="Paste the full spam message here..."
            className="stealth-input resize-y"
          />
        </div>
      </div>

      {/* Link/URL */}
      <div>
        <label htmlFor="linkUrl" className="sentinel-label block mb-3">
          Link / URL <span className="text-on-surface-variant/50 normal-case tracking-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">link</span>
          <input
            id="linkUrl"
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://suspicious-link.com"
            className="stealth-input"
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={status === 'submitting' || !messageText.trim()}
        className="btn-primary w-full flex items-center justify-center gap-2 text-base"
      >
        <span className="material-symbols-outlined text-xl">send</span>
        {status === 'submitting' ? 'Submitting...' : 'Submit Security Report'}
      </button>

      {status === 'success' && (
        <div className="flex items-center justify-center gap-2 text-primary text-sm">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          Report submitted successfully. Thank you for keeping the community safe.
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center justify-center gap-2 text-tertiary text-sm">
          <span className="material-symbols-outlined text-lg">error</span>
          Something went wrong. Please try again.
        </div>
      )}
    </form>
  );
}
