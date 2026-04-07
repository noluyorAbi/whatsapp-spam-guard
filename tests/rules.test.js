const { checkRules, normalizeText } = require('../src/rules');

describe('normalizeText', () => {
  test('converts Unicode bold to ASCII', () => {
    expect(normalizeText('𝗔𝘀𝘀𝗶𝗴𝗻𝗺𝗲𝗻𝘁𝘀')).toMatch(/Assignments/i);
  });

  test('converts Unicode italic to ASCII', () => {
    expect(normalizeText('𝐀𝐬𝐬𝐢𝐠𝐧𝐦𝐞𝐧𝐭𝐬')).toMatch(/Assignments/i);
  });

  test('converts monospace digits', () => {
    expect(normalizeText('𝟹𝟶')).toBe('30');
  });

  test('passes plain ASCII through unchanged', () => {
    expect(normalizeText('Hello world')).toBe('Hello world');
  });
});

describe('checkRules', () => {
  // --- SPAM: known domains ---

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

  // --- SPAM: strong keywords (always spam) ---

  test('flags forex keyword', () => {
    const result = checkRules(
      'Join our forex trading group! https://chat.whatsapp.com/ABC123',
      ['https://chat.whatsapp.com/ABC123']
    );
    expect(result.verdict).toBe('spam');
    expect(result.reason).toMatch(/forex/i);
  });

  test('flags adult keywords', () => {
    const result = checkRules(
      'Hot singles in your area https://example.com/click',
      ['https://example.com/click']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags betting keywords', () => {
    const result = checkRules(
      'Free betting tips daily profits https://example.com/tips',
      ['https://example.com/tips']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags "get 80+ grade" as strong spam signal', () => {
    const result = checkRules(
      'GET 80+ GRADE IN YOUR ASSIGNMENT https://wa.me/923497847518',
      ['https://wa.me/923497847518']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags "academic writing service" as strong spam signal', () => {
    const result = checkRules(
      'Best academic writing service available https://example.com',
      ['https://example.com']
    );
    expect(result.verdict).toBe('spam');
  });

  // --- SPAM: context keywords + promotional indicators ---

  test('flags "thesis writing" + wa.me link (promotional)', () => {
    const result = checkRules(
      'Thesis writing help available https://wa.me/923271400814',
      ['https://wa.me/923271400814']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags "essay writing" + discount language', () => {
    const result = checkRules(
      'Essay writing help 30% discount https://example.com/order',
      ['https://example.com/order']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags "assignment help" + "our service"', () => {
    const result = checkRules(
      'Assignment help — our service provides quality work https://example.com',
      ['https://example.com']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags Unicode fancy text academic spam with promo indicators', () => {
    const result = checkRules(
      '📚𝗔𝘀𝘀𝗶𝗴𝗻𝗺𝗲𝗻𝘁𝘀, 𝗣𝗿𝗼𝗷𝗲𝗰𝘁𝘀, 𝗘𝘀𝘀𝗮𝘆, 𝗗𝗶𝘀𝘀𝗲𝗿𝘁𝗮𝘁𝗶𝗼𝗻 𝗮𝗻𝗱 𝗧𝗵𝗲𝘀𝗶𝘀 𝗪𝗿𝗶𝘁𝗶𝗻𝗴 𝗛𝗲𝗹𝗽📚 Good Grades Guarantee https://wa.me/923271400814',
      ['https://wa.me/923271400814']
    );
    expect(result.verdict).toBe('spam');
  });

  // --- FALSE POSITIVE PREVENTION ---

  test('does NOT flag student asking about thesis writing', () => {
    const result = checkRules(
      'Can someone help my thesis writing? https://adatepe.dev',
      ['https://adatepe.dev']
    );
    // Should be uncertain (escalated to AI) or clean, NOT spam
    expect(result.verdict).not.toBe('spam');
  });

  test('does NOT flag student sharing assignment help link to university site', () => {
    const result = checkRules(
      'Found this assignment help page https://university.edu/writing-center',
      ['https://university.edu/writing-center']
    );
    expect(result.verdict).not.toBe('spam');
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

  test('returns uncertain for wa.me link without spam keywords', () => {
    const result = checkRules(
      'Message me here https://wa.me/1234567890',
      ['https://wa.me/1234567890']
    );
    expect(result.verdict).toBe('uncertain');
  });
});
