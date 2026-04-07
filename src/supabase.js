const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function initSupabase(config) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.warn('[supabase] Missing URL or key, Supabase disabled');
    return null;
  }
  supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  console.log('[supabase] Initialized with', config.supabaseUrl);
  return supabase;
}

function getSupabase() {
  return supabase;
}

// --- Heartbeat ---

const stats = {
  messagesProcessed: 0,
  spamBlocked: 0,
  lastMessageAt: null,
};

function incrementProcessed() {
  stats.messagesProcessed++;
  stats.lastMessageAt = new Date().toISOString();
}

function incrementBlocked() {
  stats.spamBlocked++;
}

async function sendHeartbeat(status, qrCode) {
  if (!supabase) {
    console.warn('[supabase] Not initialized, skipping heartbeat');
    return;
  }
  try {
    const row = {
      id: 1,
      updated_at: new Date().toISOString(),
      status,
      last_message_at: stats.lastMessageAt,
      messages_processed: stats.messagesProcessed,
      spam_blocked: stats.spamBlocked,
    };
    if (qrCode !== undefined) {
      row.qr_code = qrCode;
    }
    const { error } = await supabase.from('uni-wa-bot-bot_status').upsert(row);
    if (error) {
      console.warn('[supabase] Heartbeat error:', error.message);
    }
  } catch (err) {
    console.warn('[supabase] Heartbeat failed:', err.message);
  }
}

async function sendQrCode(qrCode) {
  return sendHeartbeat('waiting_for_qr', qrCode);
}

async function clearQrCode() {
  return sendHeartbeat('connected', null);
}

let heartbeatInterval = null;

function startHeartbeat() {
  if (!supabase) return;
  sendHeartbeat('connected');
  heartbeatInterval = setInterval(() => sendHeartbeat('connected'), 30000);
}

function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (supabase) sendHeartbeat('disconnected');
}

// --- Spam Event Logging ---

async function logSpamEvent({ groupId, groupName, senderId, messageText, matchedRule, wasAiClassified }) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('uni-wa-bot-spam_log').insert({
      group_id: groupId || null,
      group_name: groupName || null,
      sender_id: senderId || null,
      message_text: messageText?.substring(0, 500) || '',
      matched_rule: matchedRule || null,
      was_ai_classified: wasAiClassified || false,
    });
    if (error) {
      console.warn('[supabase] Spam log error:', error.message);
    } else {
      console.log('[supabase] Spam event logged');
    }
  } catch (err) {
    console.warn('[supabase] Failed to log spam event:', err.message);
  }
}

// --- Custom Rules Polling ---

let customDomains = [];
let customKeywords = [];

async function pollCustomRules() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('uni-wa-bot-custom_rules').select('*');
    if (error) throw error;

    customDomains = data
      .filter(r => r.type === 'domain')
      .map(r => r.value.toLowerCase());

    customKeywords = data
      .filter(r => r.type === 'keyword')
      .map(r => {
        try {
          return new RegExp(r.value, 'i');
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    console.log(`[supabase] Loaded ${customDomains.length} custom domains, ${customKeywords.length} custom keywords`);
  } catch (err) {
    console.warn('[supabase] Failed to poll custom rules:', err.message);
  }
}

let pollInterval = null;

function startPolling() {
  if (!supabase) return;
  pollCustomRules();
  pollInterval = setInterval(pollCustomRules, 60000);
}

function stopPolling() {
  if (pollInterval) clearInterval(pollInterval);
}

function getCustomDomains() {
  return customDomains;
}

function getCustomKeywords() {
  return customKeywords;
}

module.exports = {
  initSupabase,
  getSupabase,
  startHeartbeat,
  stopHeartbeat,
  sendHeartbeat,
  sendQrCode,
  clearQrCode,
  incrementProcessed,
  incrementBlocked,
  logSpamEvent,
  startPolling,
  stopPolling,
  getCustomDomains,
  getCustomKeywords,
};
