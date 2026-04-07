const chalk = require('chalk');

const ICONS = {
  bot: '🤖',
  spam: '🚫',
  clean: '✅',
  uncertain: '🔍',
  kick: '👢',
  delete: '🗑️',
  warn: '⚠️',
  error: '❌',
  ai: '🧠',
  connect: '🟢',
  disconnect: '🔴',
  message: '💬',
  link: '🔗',
  rule: '📏',
};

function timestamp() {
  return chalk.gray(new Date().toLocaleTimeString('en-GB', { hour12: false }));
}

function truncate(str, len = 60) {
  if (!str) return '';
  const oneLine = str.replace(/\n/g, ' ').trim();
  return oneLine.length > len ? oneLine.substring(0, len) + '...' : oneLine;
}

// Format the match context with the matched part highlighted
function formatContext(context) {
  if (!context) return '';
  // context has format: ...before[matched]after...
  return context.replace(/\[([^\]]+)\]/, (_, match) => {
    return chalk.bgRed.white.bold(` ${match} `);
  });
}

const log = {
  // --- Startup / Connection ---
  init() {
    console.log('');
    console.log(chalk.cyan.bold('  ╔══════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('  ║') + chalk.white.bold('   WhatsApp University Spam Guard   ') + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('  ╚══════════════════════════════════════╝'));
    console.log('');
  },

  connecting() {
    console.log(`${timestamp()} ${ICONS.bot} ${chalk.yellow('Initializing WhatsApp client...')}`);
  },

  qr() {
    console.log(`\n${timestamp()} ${ICONS.bot} ${chalk.cyan.bold('Scan this QR code with WhatsApp:')}\n`);
  },

  ready(botId) {
    console.log(`${timestamp()} ${ICONS.connect} ${chalk.green.bold('Connected!')} Bot ID: ${chalk.dim(botId)}`);
    console.log(`${timestamp()} ${ICONS.bot} ${chalk.green('Monitoring group messages for spam...')}`);
    console.log(chalk.gray('─'.repeat(60)));
  },

  disconnected(reason) {
    console.log(`${timestamp()} ${ICONS.disconnect} ${chalk.red.bold('Disconnected:')} ${reason}`);
  },

  // --- Message Processing ---
  messageReceived(from, body) {
    console.log('');
    console.log(`${timestamp()} ${ICONS.message} ${chalk.white.bold('New message with link(s)')}`);
    console.log(`${timestamp()}    ${chalk.dim('Group:')} ${chalk.cyan(from)}`);
    console.log(`${timestamp()}    ${chalk.dim('Text:')}  ${chalk.white(truncate(body, 80))}`);
  },

  analyzing(links) {
    console.log(`${timestamp()} ${ICONS.link} ${chalk.blue('Scanning')} ${chalk.white.bold(links.length)} ${chalk.blue('link(s):')} ${chalk.dim(links.map(l => truncate(l, 40)).join(', '))}`);
  },

  // --- Verdicts ---
  verdictSpam(result) {
    console.log(`${timestamp()} ${ICONS.spam} ${chalk.bgRed.white.bold(' SPAM DETECTED ')}`);
    console.log(`${timestamp()}    ${chalk.dim('Rule:')}    ${chalk.yellow(result.reason)}`);
    if (result.context) {
      console.log(`${timestamp()}    ${chalk.dim('Match:')}   ${formatContext(result.context)}`);
    }
    if (result.wasNormalized) {
      console.log(`${timestamp()}    ${chalk.dim('Note:')}    ${chalk.italic.gray('Detected via Unicode normalization (spammer used fancy text)')}`);
    }
  },

  verdictClean() {
    // silent in normal mode
  },

  verdictCleanDebug(reason) {
    console.log(`${timestamp()} ${ICONS.clean} ${chalk.green('Clean')} ${chalk.dim('→ ' + reason)}`);
  },

  verdictUncertain(reason) {
    console.log(`${timestamp()} ${ICONS.uncertain} ${chalk.bgYellow.black(' UNCERTAIN ')} ${chalk.dim('→ ' + reason)}`);
  },

  // --- AI ---
  aiEscalating(body) {
    console.log(`${timestamp()} ${ICONS.ai} ${chalk.magenta.bold('Escalating to AI classifier...')}`);
    console.log(`${timestamp()}    ${chalk.dim('Sending message to Gemini for analysis...')}`);
  },

  aiResult(spam, reason) {
    if (spam) {
      console.log(`${timestamp()} ${ICONS.ai} ${chalk.bgRed.white.bold(' AI → SPAM ')} ${chalk.yellow(reason)}`);
    } else {
      console.log(`${timestamp()} ${ICONS.ai} ${chalk.bgGreen.black(' AI → CLEAN ')} ${chalk.dim(reason)}`);
    }
  },

  aiGeminiFailed(err) {
    console.log(`${timestamp()} ${ICONS.warn} ${chalk.yellow('Gemini failed')} ${chalk.dim('→ falling back to OpenAI')}`);
    console.log(`${timestamp()}    ${chalk.dim('Error:')} ${chalk.gray(err)}`);
  },

  aiBothFailed() {
    console.log(`${timestamp()} ${ICONS.error} ${chalk.red.bold('Both AI APIs failed')} — ${chalk.yellow('fail-open, message allowed')}`);
  },

  // --- Actions ---
  deleted(group) {
    console.log(`${timestamp()} ${ICONS.delete}  ${chalk.red('Message deleted')} ${chalk.dim('from group')}`);
  },

  kicked(sender, group, reason) {
    console.log(`${timestamp()} ${ICONS.kick} ${chalk.bgRed.white.bold(' USER KICKED ')}`);
    console.log(`${timestamp()}    ${chalk.dim('User:')}    ${chalk.white.bold(sender)}`);
    console.log(`${timestamp()}    ${chalk.dim('Group:')}   ${chalk.cyan(group)}`);
    console.log(`${timestamp()}    ${chalk.dim('Reason:')}  ${chalk.yellow(reason)}`);
    console.log(chalk.gray('─'.repeat(60)));
  },

  notAdmin(group) {
    console.log(`${timestamp()} ${ICONS.warn} ${chalk.bgYellow.black(' NOT ADMIN ')} in ${chalk.dim(group)} — ${chalk.yellow('cannot kick, skipping')}`);
    console.log(chalk.gray('─'.repeat(60)));
  },

  deleteFailed(err) {
    console.log(`${timestamp()} ${ICONS.warn} ${chalk.yellow('Delete failed:')} ${chalk.dim(err)}`);
  },

  kickFailed(sender, err) {
    console.log(`${timestamp()} ${ICONS.error} ${chalk.red.bold('Kick failed')} for ${chalk.white(sender)}: ${chalk.dim(err)}`);
    console.log(chalk.gray('─'.repeat(60)));
  },

  // --- Errors ---
  error(msg, err) {
    console.log(`${timestamp()} ${ICONS.error} ${chalk.red.bold(msg)}`, err);
  },
};

module.exports = log;
