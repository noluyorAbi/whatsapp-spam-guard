# Spam Submission Web UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Supabase-backed web UI for crowd-sourced spam submissions, admin review with one-click rule creation, bot status dashboard, and email notifications.

**Architecture:** Three components — (1) Bot writes heartbeat + polls custom rules from Supabase, (2) Next.js web UI on Vercel with public submission form + admin panel, (3) Supabase Edge Function sends email via Resend on new submissions. All communicate through Supabase tables.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, @supabase/supabase-js, Resend, Supabase Edge Functions (Deno)

---

## File Map

### Bot Changes
| File | Action | Responsibility |
|------|--------|---------------|
| `src/config.js` | Modify | Add SUPABASE_URL, SUPABASE_ANON_KEY |
| `src/supabase.js` | Create | Supabase client, heartbeat, rule polling |
| `src/rules.js` | Modify | Accept custom rules from Supabase |
| `src/index.js` | Modify | Init heartbeat + polling, track stats |
| `.env.example` | Modify | Add new env vars |
| `tests/supabase.test.js` | Create | Tests for heartbeat and rule polling |

### Web UI (new `web/` directory)
| File | Action | Responsibility |
|------|--------|---------------|
| `web/package.json` | Create | Dependencies |
| `web/next.config.js` | Create | Next.js config |
| `web/tailwind.config.js` | Create | Tailwind config |
| `web/postcss.config.js` | Create | PostCSS config |
| `web/.env.local.example` | Create | Template env vars |
| `web/app/layout.js` | Create | Root layout + global styles |
| `web/app/globals.css` | Create | Tailwind imports |
| `web/app/page.js` | Create | Public submission form |
| `web/app/admin/page.js` | Create | Admin panel |
| `web/lib/supabase.js` | Create | Supabase client init |
| `web/lib/extract-rules.js` | Create | Auto-extract domains + keywords from text |
| `web/components/SubmissionForm.js` | Create | Public form component |
| `web/components/StatusCard.js` | Create | Bot status display |
| `web/components/SubmissionList.js` | Create | Submissions list + expand/actions |
| `web/components/RuleExtractor.js` | Create | Modal for rule extraction + confirmation |
| `web/components/RulesList.js` | Create | Active custom rules list |

### Supabase Edge Function
| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/functions/notify-submission/index.ts` | Create | Email via Resend on new submission |

### SQL Migration
| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/migrations/001_create_tables.sql` | Create | All three tables + RLS policies |

---

### Task 1: Supabase Database Setup

**Files:**
- Create: `supabase/migrations/001_create_tables.sql`

- [ ] **Step 1: Create the SQL migration file**

Create `supabase/migrations/001_create_tables.sql`:

```sql
-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  message_text TEXT NOT NULL,
  submitted_by TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  reviewed_at TIMESTAMPTZ
);

-- Custom rules table
CREATE TABLE IF NOT EXISTS custom_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('domain', 'keyword')),
  value TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('trading', 'adult', 'gambling', 'academic', 'other')),
  source_submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL
);

-- Bot status table (single row, upserted)
CREATE TABLE IF NOT EXISTS bot_status (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'disconnected' NOT NULL,
  last_message_at TIMESTAMPTZ,
  messages_processed INT DEFAULT 0,
  spam_blocked INT DEFAULT 0
);

-- Insert initial bot_status row
INSERT INTO bot_status (id, status) VALUES (1, 'disconnected')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_status ENABLE ROW LEVEL SECURITY;

-- Submissions: anon can insert, anyone can read (for admin panel with anon key)
CREATE POLICY "Anyone can insert submissions" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read submissions" ON submissions FOR SELECT USING (true);
CREATE POLICY "Anyone can update submissions" ON submissions FOR UPDATE USING (true);

-- Custom rules: anyone can read (bot polls), anyone can insert/delete (admin panel uses anon key)
CREATE POLICY "Anyone can read custom_rules" ON custom_rules FOR SELECT USING (true);
CREATE POLICY "Anyone can insert custom_rules" ON custom_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete custom_rules" ON custom_rules FOR DELETE USING (true);

-- Bot status: anyone can read, anyone can upsert (bot uses anon key)
CREATE POLICY "Anyone can read bot_status" ON bot_status FOR SELECT USING (true);
CREATE POLICY "Anyone can insert bot_status" ON bot_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update bot_status" ON bot_status FOR UPDATE USING (true);
```

- [ ] **Step 2: Run the migration against Supabase**

Go to the Supabase dashboard at `https://supabase.com/dashboard/project/hydbvyhxnrojkoaewprc/sql/new` and paste the SQL above, then run it.

- [ ] **Step 3: Verify tables exist**

In Supabase SQL editor, run:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

Expected: `submissions`, `custom_rules`, `bot_status` all present.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase migration for submissions, custom_rules, bot_status"
```

---

### Task 2: Bot Config + Supabase Client

**Files:**
- Modify: `src/config.js`
- Create: `src/supabase.js`
- Modify: `.env.example`
- Modify: `.env`

- [ ] **Step 1: Update .env.example**

Add to `.env.example`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

- [ ] **Step 2: Update .env with real values**

Add to `.env`:

```
SUPABASE_URL=https://hydbvyhxnrojkoaewprc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZGJ2eWh4bnJvamtvYWV3cHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2OTIwNjEsImV4cCI6MjA1MjI2ODA2MX0.wEd14cMNDog7jPpwVF_gShKPafeugLc3pQuwvXWzKqk
```

- [ ] **Step 3: Update config.js**

Replace `src/config.js`:

```javascript
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
```

- [ ] **Step 4: Create src/supabase.js**

```javascript
const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function initSupabase(config) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }
  supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
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

async function sendHeartbeat(status) {
  if (!supabase) return;
  try {
    await supabase.from('bot_status').upsert({
      id: 1,
      updated_at: new Date().toISOString(),
      status,
      last_message_at: stats.lastMessageAt,
      messages_processed: stats.messagesProcessed,
      spam_blocked: stats.spamBlocked,
    });
  } catch (err) {
    console.warn('[supabase] Heartbeat failed:', err.message);
  }
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

// --- Custom Rules Polling ---

let customDomains = [];
let customKeywords = [];

async function pollCustomRules() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('custom_rules').select('*');
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
  incrementProcessed,
  incrementBlocked,
  startPolling,
  stopPolling,
  getCustomDomains,
  getCustomKeywords,
};
```

- [ ] **Step 5: Install @supabase/supabase-js**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 6: Commit**

```bash
git add src/config.js src/supabase.js .env.example package.json package-lock.json
git commit -m "feat: add Supabase client with heartbeat and custom rule polling"
```

---

### Task 3: Integrate Supabase into Bot

**Files:**
- Modify: `src/rules.js`
- Modify: `src/index.js`

- [ ] **Step 1: Update rules.js to use custom rules**

In `src/rules.js`, add at the top after the existing imports/constants:

```javascript
const { getCustomDomains, getCustomKeywords } = require('./supabase');
```

Then in the `checkRules` function, after the line `const domains = links.map(getDomain);`, update the domain check to include custom domains:

Find:
```javascript
  // 1. Check for known spam domains
  for (const domain of domains) {
    if (SPAM_DOMAINS.includes(domain)) {
      return { verdict: 'spam', reason: `Known spam domain: ${domain}` };
    }
  }
```

Replace with:
```javascript
  // 1. Check for known spam domains (built-in + custom from Supabase)
  const allSpamDomains = [...SPAM_DOMAINS, ...getCustomDomains()];
  for (const domain of domains) {
    if (allSpamDomains.includes(domain)) {
      return { verdict: 'spam', reason: `Known spam domain: ${domain}` };
    }
  }
```

Then after the strong keywords check, before the context keywords check, add custom keyword checking:

Find:
```javascript
  // 3. Check context keywords — only spam when promotional indicators are present
```

Add before it:
```javascript
  // 2b. Check custom keywords from Supabase
  const customKwMatch = findMatch(getCustomKeywords(), text, normalized);
  if (customKwMatch) {
    return {
      verdict: 'spam',
      reason: `Custom rule: ${customKwMatch.pattern}`,
      matchedText: customKwMatch.matched,
      context: customKwMatch.context,
      wasNormalized: customKwMatch.wasNormalized,
    };
  }

```

- [ ] **Step 2: Update index.js to init Supabase, heartbeat, polling, and track stats**

Replace `src/index.js`:

```javascript
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
});

client.on('ready', () => {
  botId = client.info.wid._serialized;
  log.ready(botId);
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
```

- [ ] **Step 3: Run existing tests to make sure nothing breaks**

```bash
npx jest --verbose
```

Expected: All existing tests pass (the supabase module returns empty arrays when not initialized, so rules.js still works).

- [ ] **Step 4: Commit**

```bash
git add src/rules.js src/index.js
git commit -m "feat: integrate Supabase heartbeat and custom rule polling into bot"
```

---

### Task 4: Web UI — Project Setup

**Files:**
- Create: `web/package.json`
- Create: `web/next.config.js`
- Create: `web/tailwind.config.js`
- Create: `web/postcss.config.js`
- Create: `web/.env.local.example`
- Create: `web/app/layout.js`
- Create: `web/app/globals.css`
- Create: `web/lib/supabase.js`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot
mkdir -p web
cd web
npx create-next-app@latest . --js --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-turbopack
```

When prompted, accept defaults.

- [ ] **Step 2: Install Supabase client**

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot/web
npm install @supabase/supabase-js
```

- [ ] **Step 3: Create .env.local.example**

Create `web/.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password_here
```

- [ ] **Step 4: Create .env.local with real values**

Create `web/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://hydbvyhxnrojkoaewprc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZGJ2eWh4bnJvamtvYWV3cHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2OTIwNjEsImV4cCI6MjA1MjI2ODA2MX0.wEd14cMNDog7jPpwVF_gShKPafeugLc3pQuwvXWzKqk
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
```

- [ ] **Step 5: Create Supabase client lib**

Create `web/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 6: Update root layout**

Replace `web/app/layout.js`:

```javascript
import './globals.css';

export const metadata = {
  title: 'WhatsApp Spam Guard',
  description: 'Report spam in university WhatsApp groups',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Update .gitignore in web/**

Add to `web/.gitignore` (should already exist from create-next-app):

```
.env.local
```

- [ ] **Step 8: Verify dev server starts**

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot/web
npm run dev
```

Expected: Next.js dev server starts on http://localhost:3000.

- [ ] **Step 9: Commit**

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot
git add web/ .gitignore
git commit -m "feat: initialize Next.js web UI project with Tailwind and Supabase"
```

---

### Task 5: Public Submission Form

**Files:**
- Create: `web/components/SubmissionForm.js`
- Modify: `web/app/page.js`

- [ ] **Step 1: Create SubmissionForm component**

Create `web/components/SubmissionForm.js`:

```javascript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SubmissionForm() {
  const [messageText, setMessageText] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!messageText.trim()) return;

    setStatus('submitting');
    const { error } = await supabase.from('submissions').insert({
      message_text: messageText.trim(),
      submitted_by: submittedBy.trim() || null,
    });

    if (error) {
      console.error('Submission failed:', error);
      setStatus('error');
    } else {
      setStatus('success');
      setMessageText('');
      setSubmittedBy('');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
          Paste the spam message
        </label>
        <textarea
          id="message"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={6}
          required
          placeholder="Paste the full spam message here..."
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-y"
        />
      </div>

      <div>
        <label htmlFor="submittedBy" className="block text-sm font-medium text-gray-300 mb-1">
          Your name or email <span className="text-gray-500">(optional)</span>
        </label>
        <input
          id="submittedBy"
          type="text"
          value={submittedBy}
          onChange={(e) => setSubmittedBy(e.target.value)}
          placeholder="So we can follow up if needed"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting' || !messageText.trim()}
        className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors"
      >
        {status === 'submitting' ? 'Submitting...' : 'Report Spam'}
      </button>

      {status === 'success' && (
        <p className="text-green-400 text-sm text-center">Thanks! Your report has been submitted for review.</p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm text-center">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Create the public page**

Replace `web/app/page.js`:

```javascript
import SubmissionForm from '@/components/SubmissionForm';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🛡️ WhatsApp Spam Guard
          </h1>
          <p className="text-gray-400">
            Seen spam in a university WhatsApp group? Report it here and help keep groups clean.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <SubmissionForm />
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Submissions are reviewed by an admin before any action is taken.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify in browser**

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot/web && npm run dev
```

Open http://localhost:3000 — should show the submission form. Submit a test message and verify it appears in Supabase dashboard under the `submissions` table.

- [ ] **Step 4: Commit**

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot
git add web/components/SubmissionForm.js web/app/page.js
git commit -m "feat: add public spam submission form"
```

---

### Task 6: Admin Panel — Status Card + Auth Gate

**Files:**
- Create: `web/components/StatusCard.js`
- Create: `web/app/admin/page.js`

- [ ] **Step 1: Create StatusCard component**

Create `web/components/StatusCard.js`:

```javascript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function StatusCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    const { data, error } = await supabase
      .from('bot_status')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      setStatus(null);
    } else {
      setStatus(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-32" />;
  }

  if (!status) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-500">No bot status data available.</p>
      </div>
    );
  }

  const lastUpdate = new Date(status.updated_at);
  const secondsAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
  const isConnected = status.status === 'connected' && secondsAgo < 90;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Bot Status</h2>
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
          isConnected
            ? 'bg-green-900/50 text-green-400 border border-green-800'
            : 'bg-red-900/50 text-red-400 border border-red-800'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Last Heartbeat</p>
          <p className="text-white font-mono">{secondsAgo}s ago</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Last Message</p>
          <p className="text-white font-mono">
            {status.last_message_at
              ? new Date(status.last_message_at).toLocaleTimeString()
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Messages Analyzed</p>
          <p className="text-white text-xl font-bold">{status.messages_processed}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Spam Blocked</p>
          <p className="text-red-400 text-xl font-bold">{status.spam_blocked}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create admin page with password gate**

Create `web/app/admin/page.js`:

```javascript
'use client';

import { useState } from 'react';
import StatusCard from '@/components/StatusCard';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  function handleLogin(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
            >
              Login
            </button>
            {error && <p className="text-red-400 text-sm text-center">Wrong password.</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">🛡️ Spam Guard Admin</h1>
        <button
          onClick={() => setAuthed(false)}
          className="text-gray-500 hover:text-gray-300 text-sm"
        >
          Logout
        </button>
      </div>

      <StatusCard />

      {/* Submissions and Rules will be added in next tasks */}
      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-500">Submissions list coming next...</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:3000/admin — should show password form. Enter `admin123` → should show bot status card and placeholder.

- [ ] **Step 4: Commit**

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot
git add web/components/StatusCard.js web/app/admin/
git commit -m "feat: add admin panel with password gate and bot status card"
```

---

### Task 7: Admin Panel — Submissions List

**Files:**
- Create: `web/components/SubmissionList.js`

- [ ] **Step 1: Create SubmissionList component**

Create `web/components/SubmissionList.js`:

```javascript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const STATUS_COLORS = {
  pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  approved: 'bg-green-900/50 text-green-400 border-green-800',
  dismissed: 'bg-gray-800 text-gray-500 border-gray-700',
};

export default function SubmissionList({ onAddRule }) {
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchSubmissions() {
    let query = supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (!error) setSubmissions(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  async function dismiss(id) {
    await supabase
      .from('submissions')
      .update({ status: 'dismissed', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    fetchSubmissions();
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Submissions</h2>
        <div className="flex gap-1">
          {['pending', 'approved', 'dismissed', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-lg" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No {filter === 'all' ? '' : filter} submissions.</p>
      ) : (
        <div className="space-y-2">
          {submissions.map((sub) => (
            <div key={sub.id} className="border border-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                className="w-full p-4 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-sm truncate">
                      {sub.message_text.substring(0, 100)}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {new Date(sub.created_at).toLocaleString()}
                      {sub.submitted_by && ` · by ${sub.submitted_by}`}
                    </p>
                  </div>
                  <span className={`ml-3 px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[sub.status]}`}>
                    {sub.status}
                  </span>
                </div>
              </button>

              {expandedId === sub.id && (
                <div className="px-4 pb-4 border-t border-gray-800">
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap mt-3 p-3 bg-gray-800 rounded-lg max-h-64 overflow-y-auto">
                    {sub.message_text}
                  </pre>

                  {sub.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onAddRule(sub)}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Add to Rules
                      </button>
                      <button
                        onClick={() => dismiss(sub.id)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add to admin page**

In `web/app/admin/page.js`, add the import at the top:

```javascript
import SubmissionList from '@/components/SubmissionList';
```

Replace the placeholder div:

```javascript
      {/* Submissions and Rules will be added in next tasks */}
      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-500">Submissions list coming next...</p>
      </div>
```

With:

```javascript
      <div className="mt-6">
        <SubmissionList onAddRule={(sub) => console.log('Add rule for:', sub)} />
      </div>
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:3000/admin, login, should see submissions list. If you submitted a test message in Task 5, it should appear here.

- [ ] **Step 4: Commit**

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot
git add web/components/SubmissionList.js web/app/admin/page.js
git commit -m "feat: add submissions list with expand/dismiss to admin panel"
```

---

### Task 8: Rule Extractor + Rules List

**Files:**
- Create: `web/lib/extract-rules.js`
- Create: `web/components/RuleExtractor.js`
- Create: `web/components/RulesList.js`
- Modify: `web/app/admin/page.js`

- [ ] **Step 1: Create rule extraction utility**

Create `web/lib/extract-rules.js`:

```javascript
const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

export function extractDomains(text) {
  const urls = text.match(URL_REGEX) || [];
  const domains = new Set();
  for (const url of urls) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      // Skip common legitimate domains
      const skip = ['youtube.com', 'google.com', 'github.com', 'chat.whatsapp.com', 'wa.me'];
      if (!skip.includes(hostname)) {
        domains.add(hostname);
      }
    } catch {
      // invalid URL
    }
  }
  return [...domains];
}

export function extractKeywords(text) {
  // Normalize unicode first (simple version — strip non-ASCII formatting)
  const normalized = text.normalize('NFKD').replace(/[^\x00-\x7F]/g, '').toLowerCase();

  const patterns = [
    { regex: /assignment\s*(help|service|writing)/gi, label: 'assignment help/service/writing' },
    { regex: /essay\s*writing/gi, label: 'essay writing' },
    { regex: /thesis\s*writing/gi, label: 'thesis writing' },
    { regex: /dissertation\s*writing/gi, label: 'dissertation writing' },
    { regex: /trading\s*signals?/gi, label: 'trading signals' },
    { regex: /crypto\s*signals?/gi, label: 'crypto signals' },
    { regex: /forex/gi, label: 'forex' },
    { regex: /betting\s*tips?/gi, label: 'betting tips' },
    { regex: /casino\s*bonus/gi, label: 'casino bonus' },
    { regex: /passive\s*income/gi, label: 'passive income' },
    { regex: /financial\s*freedom/gi, label: 'financial freedom' },
    { regex: /grade\s*guarante/gi, label: 'grade guarantee' },
    { regex: /zero\s*plagiarism/gi, label: 'zero plagiarism' },
    { regex: /academic\s*writing/gi, label: 'academic writing' },
    { regex: /professional\s*expert/gi, label: 'professional expert' },
  ];

  const found = [];
  for (const { regex, label } of patterns) {
    if (regex.test(text) || regex.test(normalized)) {
      found.push(label);
    }
  }
  return [...new Set(found)];
}
```

- [ ] **Step 2: Create RuleExtractor modal component**

Create `web/components/RuleExtractor.js`:

```javascript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { extractDomains, extractKeywords } from '@/lib/extract-rules';

const CATEGORIES = ['trading', 'adult', 'gambling', 'academic', 'other'];

export default function RuleExtractor({ submission, onClose, onDone }) {
  const [domains, setDomains] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState(new Set());
  const [selectedKeywords, setSelectedKeywords] = useState(new Set());
  const [category, setCategory] = useState('academic');
  const [customKeyword, setCustomKeyword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d = extractDomains(submission.message_text);
    const k = extractKeywords(submission.message_text);
    setDomains(d);
    setKeywords(k);
    setSelectedDomains(new Set(d));
    setSelectedKeywords(new Set(k));
  }, [submission]);

  function toggleDomain(d) {
    const next = new Set(selectedDomains);
    next.has(d) ? next.delete(d) : next.add(d);
    setSelectedDomains(next);
  }

  function toggleKeyword(k) {
    const next = new Set(selectedKeywords);
    next.has(k) ? next.delete(k) : next.add(k);
    setSelectedKeywords(next);
  }

  function addCustomKeyword() {
    if (!customKeyword.trim()) return;
    const k = customKeyword.trim();
    setKeywords((prev) => [...prev, k]);
    setSelectedKeywords((prev) => new Set([...prev, k]));
    setCustomKeyword('');
  }

  async function handleSave() {
    setSaving(true);

    const rules = [];
    for (const d of selectedDomains) {
      rules.push({
        type: 'domain',
        value: d,
        category,
        source_submission_id: submission.id,
      });
    }
    for (const k of selectedKeywords) {
      rules.push({
        type: 'keyword',
        value: `\\b${k.replace(/\s+/g, '\\s*')}\\b`,
        category,
        source_submission_id: submission.id,
      });
    }

    if (rules.length > 0) {
      await supabase.from('custom_rules').insert(rules);
    }

    await supabase
      .from('submissions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', submission.id);

    setSaving(false);
    onDone();
  }

  const totalSelected = selectedDomains.size + selectedKeywords.size;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Extract Rules</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  category === c
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {domains.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-300 mb-2">Domains found</p>
            <div className="space-y-1">
              {domains.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDomains.has(d)}
                    onChange={() => toggleDomain(d)}
                    className="rounded border-gray-600"
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>
        )}

        {keywords.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-300 mb-2">Keywords found</p>
            <div className="space-y-1">
              {keywords.map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedKeywords.has(k)}
                    onChange={() => toggleKeyword(k)}
                    className="rounded border-gray-600"
                  />
                  {k}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-300 mb-2">Add custom keyword</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomKeyword())}
              placeholder="e.g. exam help"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={addCustomKeyword}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {domains.length === 0 && keywords.length === 0 && (
          <p className="text-gray-500 text-sm mb-4">No domains or keywords auto-detected. Add custom keywords above.</p>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || totalSelected === 0}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : `Add ${totalSelected} Rule${totalSelected !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create RulesList component**

Create `web/components/RulesList.js`:

```javascript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const CATEGORY_COLORS = {
  trading: 'text-yellow-400',
  adult: 'text-red-400',
  gambling: 'text-purple-400',
  academic: 'text-blue-400',
  other: 'text-gray-400',
};

export default function RulesList({ refreshKey }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchRules() {
    const { data, error } = await supabase
      .from('custom_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setRules(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchRules();
  }, [refreshKey]);

  async function deleteRule(id) {
    await supabase.from('custom_rules').delete().eq('id', id);
    fetchRules();
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">
        Custom Rules <span className="text-gray-500 font-normal text-sm">({rules.length})</span>
      </h2>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-10 bg-gray-800 rounded-lg" />)}
        </div>
      ) : rules.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No custom rules yet. Approve submissions to add rules.</p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  rule.type === 'domain' ? 'bg-orange-900/50 text-orange-400' : 'bg-indigo-900/50 text-indigo-400'
                }`}>
                  {rule.type}
                </span>
                <span className="text-gray-300 text-sm truncate font-mono">{rule.value}</span>
                <span className={`text-xs ${CATEGORY_COLORS[rule.category] || 'text-gray-400'}`}>
                  {rule.category}
                </span>
              </div>
              <button
                onClick={() => deleteRule(rule.id)}
                className="text-gray-600 hover:text-red-400 text-sm ml-2 transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Wire everything into admin page**

Replace `web/app/admin/page.js`:

```javascript
'use client';

import { useState } from 'react';
import StatusCard from '@/components/StatusCard';
import SubmissionList from '@/components/SubmissionList';
import RuleExtractor from '@/components/RuleExtractor';
import RulesList from '@/components/RulesList';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [extractSub, setExtractSub] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleLogin(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
            >
              Login
            </button>
            {error && <p className="text-red-400 text-sm text-center">Wrong password.</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">🛡️ Spam Guard Admin</h1>
        <button
          onClick={() => setAuthed(false)}
          className="text-gray-500 hover:text-gray-300 text-sm"
        >
          Logout
        </button>
      </div>

      <StatusCard />

      <div className="mt-6">
        <SubmissionList onAddRule={(sub) => setExtractSub(sub)} />
      </div>

      <div className="mt-6">
        <RulesList refreshKey={refreshKey} />
      </div>

      {extractSub && (
        <RuleExtractor
          submission={extractSub}
          onClose={() => setExtractSub(null)}
          onDone={() => {
            setExtractSub(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 5: Verify in browser**

Open http://localhost:3000/admin — login, see status card, submissions, rules list, test "Add to Rules" flow.

- [ ] **Step 6: Commit**

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot
git add web/lib/extract-rules.js web/components/RuleExtractor.js web/components/RulesList.js web/app/admin/page.js
git commit -m "feat: add rule extractor modal and custom rules list to admin panel"
```

---

### Task 9: Email Notification Edge Function

**Files:**
- Create: `supabase/functions/notify-submission/index.ts`

- [ ] **Step 1: Create the edge function**

Create `supabase/functions/notify-submission/index.ts`:

```typescript
import "https://deno.land/x/xhr@0.3.0/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const ADMIN_EMAIL = "alperen.adatepe1905@gmail.com";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { record } = payload;

    if (!record || !record.message_text) {
      return new Response(JSON.stringify({ error: "No record" }), { status: 400 });
    }

    const messagePreview = record.message_text.substring(0, 500);
    const submittedBy = record.submitted_by || "Anonymous";
    const timestamp = new Date(record.created_at).toLocaleString("en-GB", {
      timeZone: "Europe/Berlin",
    });

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0891b2;">🛡️ New Spam Submission</h2>
        <p><strong>Submitted by:</strong> ${submittedBy}</p>
        <p><strong>Time:</strong> ${timestamp}</p>
        <hr style="border: 1px solid #e5e7eb;" />
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <pre style="white-space: pre-wrap; word-break: break-word; font-size: 14px; color: #374151;">${messagePreview}</pre>
        </div>
        <p>
          <a href="https://your-app.vercel.app/admin" style="background: #0891b2; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Review in Admin Panel
          </a>
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Spam Guard <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `New Spam Report: ${messagePreview.substring(0, 50)}...`,
        html: emailHtml,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

- [ ] **Step 2: Deploy the edge function**

Install Supabase CLI if not installed:

```bash
npm install -g supabase
```

Link to your project and deploy:

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot
supabase login
supabase link --project-ref hydbvyhxnrojkoaewprc
supabase secrets set RESEND_API_KEY=re_FjBRFrKh_MyCR9woTKpXuaBf4VxCjGi2R
supabase functions deploy notify-submission
```

- [ ] **Step 3: Create database webhook in Supabase dashboard**

Go to Supabase Dashboard → Database → Webhooks → Create new:

- **Name:** `notify-on-submission`
- **Table:** `submissions`
- **Events:** `INSERT`
- **Type:** Supabase Edge Function
- **Function:** `notify-submission`

- [ ] **Step 4: Test the webhook**

Submit a spam message via the public form. Check your email at `alperen.adatepe1905@gmail.com` — should receive the notification.

- [ ] **Step 5: Commit**

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot
git add supabase/functions/
git commit -m "feat: add Supabase Edge Function for email notifications via Resend"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run bot tests**

```bash
cd /Users/alperen/repos/universityRepos/uni-whatsapp-bot
npx jest --verbose
```

Expected: All existing tests pass.

- [ ] **Step 2: End-to-end flow test**

1. Start the bot: `npm start` — verify heartbeat appears in Supabase `bot_status` table
2. Start web UI: `cd web && npm run dev`
3. Open http://localhost:3000 — submit a spam message
4. Check email — should receive Resend notification
5. Open http://localhost:3000/admin — login, see the submission
6. Click "Add to Rules" → select domains/keywords → confirm
7. Verify rules appear in `custom_rules` table
8. Wait 60 seconds for bot to poll new rules
9. Check bot console logs for "Loaded X custom domains, Y custom keywords"

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A && git status
```
