# Spam Submission Web UI — Design Spec

## Purpose

Add a web interface where anyone can submit spam messages they've seen in university WhatsApp groups. An admin panel lets the bot operator review submissions and one-click add new detection rules. The bot polls these rules from Supabase and shows its live status via heartbeat.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Vercel (Web UI) │────▶│   Supabase   │◀────│ Bot (Oracle) │
│  - Public form   │     │  - submissions│     │ - heartbeat  │
│  - Admin panel   │     │  - rules      │     │ - polls rules│
│  - Bot status    │     │  - bot_status │     │              │
└─────────────────┘     └──────┬───────┘     └─────────────┘
                               │
                        ┌──────▼───────┐
                        │   Resend     │
                        │  (email on   │
                        │  new submit) │
                        └──────────────┘
```

Three components:
1. **Supabase** — database + edge function for email notifications
2. **Vercel** — Next.js app with public form + admin panel + bot status
3. **Bot (Oracle Cloud)** — existing bot, writes heartbeat + polls custom rules

## Supabase Schema

### Table: `submissions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK, default gen) | |
| `created_at` | timestamptz (default now) | |
| `message_text` | text (required) | The spam message content |
| `submitted_by` | text (nullable) | Optional name or email |
| `status` | text (default 'pending') | pending / approved / dismissed |
| `reviewed_at` | timestamptz (nullable) | When admin reviewed it |

RLS: insert allowed for anon, select/update allowed for authenticated or service role only.

### Table: `custom_rules`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK, default gen) | |
| `created_at` | timestamptz (default now) | |
| `type` | text (required) | 'domain' or 'keyword' |
| `value` | text (required) | Domain string or regex pattern |
| `category` | text (required) | trading / adult / gambling / academic |
| `source_submission_id` | uuid (nullable, FK → submissions) | Which submission it came from |

RLS: select allowed for anon (bot needs to read), insert/update/delete for service role only.

### Table: `bot_status`

| Column | Type | Notes |
|--------|------|-------|
| `id` | int (PK, always 1) | Single row, upserted |
| `updated_at` | timestamptz | Last heartbeat time |
| `status` | text | 'running' / 'connected' / 'disconnected' |
| `last_message_at` | timestamptz (nullable) | When last message was processed |
| `messages_processed` | int (default 0) | Total messages analyzed |
| `spam_blocked` | int (default 0) | Total spam actions taken |

RLS: select allowed for anon (web UI reads it), upsert for service role only.

## Web UI (Next.js on Vercel)

### Pages

**`/` — Public Submission Form**
- Text area for pasting the spam message
- Optional "Your name/email" field
- Submit button
- Success message after submission
- Simple, clean design

**`/admin` — Admin Panel (password-protected)**

Password gate: simple client-side check against `NEXT_PUBLIC_ADMIN_PASSWORD` env var. Not high-security — this is a spam review tool, not a bank.

Admin panel contents:
1. **Bot Status Card** — reads `bot_status` table
   - Status badge (connected/disconnected/unknown)
   - Last heartbeat time (with "X seconds ago")
   - Messages processed count
   - Spam blocked count
   - If heartbeat is older than 90 seconds → show as "disconnected"

2. **Submissions List** — reads `submissions` table
   - Filterable by status: All / Pending / Approved / Dismissed
   - Each row shows: date, first 100 chars of message, status badge
   - Click to expand → full message text, submitted_by if present
   - Two action buttons per submission:
     - **"Add to Rules"** → opens a modal that:
       - Auto-extracts domains from the message (URL parsing)
       - Auto-extracts potential keywords (common spam phrases)
       - Lets admin select which to add, choose category, confirm
       - On confirm: inserts into `custom_rules`, marks submission as `approved`
     - **"Dismiss"** → marks as `dismissed`

3. **Active Rules List** — reads `custom_rules` table
   - Shows all custom rules with type, value, category, date added
   - Delete button to remove a rule

## Bot Changes

### Heartbeat

- On WhatsApp `ready` event: upsert `bot_status` with status='connected'
- Every 30 seconds: upsert `bot_status` with current stats
- On `disconnected` event: upsert with status='disconnected'
- Track `messages_processed` and `spam_blocked` as in-memory counters

### Custom Rules Polling

- On startup: fetch all rows from `custom_rules`
- Every 60 seconds: re-fetch and merge with built-in rules
- Domain rules → added to the spam domains check
- Keyword rules → compiled to RegExp and added to keyword check

### New Dependencies

- `@supabase/supabase-js` added to the bot

### New Env Vars (bot)

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Email Notifications

### Trigger

Supabase Edge Function triggered by database webhook on `submissions` INSERT.

### Email Content

Sent via Resend API to `alperen.adatepe1905@gmail.com`:
- Subject: "New Spam Submission"
- Body: the submitted message text (first 500 chars), timestamp, link to admin panel

### Env Vars (Edge Function)

- `RESEND_API_KEY`

## Tech Stack

- **Next.js 14** (App Router) on Vercel
- **@supabase/supabase-js** (web UI + bot)
- **Tailwind CSS** for styling
- **Resend** for transactional email
- **Supabase Edge Functions** (Deno) for email webhook

## File Structure (Web UI)

```
web/
  package.json
  next.config.js
  tailwind.config.js
  .env.local.example
  app/
    layout.js
    page.js              — public submission form
    admin/
      page.js            — admin panel (status + submissions + rules)
    api/
      (none — all direct Supabase client calls)
  lib/
    supabase.js          — Supabase client init
  components/
    SubmissionForm.js
    StatusCard.js
    SubmissionList.js
    RuleExtractor.js     — modal for extracting rules from submission
    RulesList.js
```

## File Changes (Bot)

```
src/
  supabase.js            — Supabase client init + heartbeat + rule polling
  rules.js               — modified to accept custom rules from Supabase
  index.js               — modified to init heartbeat + polling
  config.js              — add SUPABASE_URL, SUPABASE_ANON_KEY
.env.example             — add new vars
```

## Supabase Edge Function

```
supabase/
  functions/
    notify-submission/
      index.ts           — webhook handler, sends email via Resend
```

## Out of Scope

- User authentication for the public form (anyone can submit)
- Rate limiting on submissions (can add later if abused)
- Real-time WebSocket updates on admin panel (polling is fine)
- Bot deployment to Oracle Cloud (separate task)
