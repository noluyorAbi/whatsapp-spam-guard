const { getCustomDomains, getCustomKeywords } = require('./supabase');

const SPAM_DOMAINS = [
  // Trading/forex
  'binance.com', 'bybit.com', 'okx.com', 'kucoin.com', 'mexc.com',
  'bitget.com', 'gate.io', 'huobi.com', 'etoro.com', 'iqoption.com',
  'olymptrade.com', 'expertoption.com', 'pocket-option.com',
  // Adult
  'onlyfans.com', 'pornhub.com', 'xvideos.com', 'xhamster.com',
  'chaturbate.com', 'stripchat.com', 'livejasmin.com', 'fansly.com',
  // Gambling/betting
  'bet365.com', '1xbet.com', 'betway.com', 'stake.com', '888casino.com',
  'betfair.com', 'williamhill.com', 'unibet.com', 'parimatch.com',
  'melbet.com', '22bet.com', 'linebet.com',
];

// Strong signals — always spam regardless of context
const SPAM_KEYWORDS = [
  // Trading
  /\bforex\b/i, /\btrading\s*signals?\b/i, /\bcrypto\s*signals?\b/i,
  /\bbinary\s*options?\b/i, /\binvestment\s*group\b/i,
  /\bmake\s*money\s*fast\b/i, /\bpassive\s*income\b/i,
  /\bfinancial\s*freedom\b/i, /\bpump\s*(and|&)\s*dump\b/i,
  // Adult
  /\bhot\s*singles\b/i, /\bnudes?\b/i, /\bescort\b/i,
  /\badult\s*content\b/i, /\bxxx\b/i, /\bsexy\s*(girls?|women)\b/i,
  /\berotic\b/i, /\bfantasy\s*group\b/i,
  // Gambling
  /\bbetting\s*tips?\b/i, /\bfree\s*bets?\b/i, /\bjackpot\b/i,
  /\bcasino\s*bonus\b/i, /\bsports?\s*betting\b/i,
  /\bguaranteed\s*wins?\b/i, /\bbet\s*and\s*win\b/i,
  // Academic fraud — strong (these phrases are almost never used by students)
  /\bgrade\s*grante?r\b/i,
  /\bget\s*\d+\+?\s*grade\b/i,
  /\bacademic\s*writing\s*service\b/i,
  /\bzero\s*plagiarism\b/i,
  /\bmoney\s*back\s*guarantee\b/i,
];

// Weak signals — only spam when combined with promotional indicators
const CONTEXT_KEYWORDS = [
  /\bassignment\s*(help|service|writing)\b/i,
  /\bessay\s*writing\b/i,
  /\bthesis\s*writing\b/i,
  /\bdissertation\s*writing\b/i,
  /\bprofessional\s*expert\b/i,
  /\bcontact\s*us\b/i,
  /\bour\s*service\b/i,
  /\bbook\s*your\b/i,
];

// Promotional indicators — presence of these turns context keywords into spam
const PROMO_INDICATORS = [
  /wa\.me\//i,                        // wa.me direct links
  /whatsapp\s*number/i,               // "WhatsApp Number"
  /\+\d{10,}/,                        // phone numbers like +923271400814
  /\d+\s*%\s*discount/i,              // "30% discount"
  /\bour\s*service\s*provides?\b/i,   // "our service provides"
  /\bour\s*prices?\b/i,               // "our prices"
  /\byears?\s*experience\b/i,         // "7 years experience"
  /\bcustomer\s*support\b/i,          // "24/7 customer support"
  /\bcustomer\s*satisfaction\b/i,     // "100% customer satisfaction"
  /\baffordable\b/i,                  // "affordable"
  /\breasonable\s*price\b/i,         // "reasonable price"
  /\bgood\s*grades?\s*guarantee\b/i, // "good grades guarantee"
  /\bbook\s*your\s*(whole\s*)?semester\b/i,
  /\bdon'?t\s*miss\s*(the\s*)?deadline\b/i,
];

const SHORT_URL_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'is.gd',
  'buff.ly', 'ow.ly', 'shorte.st', 'adf.ly',
];

// Normalize Unicode fancy text (mathematical bold, italic, etc.) to plain ASCII
// Spammers use these to evade keyword detection
function normalizeText(text) {
  if (!text) return '';

  // Unicode mathematical/styled character ranges → ASCII
  const ranges = [
    // Bold
    [0x1D400, 0x1D419, 65],  // A-Z
    [0x1D41A, 0x1D433, 97],  // a-z
    // Italic
    [0x1D434, 0x1D44D, 65],
    [0x1D44E, 0x1D467, 97],
    // Bold Italic
    [0x1D468, 0x1D481, 65],
    [0x1D482, 0x1D49B, 97],
    // Script
    [0x1D49C, 0x1D4B5, 65],
    [0x1D4B6, 0x1D4CF, 97],
    // Bold Script
    [0x1D4D0, 0x1D4E9, 65],
    [0x1D4EA, 0x1D503, 97],
    // Fraktur
    [0x1D504, 0x1D51D, 65],
    [0x1D51E, 0x1D537, 97],
    // Double-struck
    [0x1D538, 0x1D551, 65],
    [0x1D552, 0x1D56B, 97],
    // Bold Fraktur
    [0x1D56C, 0x1D585, 65],
    [0x1D586, 0x1D59F, 97],
    // Sans-serif
    [0x1D5A0, 0x1D5B9, 65],
    [0x1D5BA, 0x1D5D3, 97],
    // Sans-serif Bold
    [0x1D5D4, 0x1D5ED, 65],
    [0x1D5EE, 0x1D607, 97],
    // Sans-serif Italic
    [0x1D608, 0x1D621, 65],
    [0x1D622, 0x1D63B, 97],
    // Sans-serif Bold Italic
    [0x1D63C, 0x1D655, 65],
    [0x1D656, 0x1D66F, 97],
    // Monospace
    [0x1D670, 0x1D689, 65],
    [0x1D68A, 0x1D6A3, 97],
    // Bold digits
    [0x1D7CE, 0x1D7D7, 48],
    // Double-struck digits
    [0x1D7D8, 0x1D7E1, 48],
    // Sans-serif digits
    [0x1D7E2, 0x1D7EB, 48],
    // Sans-serif bold digits
    [0x1D7EC, 0x1D7F5, 48],
    // Monospace digits
    [0x1D7F6, 0x1D7FF, 48],
  ];

  let result = '';
  for (const char of text) {
    const cp = char.codePointAt(0);
    let replaced = false;

    for (const [start, end, asciiBase] of ranges) {
      if (cp >= start && cp <= end) {
        result += String.fromCharCode(asciiBase + (cp - start));
        replaced = true;
        break;
      }
    }

    if (!replaced) {
      // Also handle fullwidth characters (Ａ-Ｚ, ａ-ｚ, ０-９)
      if (cp >= 0xFF21 && cp <= 0xFF3A) {
        result += String.fromCharCode(65 + (cp - 0xFF21));
      } else if (cp >= 0xFF41 && cp <= 0xFF5A) {
        result += String.fromCharCode(97 + (cp - 0xFF41));
      } else if (cp >= 0xFF10 && cp <= 0xFF19) {
        result += String.fromCharCode(48 + (cp - 0xFF10));
      } else {
        result += char;
      }
    }
  }

  // Strip emojis and other non-text symbols for cleaner matching
  return result.replace(/[\u{1F000}-\u{1FFFF}]/gu, ' ').replace(/\s+/g, ' ');
}

function getDomain(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return hostname;
  } catch {
    return '';
  }
}

function findMatch(patterns, text, normalized) {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match = pattern.exec(normalized);
    let matchSource = 'normalized';
    if (!match) {
      pattern.lastIndex = 0;
      match = pattern.exec(text);
      matchSource = 'original';
    }
    if (match) {
      const src = matchSource === 'normalized' ? normalized : text;
      const start = Math.max(0, match.index - 30);
      const end = Math.min(src.length, match.index + match[0].length + 30);
      const before = src.substring(start, match.index);
      const matched = match[0];
      const after = src.substring(match.index + match[0].length, end);
      const context = `${start > 0 ? '...' : ''}${before}[${matched}]${after}${end < src.length ? '...' : ''}`;
      return { pattern, matched, context, wasNormalized: matchSource === 'normalized' };
    }
  }
  return null;
}

function checkRules(text, links) {
  const normalized = normalizeText(text);
  const domains = links.map(getDomain);
  const hasWhatsAppInvite = links.some(l => l.includes('chat.whatsapp.com') || l.includes('wa.me'));
  const hasShortUrl = domains.some(d => SHORT_URL_DOMAINS.includes(d));

  // 1. Check for known spam domains (built-in + custom from Supabase)
  const allSpamDomains = [...SPAM_DOMAINS, ...getCustomDomains()];
  for (const domain of domains) {
    if (allSpamDomains.includes(domain)) {
      return { verdict: 'spam', reason: `Known spam domain: ${domain}` };
    }
  }

  // 2. Check strong keywords — always spam
  const strongMatch = findMatch(SPAM_KEYWORDS, text, normalized);
  if (strongMatch) {
    return {
      verdict: 'spam',
      reason: `Matched keyword: ${strongMatch.pattern}`,
      matchedText: strongMatch.matched,
      context: strongMatch.context,
      wasNormalized: strongMatch.wasNormalized,
    };
  }

  // 2b. Check custom keywords from Supabase
  const customKwMatch = findMatch(getCustomKeywords(), text, normalized);
  if (customKwMatch) {
    return {
      verdict: 'spam',
      reason: `Custom rule: ${customKwMatch.pattern}`,
      matchedText: customKwMatch.matched,
      context: customKwMatch.context,
      wasNormalized: customKwMatch.wasNormalized,
    };
  }

  // 3. Check context keywords — only spam when promotional indicators are present
  const contextMatch = findMatch(CONTEXT_KEYWORDS, text, normalized);
  if (contextMatch) {
    const hasPromo = PROMO_INDICATORS.some(p => p.test(text) || p.test(normalized));
    if (hasPromo) {
      // Find which promo indicator matched for logging
      const promoMatch = PROMO_INDICATORS.find(p => p.test(text) || p.test(normalized));
      return {
        verdict: 'spam',
        reason: `Matched keyword: ${contextMatch.pattern} + promotional indicator: ${promoMatch}`,
        matchedText: contextMatch.matched,
        context: contextMatch.context,
        wasNormalized: contextMatch.wasNormalized,
      };
    }
    // Context keyword without promo = uncertain, let AI decide
    return {
      verdict: 'uncertain',
      reason: `Weak signal: "${contextMatch.matched}" — no promotional indicators found, escalating to AI`,
    };
  }

  // 4. Uncertain cases: WhatsApp invites or short URLs without any keyword matches
  if (hasWhatsAppInvite || hasShortUrl) {
    return { verdict: 'uncertain', reason: 'Contains invite link or short URL without clear spam signals' };
  }

  return { verdict: 'clean', reason: 'No spam indicators found' };
}

module.exports = { checkRules, normalizeText };
