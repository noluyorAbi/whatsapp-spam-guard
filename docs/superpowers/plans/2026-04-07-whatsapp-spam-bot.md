# WhatsApp Spam Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WhatsApp bot that monitors university group chats for spam links (trading, adult, gambling) and auto-kicks offenders.

**Architecture:** Single Node.js process using whatsapp-web.js for WhatsApp connectivity, a rule engine for fast pattern matching, and Gemini/OpenAI as fallback AI classifiers for borderline cases. Messages with links are filtered → classified → actioned (delete + kick).

**Tech Stack:** Node.js, whatsapp-web.js, Google Gemini API (@google/generative-ai), OpenAI API (openai), dotenv, qrcode-terminal

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies and scripts |
| `.env.example` | Template for required env vars |
| `.gitignore` | Ignore node_modules, .env, .wwebjs_auth, .wwebjs_cache |
| `src/config.js` | Load and validate env vars |
| `src/filter.js` | Extract URLs from messages, decide if analysis needed |
| `src/rules.js` | Pattern-match links/text against known spam categories |
| `src/classifier.js` | Gemini (primary) + OpenAI (fallback) AI classification |
| `src/actions.js` | Delete message + kick user from group |
| `src/index.js` | Entry point — WhatsApp client, QR auth, message handler |
| `tests/filter.test.js` | Tests for URL extraction and filtering |
| `tests/rules.test.js` | Tests for rule engine classification |
| `tests/classifier.test.js` | Tests for AI classifier with fallback |
| `tests/actions.test.js` | Tests for action engine |

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize npm project**

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install whatsapp-web.js qrcode-terminal dotenv @google/generative-ai openai
npm install --save-dev jest
```

- [ ] **Step 3: Create .env.example**

Create `.env.example`:

```
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
LOG_LEVEL=info
```

- [ ] **Step 4: Create .gitignore**

Create `.gitignore`:

```
node_modules/
.env
.wwebjs_auth/
.wwebjs_cache/
```

- [ ] **Step 5: Add scripts to package.json**

Add to the `"scripts"` section of `package.json`:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "test": "jest"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore
git commit -m "feat: initialize project with dependencies"
```

---

### Task 2: Config Module

**Files:**
- Create: `src/config.js`
- Create: `tests/config.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/config.test.js`:

```javascript
const { loadConfig } = require('../src/config');

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns config when all required vars are set', () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';

    const config = loadConfig();

    expect(config.geminiApiKey).toBe('test-gemini-key');
    expect(config.openaiApiKey).toBe('test-openai-key');
    expect(config.logLevel).toBe('info');
  });

  test('uses LOG_LEVEL from env when set', () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.LOG_LEVEL = 'debug';

    const config = loadConfig();

    expect(config.logLevel).toBe('debug');
  });

  test('throws when GEMINI_API_KEY is missing', () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    delete process.env.GEMINI_API_KEY;

    expect(() => loadConfig()).toThrow('GEMINI_API_KEY');
  });

  test('throws when OPENAI_API_KEY is missing', () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    delete process.env.OPENAI_API_KEY;

    expect(() => loadConfig()).toThrow('OPENAI_API_KEY');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/config.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/config'`

- [ ] **Step 3: Write implementation**

Create `src/config.js`:

```javascript
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/config.test.js --verbose
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/config.js tests/config.test.js
git commit -m "feat: add config module with env validation"
```

---

### Task 3: Message Filter

**Files:**
- Create: `src/filter.js`
- Create: `tests/filter.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/filter.test.js`:

```javascript
const { extractLinks, shouldAnalyze } = require('../src/filter');

describe('extractLinks', () => {
  test('extracts standard URLs', () => {
    const text = 'Check out https://example.com and http://foo.bar/path';
    const links = extractLinks(text);
    expect(links).toEqual(['https://example.com', 'http://foo.bar/path']);
  });

  test('extracts WhatsApp invite links', () => {
    const text = 'Join here: https://chat.whatsapp.com/ABC123xyz';
    const links = extractLinks(text);
    expect(links).toEqual(['https://chat.whatsapp.com/ABC123xyz']);
  });

  test('returns empty array when no links', () => {
    const text = 'Hello everyone, how is the exam going?';
    const links = extractLinks(text);
    expect(links).toEqual([]);
  });

  test('extracts multiple mixed links', () => {
    const text = 'Visit https://trading-signals.com or join https://chat.whatsapp.com/XYZ789';
    const links = extractLinks(text);
    expect(links).toHaveLength(2);
    expect(links).toContain('https://trading-signals.com');
    expect(links).toContain('https://chat.whatsapp.com/XYZ789');
  });
});

describe('shouldAnalyze', () => {
  test('returns true for group messages with links', () => {
    const msg = {
      from: '1234@g.us',
      fromMe: false,
      body: 'Join https://chat.whatsapp.com/ABC123',
    };
    expect(shouldAnalyze(msg)).toBe(true);
  });

  test('returns false for non-group messages', () => {
    const msg = {
      from: '1234@c.us',
      fromMe: false,
      body: 'Join https://chat.whatsapp.com/ABC123',
    };
    expect(shouldAnalyze(msg)).toBe(false);
  });

  test('returns false for messages from self', () => {
    const msg = {
      from: '1234@g.us',
      fromMe: true,
      body: 'Join https://chat.whatsapp.com/ABC123',
    };
    expect(shouldAnalyze(msg)).toBe(false);
  });

  test('returns false for messages without links', () => {
    const msg = {
      from: '1234@g.us',
      fromMe: false,
      body: 'Hello everyone!',
    };
    expect(shouldAnalyze(msg)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/filter.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/filter'`

- [ ] **Step 3: Write implementation**

Create `src/filter.js`:

```javascript
const URL_REGEX = /https?:\/\/[^\s<>\"']+/gi;

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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/filter.test.js --verbose
```

Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/filter.js tests/filter.test.js
git commit -m "feat: add message filter with URL extraction"
```

---

### Task 4: Rule Engine

**Files:**
- Create: `src/rules.js`
- Create: `tests/rules.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/rules.test.js`:

```javascript
const { checkRules } = require('../src/rules');

describe('checkRules', () => {
  // --- SPAM CONFIRMED ---

  test('flags WhatsApp invite with trading keywords', () => {
    const result = checkRules(
      'Join our forex trading group! https://chat.whatsapp.com/ABC123',
      ['https://chat.whatsapp.com/ABC123']
    );
    expect(result.verdict).toBe('spam');
    expect(result.reason).toMatch(/trading|forex/i);
  });

  test('flags known trading domain', () => {
    const result = checkRules(
      'Check out https://binance.com/group-invite',
      ['https://binance.com/group-invite']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags adult content domain', () => {
    const result = checkRules(
      'Visit https://onlyfans.com/profile',
      ['https://onlyfans.com/profile']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags gambling domain', () => {
    const result = checkRules(
      'Try your luck at https://bet365.com',
      ['https://bet365.com']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags message with adult keywords and a link', () => {
    const result = checkRules(
      'Hot singles in your area https://example.com/click',
      ['https://example.com/click']
    );
    expect(result.verdict).toBe('spam');
  });

  test('flags message with betting keywords and a link', () => {
    const result = checkRules(
      'Free betting tips daily profits https://example.com/tips',
      ['https://example.com/tips']
    );
    expect(result.verdict).toBe('spam');
  });

  // --- CLEAN ---

  test('passes normal university link', () => {
    const result = checkRules(
      'Here is the lecture: https://university.edu/slides.pdf',
      ['https://university.edu/slides.pdf']
    );
    expect(result.verdict).toBe('clean');
  });

  test('passes YouTube link without spam keywords', () => {
    const result = checkRules(
      'Watch this tutorial https://youtube.com/watch?v=abc123',
      ['https://youtube.com/watch?v=abc123']
    );
    expect(result.verdict).toBe('clean');
  });

  // --- UNCERTAIN ---

  test('returns uncertain for WhatsApp invite without spam keywords', () => {
    const result = checkRules(
      'Join this group https://chat.whatsapp.com/XYZ789',
      ['https://chat.whatsapp.com/XYZ789']
    );
    expect(result.verdict).toBe('uncertain');
  });

  test('returns uncertain for unknown short URL', () => {
    const result = checkRules(
      'Click here https://bit.ly/3xAbCdE',
      ['https://bit.ly/3xAbCdE']
    );
    expect(result.verdict).toBe('uncertain');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/rules.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/rules'`

- [ ] **Step 3: Write implementation**

Create `src/rules.js`:

```javascript
const SPAM_DOMAINS = [
  // Trading/forex
  'binance.com', 'bybit.com', 'okx.com', 'kucoin.com', 'mexc.com',
  'bitget.com', 'gate.io', 'huobi.com', 'etoro.com', 'iqoption.com',
  'olymptrade.com', 'expertoption.com', 'pocket-option.com',
  // Adult
  'onlyfans.com', 'pornhub.com', 'xvideos.com', 'xhamster.com',
  'chaturbate.com', 'stripchat.com', 'livejasmin.com', 'fansly.com',
  // Gambling/betting
  'bet365.com', '1xbet.com', 'betway.com', 'stake.com', '888casino.com',
  'betfair.com', 'williamhill.com', 'unibet.com', 'parimatch.com',
  'melbet.com', '22bet.com', 'linebet.com',
];

const SPAM_KEYWORDS = [
  // Trading
  /\bforex\b/i, /\btrading\s*signals?\b/i, /\bcrypto\s*signals?\b/i,
  /\bbinary\s*options?\b/i, /\binvestment\s*group\b/i,
  /\bmake\s*money\s*fast\b/i, /\bpassive\s*income\b/i,
  /\bfinancial\s*freedom\b/i, /\bpump\s*(and|&)\s*dump\b/i,
  // Adult
  /\bhot\s*singles\b/i, /\bnudes?\b/i, /\bescort\b/i,
  /\badult\s*content\b/i, /\bxxx\b/i, /\bsexy\s*(girls?|women)\b/i,
  /\berotic\b/i, /\bfantasy\s*group\b/i,
  // Gambling
  /\bbetting\s*tips?\b/i, /\bfree\s*bets?\b/i, /\bjackpot\b/i,
  /\bcasino\s*bonus\b/i, /\bsports?\s*betting\b/i,
  /\bguaranteed\s*wins?\b/i, /\bbet\s*and\s*win\b/i,
];

const SHORT_URL_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'is.gd',
  'buff.ly', 'ow.ly', 'shorte.st', 'adf.ly',
];

function getDomain(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return hostname;
  } catch {
    return '';
  }
}

function checkRules(text, links) {
  const domains = links.map(getDomain);
  const hasWhatsAppInvite = links.some(l => l.includes('chat.whatsapp.com'));
  const hasShortUrl = domains.some(d => SHORT_URL_DOMAINS.includes(d));

  // Check for known spam domains
  for (const domain of domains) {
    if (SPAM_DOMAINS.includes(domain)) {
      return { verdict: 'spam', reason: `Known spam domain: ${domain}` };
    }
  }

  // Check for spam keywords in message text
  for (const pattern of SPAM_KEYWORDS) {
    if (pattern.test(text)) {
      return { verdict: 'spam', reason: `Matched spam keyword: ${pattern}` };
    }
  }

  // Uncertain cases: WhatsApp invites or short URLs without clear spam signals
  if (hasWhatsAppInvite || hasShortUrl) {
    return { verdict: 'uncertain', reason: 'Contains invite link or short URL without clear spam signals' };
  }

  return { verdict: 'clean', reason: 'No spam indicators found' };
}

module.exports = { checkRules };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/rules.test.js --verbose
```

Expected: 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/rules.js tests/rules.test.js
git commit -m "feat: add rule engine for spam pattern matching"
```

---

### Task 5: AI Classifier

**Files:**
- Create: `src/classifier.js`
- Create: `tests/classifier.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/classifier.test.js`:

```javascript
const { classify } = require('../src/classifier');

// Mock both AI SDKs
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn(),
      }),
    })),
  };
});

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

describe('classify', () => {
  let geminiGenerate;
  let openaiCreate;

  beforeEach(() => {
    jest.clearAllMocks();

    geminiGenerate = GoogleGenerativeAI.mock.results[0]?.value
      ?.getGenerativeModel()?.generateContent;
    openaiCreate = OpenAI.mock.results[0]?.value
      ?.chat?.completions?.create;

    // Re-require to get fresh mocks wired
    jest.resetModules();
  });

  test('returns spam=true when Gemini says spam', async () => {
    // Need to set up mocks before requiring the module
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({ spam: true, reason: 'Trading group invite' }),
            },
          }),
        }),
      })),
    }));

    const { classify: freshClassify } = require('../src/classifier');
    const config = { geminiApiKey: 'test-key', openaiApiKey: 'test-key' };
    const result = await freshClassify(config, 'Join forex group https://chat.whatsapp.com/ABC');

    expect(result.spam).toBe(true);
    expect(result.reason).toMatch(/trading/i);
  });

  test('falls back to OpenAI when Gemini fails', async () => {
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('Gemini rate limited')),
        }),
      })),
    }));

    jest.doMock('openai', () => {
      return jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: JSON.stringify({ spam: false, reason: 'Legitimate link' }) } }],
            }),
          },
        },
      }));
    });

    const { classify: freshClassify } = require('../src/classifier');
    const config = { geminiApiKey: 'test-key', openaiApiKey: 'test-key' };
    const result = await freshClassify(config, 'Check this https://example.com');

    expect(result.spam).toBe(false);
  });

  test('returns spam=false when both APIs fail (fail-open)', async () => {
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('Gemini down')),
        }),
      })),
    }));

    jest.doMock('openai', () => {
      return jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI down')),
          },
        },
      }));
    });

    const { classify: freshClassify } = require('../src/classifier');
    const config = { geminiApiKey: 'test-key', openaiApiKey: 'test-key' };
    const result = await freshClassify(config, 'Some message https://example.com');

    expect(result.spam).toBe(false);
    expect(result.reason).toMatch(/failed/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/classifier.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/classifier'`

- [ ] **Step 3: Write implementation**

Create `src/classifier.js`:

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

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
  // Try Gemini first
  try {
    return await classifyWithGemini(config.geminiApiKey, message);
  } catch (err) {
    console.warn('[classifier] Gemini failed, falling back to OpenAI:', err.message);
  }

  // Fallback to OpenAI
  try {
    return await classifyWithOpenAI(config.openaiApiKey, message);
  } catch (err) {
    console.error('[classifier] OpenAI also failed:', err.message);
  }

  // Both failed — fail open
  return { spam: false, reason: 'Classification failed — both APIs unavailable' };
}

module.exports = { classify };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/classifier.test.js --verbose
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/classifier.js tests/classifier.test.js
git commit -m "feat: add AI classifier with Gemini primary and OpenAI fallback"
```

---

### Task 6: Action Engine

**Files:**
- Create: `src/actions.js`
- Create: `tests/actions.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/actions.test.js`:

```javascript
const { handleSpam } = require('../src/actions');

describe('handleSpam', () => {
  function createMockMsg({ isAdmin = true, deleteSucceeds = true } = {}) {
    const chat = {
      removeParticipants: jest.fn().mockResolvedValue(true),
    };
    const msg = {
      delete: deleteSucceeds
        ? jest.fn().mockResolvedValue(true)
        : jest.fn().mockRejectedValue(new Error('Already deleted')),
      getChat: jest.fn().mockResolvedValue(chat),
      author: '5511999999999@c.us',
      from: 'group123@g.us',
      body: 'spam message',
    };

    // Mock the bot's admin status
    chat.participants = [
      {
        id: { _serialized: 'botid@c.us' },
        isAdmin: isAdmin,
        isSuperAdmin: false,
      },
      {
        id: { _serialized: '5511999999999@c.us' },
        isAdmin: false,
        isSuperAdmin: false,
      },
    ];

    return { msg, chat };
  }

  test('deletes message and kicks user when bot is admin', async () => {
    const { msg, chat } = createMockMsg();
    const botId = 'botid@c.us';

    const result = await handleSpam(msg, 'Spam detected', botId);

    expect(msg.delete).toHaveBeenCalledWith(true);
    expect(chat.removeParticipants).toHaveBeenCalledWith(['5511999999999@c.us']);
    expect(result.success).toBe(true);
  });

  test('logs warning and skips when bot is not admin', async () => {
    const { msg } = createMockMsg({ isAdmin: false });
    const botId = 'botid@c.us';

    const result = await handleSpam(msg, 'Spam detected', botId);

    expect(msg.delete).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/not admin/i);
  });

  test('continues kicking even if delete fails', async () => {
    const { msg, chat } = createMockMsg({ deleteSucceeds: false });
    const botId = 'botid@c.us';

    const result = await handleSpam(msg, 'Spam detected', botId);

    expect(chat.removeParticipants).toHaveBeenCalledWith(['5511999999999@c.us']);
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/actions.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/actions'`

- [ ] **Step 3: Write implementation**

Create `src/actions.js`:

```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/actions.test.js --verbose
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/actions.js tests/actions.test.js
git commit -m "feat: add action engine for message deletion and user kicking"
```

---

### Task 7: Main Entry Point

**Files:**
- Create: `src/index.js`

- [ ] **Step 1: Write the entry point**

Create `src/index.js`:

```javascript
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
```

- [ ] **Step 2: Smoke test — verify it starts (will show QR code)**

```bash
# Create a temporary .env for testing
echo "GEMINI_API_KEY=test\nOPENAI_API_KEY=test\nLOG_LEVEL=debug" > .env

# Start the bot (Ctrl+C after QR code appears to confirm it works)
timeout 30 npm start || true
```

Expected: Should print `[bot] Initializing WhatsApp client...` and eventually display a QR code (or a Puppeteer error if Chrome isn't installed — that's fine for now).

- [ ] **Step 3: Commit**

```bash
git add src/index.js
git commit -m "feat: add main entry point with message processing pipeline"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Run all tests**

```bash
npx jest --verbose
```

Expected: All tests pass (config: 4, filter: 8, rules: 10, classifier: 3, actions: 3 = 28 tests)

- [ ] **Step 2: Final commit with any fixes if needed**

```bash
git add -A
git status
# Only commit if there are changes
```
