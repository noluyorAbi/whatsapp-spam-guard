<div align="center">

# 🛡️ WhatsApp Spam Guard

**Autonomous spam detection bot for university WhatsApp groups**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

<br />

<img src="https://img.shields.io/badge/trading_bots-blocked-red?style=for-the-badge" alt="Trading bots blocked" />
<img src="https://img.shields.io/badge/adult_spam-blocked-red?style=for-the-badge" alt="Adult spam blocked" />
<img src="https://img.shields.io/badge/gambling_ads-blocked-red?style=for-the-badge" alt="Gambling ads blocked" />
<img src="https://img.shields.io/badge/assignment_fraud-blocked-red?style=for-the-badge" alt="Assignment fraud blocked" />

<br /><br />

*Automatically detects and removes spam messages from university WhatsApp groups — trading signals, adult content, gambling promotions, academic fraud services — and kicks the sender. Managed entirely through a web-based admin panel.*

</div>

---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [How It Works](#-how-it-works)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Admin Panel](#-admin-panel)
- [Detection Engine](#-detection-engine)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)

---

## 🚨 The Problem

University WhatsApp groups are constantly targeted by spam bots posting:

| Category | Examples |
|----------|---------|
| **Trading / Forex** | "Join our forex trading group!", Binance invite links |
| **Adult Content** | OnlyFans promotions, explicit group invites |
| **Gambling / Betting** | Bet365 links, "guaranteed wins" schemes |
| **Academic Fraud** | "Assignment writing service", "Get 80+ grade guaranteed" |

These spammers use **Unicode fancy text** (like `𝗔𝘀𝘀𝗶𝗴𝗻𝗺𝗲𝗻𝘁𝘀`) to evade keyword detection, `wa.me` direct links instead of group invites, and rotating phone numbers.

**WhatsApp Spam Guard** sits in your groups as an admin, analyzes every message with links, and **automatically deletes spam + kicks the sender** — in under a second.

---

## ⚙️ How It Works

```
Message with link arrives in group
         │
         ▼
   ┌─────────────┐
   │  URL Filter  │──── No links? → Ignore
   └─────┬───────┘
         │ Has links
         ▼
   ┌─────────────┐
   │ Rule Engine  │──── Known spam domain? → 🚫 Delete + Kick
   │  (instant)   │──── Spam keywords? → 🚫 Delete + Kick
   └─────┬───────┘
         │ Uncertain
         ▼
   ┌─────────────┐
   │ AI Classifier│──── Gemini API (primary)
   │  (fallback)  │──── OpenAI API (backup)
   └─────┬───────┘
         │
    Spam? ──Yes──→ 🚫 Delete + Kick
         │
    No ──────────→ ✅ Allow
```

### Three-Layer Detection

<table>
<tr>
<td width="33%" valign="top">

**Layer 1: Rule Engine**
<br/><sub>⚡ Instant, zero cost</sub>

- 31 known spam domains
- 25+ keyword patterns with regex
- Unicode text normalization (defeats fancy text evasion)
- Two-tier keywords: strong signals (always spam) vs. context-dependent (only spam with promotional indicators)

</td>
<td width="33%" valign="top">

**Layer 2: AI Classifier**
<br/><sub>🧠 For borderline cases</sub>

- Gemini 2.0 Flash (primary — fast, cheap)
- GPT-4o-mini (fallback)
- Fail-open: if both APIs fail, message is allowed through
- Only triggered for uncertain cases (WhatsApp invites without keywords, shortened URLs)

</td>
<td width="33%" valign="top">

**Layer 3: Custom Rules**
<br/><sub>📏 Community-powered</sub>

- Admin adds rules via web panel
- Rules stored in Supabase
- Bot polls every 60 seconds
- Domains and keyword patterns
- Sourced from user-submitted spam reports

</td>
</tr>
</table>

### False Positive Prevention

The bot uses a **two-tier keyword system** to avoid kicking students who use words like "thesis writing" in legitimate conversation:

| Type | Example | Action |
|------|---------|--------|
| **Strong keyword** | "forex", "hot singles", "grade guaranteer" | Always spam — immediate kick |
| **Context keyword** | "thesis writing", "assignment help" | Only spam when combined with promotional indicators (`wa.me` links, "30% discount", phone numbers, "our service provides") |

> *"Can someone help my thesis writing?"* → **Allowed** (no promo indicators)
>
> *"𝗧𝗵𝗲𝘀𝗶𝘀 𝗪𝗿𝗶𝘁𝗶𝗻𝗴 𝗛𝗲𝗹𝗽 📚 30% discount https://wa.me/923271400814"* → **Spam** (context keyword + multiple promo indicators + Unicode evasion detected)

---

## 🏗 Architecture

```
┌──────────────────┐     ┌───────────────┐     ┌──────────────────┐
│   Admin Panel    │     │   Supabase    │     │   WhatsApp Bot   │
│   (Vercel)       │────▶│               │◀────│   (Oracle/VPS)   │
│                  │     │  submissions  │     │                  │
│  • Bot status    │     │  custom_rules │     │  • Message scan  │
│  • QR code scan  │     │  bot_status   │     │  • Heartbeat     │
│  • Submissions   │     │               │     │  • Rule polling  │
│  • Rule mgmt     │     └───────┬───────┘     │  • Auto-reconnect│
│  • Spam reports  │             │              └──────────────────┘
└──────────────────┘     ┌───────▼───────┐
                         │    Resend     │
┌──────────────────┐     │  Email notify │
│  Public Form     │     │  on new spam  │
│  (Vercel)        │────▶│  submission   │
│  • Report spam   │     └───────────────┘
└──────────────────┘
```

---

## ✨ Features

### Bot
- **Real-time spam detection** — analyzes every group message with links
- **Auto-kick + delete** — removes spam and the sender instantly
- **Unicode normalization** — detects spam hidden in fancy Unicode text (`𝗕𝗼𝗹𝗱`, `𝐼𝑡𝑎𝑙𝑖𝑐`, `𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎`)
- **AI fallback** — Gemini/OpenAI for messages the rule engine can't classify
- **Heartbeat** — reports status to Supabase every 30 seconds
- **Custom rules** — polls new rules from Supabase every 60 seconds
- **Auto-reconnect** — reconnects to WhatsApp automatically on disconnect
- **Color-coded logs** — beautiful terminal output with match context highlighting

### Admin Panel
- **QR code in browser** — connect WhatsApp without terminal access
- **Live bot status** — connected/disconnected, heartbeat age, message stats
- **Spam submissions** — review crowd-sourced spam reports
- **One-click rule creation** — auto-extracts domains and keywords from submissions
- **Custom keyword/domain rules** — add manual detection patterns
- **Password-protected** — simple auth gate for admin access

### Public Form
- **Crowd-sourced spam reporting** — anyone can submit spam they've seen
- **Email notifications** — admin gets notified via Resend on new submissions
- **Clean, dark UI** — modern design that works on mobile

---

## 🛠 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Bot** | Node.js, whatsapp-web.js, Puppeteer | WhatsApp connection, message processing |
| **Rule Engine** | Custom (regex, domain lists) | Fast spam pattern matching |
| **AI Classifier** | Gemini 2.0 Flash, GPT-4o-mini | Borderline case classification |
| **Web UI** | Next.js 15, Tailwind CSS, React | Admin panel + public form |
| **Database** | Supabase (PostgreSQL) | Submissions, rules, bot status |
| **Email** | Resend + Supabase Edge Functions | New submission notifications |
| **Process Mgmt** | PM2 | Bot auto-restart, background running |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **A phone number** dedicated to the bot
- **API keys**: Gemini (required), OpenAI (optional fallback)
- **Supabase project** (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/uni-whatsapp-bot.git
cd uni-whatsapp-bot
npm install
cd web && npm install && cd ..
```

### 2. Set Up Supabase

Run the migration in your Supabase SQL editor:

```bash
# Or via psql / pg client:
node -e "
const { Client } = require('pg');
const fs = require('fs');
const client = new Client({ connectionString: 'YOUR_DATABASE_URL' });
client.connect()
  .then(() => client.query(fs.readFileSync('supabase/migrations/001_create_tables.sql', 'utf8')))
  .then(() => { console.log('Done'); client.end(); });
"
```

### 3. Configure Environment

**Bot** (`.env` in project root):

```env
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key          # optional
LOG_LEVEL=info                           # debug for verbose output
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

**Web UI** (`web/.env.local`):

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
ADMIN_PASSWORD=your_secure_password
```

### 4. Run

```bash
# Both bot + web UI together:
npm run dev

# Or separately:
npm start              # bot only
cd web && npm run dev  # web UI only

# Background (production):
npm run start:bg       # pm2 daemon
npm run logs           # view logs
npm run stop           # stop bot
```

### 5. Connect WhatsApp

1. Open the admin panel at `http://localhost:27893/admin`
2. Scan the QR code with your bot's phone number
3. Add the bot to your university groups
4. **Make it a group admin** (required for delete + kick)

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Where | Description |
|----------|----------|-------|-------------|
| `GEMINI_API_KEY` | Yes | Bot | Google Gemini API key |
| `OPENAI_API_KEY` | No | Bot | OpenAI fallback (optional) |
| `LOG_LEVEL` | No | Bot | `debug` / `info` (default) / `warn` / `error` |
| `SUPABASE_URL` | Yes | Both | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Both | Supabase anonymous key |
| `ADMIN_PASSWORD` | Yes | Web | Admin panel password |
| `RESEND_API_KEY` | Yes | Edge Fn | Resend email API key |

---

## 🖥 Admin Panel

### Bot Status

The bot sends a heartbeat to Supabase every 30 seconds. The admin panel shows:

- **Connected** (green) — bot is online and scanning
- **Waiting for QR Scan** (yellow) — scan the displayed QR code to connect
- **Disconnected** (red) — bot is offline or heartbeat stale (>90s)

### Submission Review

1. Users submit spam via the public form at `/`
2. Admin receives email notification via Resend
3. In `/admin`, click a pending submission to expand it
4. **"Add to Rules"** — auto-extracts domains + keywords, select category, confirm
5. **"Dismiss"** — mark as not spam
6. Bot picks up new rules within 60 seconds

---

## 🔍 Detection Engine

### Built-in Spam Domains (31)

<details>
<summary>Click to expand full list</summary>

**Trading**: binance.com, bybit.com, okx.com, kucoin.com, mexc.com, bitget.com, gate.io, huobi.com, etoro.com, iqoption.com, olymptrade.com, expertoption.com, pocket-option.com

**Adult**: onlyfans.com, pornhub.com, xvideos.com, xhamster.com, chaturbate.com, stripchat.com, livejasmin.com, fansly.com

**Gambling**: bet365.com, 1xbet.com, betway.com, stake.com, 888casino.com, betfair.com, williamhill.com, unibet.com, parimatch.com, melbet.com, 22bet.com, linebet.com

</details>

### Keyword Categories

<details>
<summary>Click to expand keyword patterns</summary>

**Strong Signals** (always spam):
- Trading: `forex`, `trading signals`, `crypto signals`, `binary options`, `investment group`, `passive income`, `financial freedom`
- Adult: `hot singles`, `nudes`, `escort`, `adult content`, `xxx`, `erotic`
- Gambling: `betting tips`, `free bets`, `jackpot`, `casino bonus`, `sports betting`, `guaranteed wins`
- Academic fraud: `grade guaranteer`, `get 80+ grade`, `academic writing service`, `zero plagiarism`, `money back guarantee`

**Context-Dependent** (only spam with promo indicators):
- `assignment help/service/writing`, `essay writing`, `thesis writing`, `dissertation writing`, `professional expert`, `contact us`, `our service`, `book your`

**Promotional Indicators**:
- `wa.me/` links, phone numbers (`+923...`), `% discount`, `our service provides`, `years experience`, `customer support`, `affordable`, `good grades guarantee`

</details>

### Unicode Normalization

The bot converts 500+ Unicode mathematical/styled character variants to ASCII before matching:

```
𝗔𝘀𝘀𝗶𝗴𝗻𝗺𝗲𝗻𝘁𝘀  →  Assignments    (Sans-serif Bold)
𝐀𝐬𝐬𝐢𝐠𝐧𝐦𝐞𝐧𝐭𝐬  →  Assignments    (Bold)
𝘈𝘴𝘴𝘪𝘨𝘯𝘮𝘦𝘯𝘵𝘴  →  Assignments    (Italic)
𝙰𝚜𝚜𝚒𝚐𝚗𝚖𝚎𝚗𝚝𝚜  →  Assignments    (Monospace)
𝟹𝟶% 𝚍𝚒𝚜𝚌𝚘𝚞𝚗𝚝  →  30% discount   (Monospace digits)
```

---

## 🌐 Deployment

### Bot (Oracle Cloud Free Tier / VPS)

```bash
# On your server:
git clone <repo>
cd uni-whatsapp-bot
npm install
cp .env.example .env  # fill in your keys

# Start with pm2:
npm run start:bg

# Connect via admin panel, then the bot runs forever
```

### Web UI (Vercel)

```bash
cd web
npx vercel

# Set env vars in Vercel dashboard:
# SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_PASSWORD
```

### Email Notifications (Supabase Edge Function)

```bash
supabase link --project-ref <your-project-ref>
supabase secrets set RESEND_API_KEY=<your-key>
supabase functions deploy notify-submission
```

Then create a database webhook in Supabase Dashboard → Database → Webhooks:
- Table: `uni-wa-bot-submissions`
- Event: `INSERT`
- Function: `notify-submission`

---

## 📁 Project Structure

```
uni-whatsapp-bot/
├── src/                        # Bot source code
│   ├── index.js                # Entry point — WhatsApp client, message pipeline
│   ├── config.js               # Environment variable loading
│   ├── filter.js               # URL extraction, message filtering
│   ├── rules.js                # Rule engine (domains, keywords, Unicode normalization)
│   ├── classifier.js           # AI classification (Gemini + OpenAI fallback)
│   ├── actions.js              # Delete message + kick user
│   ├── supabase.js             # Heartbeat, QR code sync, custom rule polling
│   └── logger.js               # Color-coded terminal logging
├── tests/                      # Jest test suites (41 tests)
│   ├── config.test.js
│   ├── filter.test.js
│   ├── rules.test.js
│   ├── classifier.test.js
│   └── actions.test.js
├── web/                        # Next.js admin panel + public form
│   ├── app/
│   │   ├── page.js             # Public spam submission form
│   │   ├── admin/page.js       # Admin panel (auth, status, submissions, rules)
│   │   └── api/                # Server-side API routes (Supabase calls)
│   │       ├── submissions/route.js
│   │       ├── status/route.js
│   │       ├── rules/route.js
│   │       └── admin/route.js
│   ├── components/
│   │   ├── SubmissionForm.js   # Public submission form
│   │   ├── StatusCard.js       # Bot status + QR code display
│   │   ├── SubmissionList.js   # Submission review list
│   │   ├── RuleExtractor.js    # Rule extraction modal
│   │   └── RulesList.js        # Active custom rules
│   └── lib/
│       ├── supabase.js         # Supabase client (server-only)
│       └── extract-rules.js    # Domain/keyword extraction utility
├── supabase/
│   ├── migrations/             # Database schema
│   └── functions/              # Edge functions (email notifications)
├── ecosystem.config.js         # PM2 configuration
├── package.json
└── .env.example
```

---

## ⚠️ Disclaimer

This is an **independent open-source project** and is **not affiliated with, endorsed by, or connected to any company, corporation, or organization** — including but not limited to BMW Group, Meta/WhatsApp, Google, or OpenAI. "University" refers to the general academic context in which this tool is used. This project uses unofficial WhatsApp Web APIs and is intended for educational and community moderation purposes only. Use at your own risk and in accordance with WhatsApp's Terms of Service.

---

<div align="center">

**Built for university communities** · Keeps groups clean · Open source

Made with ❤️ by [Alperen Adatepe](https://github.com/noluyorAbi)

</div>
