# WhatsApp University Group Spam Bot — Design Spec

## Purpose

A WhatsApp bot that monitors university group chats for fraudulent/spammy links and WhatsApp group invitations (trading, adult content, gambling, betting, etc.), automatically deletes the offending message, and kicks the sender from the group.

## Architecture

Single Node.js process with three layers:

```
WhatsApp (whatsapp-web.js) → Message Filter → Action Engine
                                   │
                          ┌────────┴────────┐
                     Rule Engine      AI Classifier
                    (fast, free)    (borderline cases)
```

### Layer 1: WhatsApp Client

- Library: `whatsapp-web.js`
- Connects via QR code displayed in terminal
- Listens to `message_create` events in all groups where the bot is a member
- Bot must be a **group admin** to delete messages and kick users

### Layer 2: Message Filter

Receives every group message and decides if it needs analysis:

1. Is it a group message? If no → ignore.
2. Is it from the bot itself? If yes → ignore.
3. Does it contain a URL or `chat.whatsapp.com` invite link? If no → ignore.
4. If links found → pass to Rule Engine.

URL extraction uses a regex that catches standard URLs and WhatsApp invite links.

### Layer 3a: Rule Engine

Pattern-matches extracted links and surrounding message text against known bad categories:

- **Trading/forex:** domains and keywords (e.g. "forex", "trading signals", "binance group", known trading platform domains)
- **Adult/erotic:** known adult domains, explicit keywords
- **Gambling/betting:** betting platform domains, gambling keywords
- **Spam patterns:** suspicious URL shorteners used by spam bots, known spam invite patterns

Outcomes:
- **Spam confirmed** → proceed to Action Engine
- **Clean** (no patterns matched at all) → ignore
- **Uncertain** (some weak signals but not conclusive) → escalate to AI Classifier

### Layer 3b: AI Classifier

For borderline messages that the rule engine can't confidently classify.

- **Primary:** Google Gemini API
- **Fallback:** OpenAI API (used only if Gemini fails — rate limit, timeout, error)

Prompt framing: "Analyze this WhatsApp message and its links. Is it spam related to trading, forex, adult content, gambling, betting, or similar scam/promotional groups? Respond with JSON: `{\"spam\": true/false, \"reason\": \"...\"}`"

If both APIs fail, the message is logged and left alone (fail-open — don't kick on uncertainty).

### Layer 4: Action Engine

When spam is confirmed (by either Rule Engine or AI Classifier):

1. Delete the offending message
2. Kick the sender from the group
3. Log the action (sender number, group name, matched rule/AI reason, timestamp)

If the bot lacks admin permissions in a group, log a warning and skip.

## File Structure

```
src/
  index.js          — entry point, QR auth, client setup
  filter.js         — extracts links from messages, decides if analysis needed
  rules.js          — regex patterns, keyword/domain lists for known spam categories
  classifier.js     — Gemini + OpenAI integration with fallback logic
  actions.js        — delete message + kick user logic
  config.js         — env var loading
.env.example        — template for required env vars
package.json
```

## Configuration

Via `.env` file:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key (primary AI classifier) |
| `OPENAI_API_KEY` | Yes | OpenAI API key (fallback AI classifier) |
| `LOG_LEVEL` | No | `debug`, `info` (default), `warn`, `error` |

## Auth Flow

1. Bot starts → `whatsapp-web.js` generates QR code in terminal
2. User scans QR code with WhatsApp on the reserved phone number
3. Session is established and persisted locally (`.wwebjs_auth/` directory) so re-scanning is only needed if the session expires

## Error Handling

- **AI APIs both fail:** fail-open, log the message, don't kick
- **Bot not admin in group:** log warning, skip action
- **WhatsApp disconnects:** auto-reconnect (built into whatsapp-web.js)
- **Message already deleted (by another admin):** catch error, continue

## Constraints

- Bot must be added as a **group admin** in each monitored group
- One phone number = one WhatsApp session
- Unofficial API — WhatsApp could change their protocol (low risk for read-heavy usage)
- No database — stateless, logs to stdout

## Out of Scope

- Web dashboard or UI
- Multi-admin configuration
- Monitoring non-link messages (e.g. text-only spam)
- Warn-then-kick logic (immediate kick on detection)
- Whitelisting domains
