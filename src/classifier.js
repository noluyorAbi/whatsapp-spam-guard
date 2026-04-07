const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const log = require('./logger');

const PROMPT = `You are a spam detection system for university WhatsApp groups. Analyze the following message and determine if it is spam related to: trading, forex, cryptocurrency scams, adult/erotic content, gambling, betting, or similar promotional/scam groups.

Message: "{MESSAGE}"

Respond ONLY with valid JSON (no markdown, no code fences): {"spam": true/false, "reason": "brief explanation"}`;

function parseAIResponse(text) {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);
  return { spam: Boolean(parsed.spam), reason: String(parsed.reason) };
}

async function classifyWithGemini(apiKey, message) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(PROMPT.replace('{MESSAGE}', message));
  const text = result.response.text();
  return parseAIResponse(text);
}

async function classifyWithOpenAI(apiKey, message) {
  const openai = new OpenAI({ apiKey });
  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: PROMPT.replace('{MESSAGE}', message) }],
    temperature: 0,
  });
  const text = result.choices[0].message.content;
  return parseAIResponse(text);
}

async function classify(config, message) {
  try {
    return await classifyWithGemini(config.geminiApiKey, message);
  } catch (err) {
    log.aiGeminiFailed(err.message);
  }

  if (config.openaiApiKey) {
    try {
      return await classifyWithOpenAI(config.openaiApiKey, message);
    } catch (err) {
      // OpenAI also failed
    }
  }

  log.aiBothFailed();
  return { spam: false, reason: 'Classification failed — both APIs unavailable' };
}

module.exports = { classify };
