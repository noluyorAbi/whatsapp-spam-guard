const { checkRules } = require('../src/rules');

describe('checkRules', () => {
  // --- SPAM CONFIRMED ---

  test('flags WhatsApp invite with trading keywords', () => {
    const result = checkRules(
      'Join our forex trading group! https://chat.whatsapp.com/ABC123',
      ['https://chat.whatsapp.com/ABC123']
    );
    expect(result.verdict).toBe('spam');
    expect(result.reason).toMatch(/trading|forex/i);
  });

  test('flags known trading domain', () => {
    const result = checkRules(
      'Check out https://binance.com/group-invite',
      ['https://binance.com/group-invite']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags adult content domain', () => {
    const result = checkRules(
      'Visit https://onlyfans.com/profile',
      ['https://onlyfans.com/profile']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags gambling domain', () => {
    const result = checkRules(
      'Try your luck at https://bet365.com',
      ['https://bet365.com']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags message with adult keywords and a link', () => {
    const result = checkRules(
      'Hot singles in your area https://example.com/click',
      ['https://example.com/click']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags message with betting keywords and a link', () => {
    const result = checkRules(
      'Free betting tips daily profits https://example.com/tips',
      ['https://example.com/tips']
    );
    expect(result.verdict).toBe('spam');
  });

  // --- CLEAN ---

  test('passes normal university link', () => {
    const result = checkRules(
      'Here is the lecture: https://university.edu/slides.pdf',
      ['https://university.edu/slides.pdf']
    );
    expect(result.verdict).toBe('clean');
  });

  test('passes YouTube link without spam keywords', () => {
    const result = checkRules(
      'Watch this tutorial https://youtube.com/watch?v=abc123',
      ['https://youtube.com/watch?v=abc123']
    );
    expect(result.verdict).toBe('clean');
  });

  // --- UNCERTAIN ---

  test('returns uncertain for WhatsApp invite without spam keywords', () => {
    const result = checkRules(
      'Join this group https://chat.whatsapp.com/XYZ789',
      ['https://chat.whatsapp.com/XYZ789']
    );
    expect(result.verdict).toBe('uncertain');
  });

  test('returns uncertain for unknown short URL', () => {
    const result = checkRules(
      'Click here https://bit.ly/3xAbCdE',
      ['https://bit.ly/3xAbCdE']
    );
    expect(result.verdict).toBe('uncertain');
  });
});
