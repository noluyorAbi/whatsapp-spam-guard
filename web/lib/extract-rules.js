const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

export function extractDomains(text) {
  const urls = text.match(URL_REGEX) || [];
  const domains = new Set();
  for (const url of urls) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      const skip = ['youtube.com', 'google.com', 'github.com', 'chat.whatsapp.com', 'wa.me'];
      if (!skip.includes(hostname)) {
        domains.add(hostname);
      }
    } catch {
      // invalid URL
    }
  }
  return [...domains];
}

export function extractKeywords(text) {
  const normalized = text.normalize('NFKD').replace(/[^\x00-\x7F]/g, '').toLowerCase();

  const patterns = [
    { regex: /assignment\s*(help|service|writing)/gi, label: 'assignment help/service/writing' },
    { regex: /essay\s*writing/gi, label: 'essay writing' },
    { regex: /thesis\s*writing/gi, label: 'thesis writing' },
    { regex: /dissertation\s*writing/gi, label: 'dissertation writing' },
    { regex: /trading\s*signals?/gi, label: 'trading signals' },
    { regex: /crypto\s*signals?/gi, label: 'crypto signals' },
    { regex: /forex/gi, label: 'forex' },
    { regex: /betting\s*tips?/gi, label: 'betting tips' },
    { regex: /casino\s*bonus/gi, label: 'casino bonus' },
    { regex: /passive\s*income/gi, label: 'passive income' },
    { regex: /financial\s*freedom/gi, label: 'financial freedom' },
    { regex: /grade\s*guarante/gi, label: 'grade guarantee' },
    { regex: /zero\s*plagiarism/gi, label: 'zero plagiarism' },
    { regex: /academic\s*writing/gi, label: 'academic writing' },
    { regex: /professional\s*expert/gi, label: 'professional expert' },
  ];

  const found = [];
  for (const { regex, label } of patterns) {
    if (regex.test(text) || regex.test(normalized)) {
      found.push(label);
    }
  }
  return [...new Set(found)];
}
