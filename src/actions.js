const log = require('./logger');

async function resolveParticipantId(msg, chat) {
  try {
    const contact = await msg.getContact();
    const contactId = contact.id._serialized;
    const found = chat.participants?.find(p => p.id._serialized === contactId);
    if (found) return contactId;
  } catch (err) {
    // getContact failed, try other methods
  }

  if (msg.author) {
    const found = chat.participants?.find(p => p.id._serialized === msg.author);
    if (found) return msg.author;
  }

  const rawAuthor = msg.author || '';
  const phoneMatch = rawAuthor.match(/(\d+)/);
  if (phoneMatch) {
    const phone = phoneMatch[1];
    const participant = chat.participants?.find(p => p.id._serialized.includes(phone));
    if (participant) return participant.id._serialized;
  }

  return msg.author || msg.from;
}

async function handleSpam(msg, reason, botId) {
  const chat = await msg.getChat();

  const botParticipant = chat.participants?.find(
    (p) => p.id._serialized === botId
  );

  if (!botParticipant || (!botParticipant.isAdmin && !botParticipant.isSuperAdmin)) {
    log.notAdmin(msg.from);
    return { success: false, reason: 'Bot is not admin in this group' };
  }

  try {
    await msg.delete(true);
    log.deleted(msg.from);
  } catch (err) {
    log.deleteFailed(err.message);
  }

  const sender = await resolveParticipantId(msg, chat);
  try {
    await chat.removeParticipants([sender]);
    log.kicked(sender, msg.from, reason);
  } catch (err) {
    log.kickFailed(sender, err.message);
    return { success: false, reason: `Kick failed: ${err.message}` };
  }

  return { success: true, reason };
}

module.exports = { handleSpam };
