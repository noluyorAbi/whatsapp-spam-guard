const { extractLinks, shouldAnalyze } = require('../src/filter');

describe('extractLinks', () => {
  test('extracts standard URLs', () => {
    const text = 'Check out https://example.com and http://foo.bar/path';
    const links = extractLinks(text);
    expect(links).toEqual(['https://example.com', 'http://foo.bar/path']);
  });

  test('extracts WhatsApp invite links', () => {
    const text = 'Join here: https://chat.whatsapp.com/ABC123xyz';
    const links = extractLinks(text);
    expect(links).toEqual(['https://chat.whatsapp.com/ABC123xyz']);
  });

  test('returns empty array when no links', () => {
    const text = 'Hello everyone, how is the exam going?';
    const links = extractLinks(text);
    expect(links).toEqual([]);
  });

  test('extracts multiple mixed links', () => {
    const text = 'Visit https://trading-signals.com or join https://chat.whatsapp.com/XYZ789';
    const links = extractLinks(text);
    expect(links).toHaveLength(2);
    expect(links).toContain('https://trading-signals.com');
    expect(links).toContain('https://chat.whatsapp.com/XYZ789');
  });
});

describe('shouldAnalyze', () => {
  test('returns true for group messages with links', () => {
    const msg = {
      from: '1234@g.us',
      fromMe: false,
      body: 'Join https://chat.whatsapp.com/ABC123',
    };
    expect(shouldAnalyze(msg)).toBe(true);
  });

  test('returns false for non-group messages', () => {
    const msg = {
      from: '1234@c.us',
      fromMe: false,
      body: 'Join https://chat.whatsapp.com/ABC123',
    };
    expect(shouldAnalyze(msg)).toBe(false);
  });

  test('returns false for messages from self', () => {
    const msg = {
      from: '1234@g.us',
      fromMe: true,
      body: 'Join https://chat.whatsapp.com/ABC123',
    };
    expect(shouldAnalyze(msg)).toBe(false);
  });

  test('returns false for messages without links', () => {
    const msg = {
      from: '1234@g.us',
      fromMe: false,
      body: 'Hello everyone!',
    };
    expect(shouldAnalyze(msg)).toBe(false);
  });
});
