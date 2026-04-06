async function handleSpam(msg, reason, botId) {
  const chat = await msg.getChat();

  // Check if bot is admin
  const botParticipant = chat.participants.find(
    (p) => p.id._serialized === botId
  );

  if (!botParticipant || (!botParticipant.isAdmin && !botParticipant.isSuperAdmin)) {
    console.warn(`[actions] Bot is not admin in ${msg.from}, skipping action`);
    return { success: false, reason: 'Bot is not admin in this group' };
  }

  // Delete the message (true = delete for everyone)
  try {
    await msg.delete(true);
    console.log(`[actions] Deleted message in ${msg.from}`);
  } catch (err) {
    console.warn(`[actions] Failed to delete message: ${err.message}`);
  }

  // Kick the sender
  const sender = msg.author || msg.from;
  try {
    await chat.removeParticipants([sender]);
    console.log(`[actions] Kicked ${sender} from ${msg.from} — reason: ${reason}`);
  } catch (err) {
    console.error(`[actions] Failed to kick ${sender}: ${err.message}`);
    return { success: false, reason: `Kick failed: ${err.message}` };
  }

  return { success: true, reason };
}

module.exports = { handleSpam };
