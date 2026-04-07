function loadConfig() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const logLevel = process.env.LOG_LEVEL || 'info';
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!geminiApiKey) {
    throw new Error('Missing required environment variable: GEMINI_API_KEY');
  }
  if (!openaiApiKey) {
    console.warn('[config] OPENAI_API_KEY not set — OpenAI fallback disabled');
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[config] SUPABASE_URL or SUPABASE_ANON_KEY not set — Supabase features disabled');
  }

  return {
    geminiApiKey,
    openaiApiKey: openaiApiKey || null,
    logLevel,
    supabaseUrl: supabaseUrl || null,
    supabaseAnonKey: supabaseAnonKey || null,
  };
}

module.exports = { loadConfig };
