const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

function extractLinks(text) {
  if (!text) return [];
  const matches = text.match(URL_REGEX);
  return matches || [];
}

function shouldAnalyze(msg) {
  if (!msg.from.endsWith('@g.us')) return false;
  if (msg.fromMe) return false;
  const links = extractLinks(msg.body);
  return links.length > 0;
}

module.exports = { extractLinks, shouldAnalyze };
