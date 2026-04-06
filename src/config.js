function loadConfig() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const logLevel = process.env.LOG_LEVEL || 'info';

  if (!geminiApiKey) {
    throw new Error('Missing required environment variable: GEMINI_API_KEY');
  }
  if (!openaiApiKey) {
    throw new Error('Missing required environment variable: OPENAI_API_KEY');
  }

  return { geminiApiKey, openaiApiKey, logLevel };
}

module.exports = { loadConfig };
