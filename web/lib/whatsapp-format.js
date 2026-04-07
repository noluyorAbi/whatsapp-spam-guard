import React from 'react';

// Render WhatsApp-style formatting: *bold*, _italic_, ~strikethrough~, `code`, ```monospace```
export function WhatsAppText({ text, className = '' }) {
  if (!text) return <span className={className}>—</span>;

  const parts = [];
  let key = 0;

  // Extract ```monospace blocks``` first
  const monoBlockRegex = /```([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = monoBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'mono', content: match[1] });
    lastIndex = monoBlockRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  function renderInline(str) {
    const tokens = [];
    // Match `code`, *bold*, _italic_, ~strike~ — non-greedy, no newlines
    const inlineRegex = /`([^`\n]+)`|\*([^*\n]+)\*|_([^_\n]+)_|~([^~\n]+)~/g;
    let idx = 0;
    let m;

    while ((m = inlineRegex.exec(str)) !== null) {
      if (m.index > idx) {
        tokens.push(React.createElement('span', { key: key++ }, str.slice(idx, m.index)));
      }
      if (m[1] !== undefined) {
        tokens.push(
          React.createElement('code', {
            key: key++,
            className: 'px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-data text-[11px]',
          }, m[1])
        );
      } else if (m[2] !== undefined) {
        tokens.push(
          React.createElement('strong', {
            key: key++,
            className: 'font-bold text-on-surface',
          }, m[2])
        );
      } else if (m[3] !== undefined) {
        tokens.push(
          React.createElement('em', {
            key: key++,
            className: 'italic',
          }, m[3])
        );
      } else if (m[4] !== undefined) {
        tokens.push(
          React.createElement('s', {
            key: key++,
            className: 'line-through text-on-surface-variant',
          }, m[4])
        );
      }
      idx = inlineRegex.lastIndex;
    }
    if (idx < str.length) {
      tokens.push(React.createElement('span', { key: key++ }, str.slice(idx)));
    }
    return tokens;
  }

  return React.createElement('span', { className }, parts.map((part) => {
    if (part.type === 'mono') {
      return React.createElement('pre', {
        key: key++,
        className: 'inline-block px-2 py-1 my-1 rounded bg-surface-container-highest text-primary font-data text-[11px] whitespace-pre-wrap',
      }, part.content);
    }
    return React.createElement('span', { key: key++ }, renderInline(part.content));
  }));
}
