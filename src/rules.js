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
];

const SHORT_URL_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'is.gd',
  'buff.ly', 'ow.ly', 'shorte.st', 'adf.ly',
];

function getDomain(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return hostname;
  } catch {
    return '';
  }
}

function checkRules(text, links) {
  const domains = links.map(getDomain);
  const hasWhatsAppInvite = links.some(l => l.includes('chat.whatsapp.com'));
  const hasShortUrl = domains.some(d => SHORT_URL_DOMAINS.includes(d));

  // Check for known spam domains
  for (const domain of domains) {
    if (SPAM_DOMAINS.includes(domain)) {
      return { verdict: 'spam', reason: `Known spam domain: ${domain}` };
    }
  }

  // Check for spam keywords in message text
  for (const pattern of SPAM_KEYWORDS) {
    if (pattern.test(text)) {
      return { verdict: 'spam', reason: `Matched spam keyword: ${pattern}` };
    }
  }

  // Uncertain cases: WhatsApp invites or short URLs without clear spam signals
  if (hasWhatsAppInvite || hasShortUrl) {
    return { verdict: 'uncertain', reason: 'Contains invite link or short URL without clear spam signals' };
  }

  return { verdict: 'clean', reason: 'No spam indicators found' };
}

module.exports = { checkRules };
