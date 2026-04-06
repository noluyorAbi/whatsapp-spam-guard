require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { loadConfig } = require('./config');
const { shouldAnalyze, extractLinks } = require('./filter');
const { checkRules } = require('./rules');
const { classify } = require('./classifier');
const { handleSpam } = require('./actions');

const config = loadConfig();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

let botId = null;

client.on('qr', (qr) => {
  console.log('[bot] Scan this QR code with WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  botId = client.info.wid._serialized;
  console.log(`[bot] Connected as ${botId}`);
  console.log('[bot] Monitoring group messages for spam...');
});

client.on('disconnected', (reason) => {
  console.warn('[bot] Disconnected:', reason);
});

client.on('message_create', async (msg) => {
  try {
    if (!shouldAnalyze(msg)) return;

    const links = extractLinks(msg.body);
    const ruleResult = checkRules(msg.body, links);

    if (config.logLevel === 'debug') {
      console.log(`[bot] Analyzed message in ${msg.from}: ${ruleResult.verdict} — ${ruleResult.reason}`);
    }

    if (ruleResult.verdict === 'spam') {
      await handleSpam(msg, ruleResult.reason, botId);
      return;
    }

    if (ruleResult.verdict === 'clean') return;

    // Uncertain — escalate to AI
    console.log(`[bot] Escalating to AI: "${msg.body.substring(0, 80)}..."`);
    const aiResult = await classify(config, msg.body);

    if (config.logLevel === 'debug') {
      console.log(`[bot] AI result: spam=${aiResult.spam}, reason=${aiResult.reason}`);
    }

    if (aiResult.spam) {
      await handleSpam(msg, `AI: ${aiResult.reason}`, botId);
    }
  } catch (err) {
    console.error('[bot] Error processing message:', err);
  }
});

console.log('[bot] Initializing WhatsApp client...');
client.initialize();
