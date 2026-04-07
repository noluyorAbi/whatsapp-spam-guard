require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { loadConfig } = require('./config');
const { shouldAnalyze, extractLinks } = require('./filter');
const { checkRules } = require('./rules');
const { classify } = require('./classifier');
const { handleSpam } = require('./actions');
const log = require('./logger');
const {
  initSupabase,
  startHeartbeat,
  stopHeartbeat,
  sendHeartbeat,
  sendQrCode,
  clearQrCode,
  startPolling,
  stopPolling,
  incrementProcessed,
  incrementBlocked,
} = require('./supabase');

const config = loadConfig();

// Init Supabase
initSupabase(config);

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

let botId = null;

log.init();
log.connecting();

client.on('qr', (qr) => {
  log.qr();
  qrcode.generate(qr, { small: true });
  sendQrCode(qr);
});

client.on('ready', () => {
  botId = client.info.wid._serialized;
  log.ready(botId);
  clearQrCode();
  startHeartbeat();
  startPolling();
});

client.on('disconnected', (reason) => {
  log.disconnected(reason);
  sendHeartbeat('disconnected');
});

process.on('SIGINT', () => {
  stopHeartbeat();
  stopPolling();
  process.exit(0);
});

client.on('message', async (msg) => {
  try {
    if (!shouldAnalyze(msg)) return;

    const links = extractLinks(msg.body);
    log.messageReceived(msg.from, msg.body);
    log.analyzing(links);

    incrementProcessed();

    const ruleResult = checkRules(msg.body, links);

    if (ruleResult.verdict === 'spam') {
      log.verdictSpam(ruleResult);
      incrementBlocked();
      await handleSpam(msg, ruleResult.reason, botId);
      return;
    }

    if (ruleResult.verdict === 'clean') {
      if (config.logLevel === 'debug') {
        log.verdictCleanDebug(ruleResult.reason);
      }
      return;
    }

    // Uncertain — escalate to AI
    log.verdictUncertain(ruleResult.reason);
    log.aiEscalating(msg.body);
    const aiResult = await classify(config, msg.body);
    log.aiResult(aiResult.spam, aiResult.reason);

    if (aiResult.spam) {
      incrementBlocked();
      await handleSpam(msg, `AI: ${aiResult.reason}`, botId);
    }
  } catch (err) {
    log.error('Error processing message', err);
  }
});

client.initialize();
