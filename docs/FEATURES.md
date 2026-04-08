# WhatsApp Spam Guard — Feature Roadmap

> **Purpose:** Comprehensive feature specifications for AI agent implementation. Each feature is self-contained with problem statement, technical approach, implementation steps, and acceptance criteria.

---

## Summary Table

| ID | Feature | Priority | Severity | Complexity | Status | Dependencies |
|----|---------|----------|----------|------------|--------|-------------|
| F-01 | Group Management Dashboard | P0 | Critical gap | L | Planned | — |
| F-02 | Auto-Learn from Confirmations | P0 | Critical gap | M | Planned | — |
| F-03 | Sender Reputation System | P0 | Critical gap | L | Planned | — |
| F-04 | Rule Testing Sandbox | P0 | Critical gap | S | Planned | — |
| F-05 | Real-time Push Notifications | P1 | Significant limitation | M | Planned | — |
| F-06 | Multi-language Spam Detection | P1 | Significant limitation | M | Planned | — |
| F-07 | Allowlist / Whitelist System | P1 | Significant limitation | S | Planned | — |
| F-08 | Scheduled Email Reports | P1 | Significant limitation | M | Planned | — |
| F-09 | Image/Media Spam Detection | P1 | Significant limitation | XL | Planned | — |
| F-10 | Export/Import Rules | P2 | Minor inconvenience | S | Planned | — |
| F-11 | Audit Log | P2 | Minor inconvenience | M | Planned | — |
| F-12 | Rate Limiting on Public Form | P2 | Minor inconvenience | S | Planned | — |
| F-13 | Submission Deduplication | P2 | Minor inconvenience | S | Planned | — |
| F-14 | Bot Health Monitoring & Alerts | P2 | Minor inconvenience | M | Planned | F-08 |
| F-15 | Dark/Light Theme Toggle | P3 | Enhancement | S | Planned | — |
| F-16 | Telegram/Discord Integration | P3 | Enhancement | XL | Planned | — |
| F-17 | API Key for External Integrations | P3 | Enhancement | M | Planned | — |
| F-18 | Spam Pattern Analytics | P3 | Enhancement | L | Planned | — |
| F-19 | Message Queue / Retry System | P3 | Enhancement | M | Planned | — |
| F-20 | Custom AI Prompt Configuration | P3 | Enhancement | M | Planned | — |

**Complexity key:** S (< 1 day) · M (1-3 days) · L (3-5 days) · XL (5+ days)

---

## P0 — Critical

---

### F-01: Group Management Dashboard

**Priority:** P0 (Critical)
**Severity:** Critical gap — the admin has no visibility into which groups the bot monitors, can't pause monitoring, and can't see per-group spam stats.
**Estimated Complexity:** L (3-5 days)
**Dependencies:** None

#### Problem Statement

Today, the bot silently monitors every group it's in. The admin has no way to:
- See which groups the bot is a member of
- Check per-group statistics (e.g. "CS Study Group had 12 spam messages this week")
- Pause monitoring for a group temporarily (e.g. during legitimate trading discussions in a finance class)
- Know if the bot lost admin status in a group (it silently fails to kick)

A spammer could be active in one group while another group is clean, but the admin sees only aggregate numbers. Without per-group visibility, the admin can't prioritize or identify problematic groups.

#### Proposed Solution

**Database:** New `uni-wa-bot-groups` table:

```sql
CREATE TABLE IF NOT EXISTS "uni-wa-bot-groups" (
  id TEXT PRIMARY KEY,              -- WhatsApp group ID (e.g. 120363406123280105@g.us)
  name TEXT,                        -- Group display name
  member_count INT DEFAULT 0,
  bot_is_admin BOOLEAN DEFAULT false,
  is_monitoring_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT now(),
  last_spam_at TIMESTAMPTZ,
  spam_count INT DEFAULT 0,
  messages_scanned INT DEFAULT 0
);

ALTER TABLE "uni-wa-bot-groups" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read groups" ON "uni-wa-bot-groups" FOR SELECT USING (true);
CREATE POLICY "Anyone can insert groups" ON "uni-wa-bot-groups" FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update groups" ON "uni-wa-bot-groups" FOR UPDATE USING (true);
```

**Bot changes (`src/index.js`, `src/supabase.js`):**
- On `ready` event: iterate `client.getChats()`, filter groups, upsert each into `uni-wa-bot-groups` with name, member count, admin status
- On `message` event: before processing, check if `is_monitoring_active` is true for that group. If false, skip.
- On spam detected: increment `spam_count` and set `last_spam_at` for that group
- Every 5 minutes: re-sync group list (catch new groups, removed groups, admin status changes)

**API route (`web/app/api/groups/route.js`):**
- GET: list all groups with stats
- PATCH: toggle `is_monitoring_active` for a group

**Admin panel:**
- New "Groups" nav item in sidebar (icon: `groups`)
- Groups list with: name, member count, admin status badge, spam count, monitoring toggle
- Per-group detail view: spam timeline for that group, recent events

#### Implementation Steps

1. Run the SQL above against Supabase via the pg client
2. Add `syncGroups()` function to `src/supabase.js` that takes a list of chat objects and upserts them into the table
3. Add `isGroupMonitored(groupId)` function to `src/supabase.js` that checks `is_monitoring_active`
4. Add `incrementGroupSpam(groupId)` function to `src/supabase.js`
5. In `src/index.js`, on `ready` event after `startHeartbeat()`, call `syncGroups(await client.getChats())`
6. In `src/index.js`, in the message handler, after `shouldAnalyze(msg)` check, add: `if (!(await isGroupMonitored(msg.from))) return;`
7. In `src/index.js`, after successful `handleSpam()`, call `incrementGroupSpam(msg.from)`
8. Create `web/app/api/groups/route.js` with GET (list all) and PATCH (toggle monitoring)
9. Create `web/components/GroupList.js` — table with name, members, admin badge, spam count, toggle switch
10. Add "Groups" to NAV_ITEMS in `web/app/admin/page.js` and render GroupList when active
11. Run tests: `npx jest --verbose`
12. Build: `cd web && npm run build`
13. Commit

#### Acceptance Criteria

- [ ] When bot connects, all groups appear in the `uni-wa-bot-groups` table with correct names and member counts
- [ ] Admin panel shows a "Groups" tab with all monitored groups
- [ ] Toggling monitoring off for a group causes the bot to skip messages from that group
- [ ] Per-group spam count increments when spam is detected in that group
- [ ] If bot loses admin status in a group, `bot_is_admin` shows false in admin panel
- [ ] New groups joined after bot startup appear after next sync cycle (5 min)

#### Impact

Admin gets full visibility into which groups are monitored and can manage them individually. Enables targeted troubleshooting ("why is Group X getting so much spam?") and operational control (pause monitoring during exams, etc).

#### Risks & Edge Cases

- WhatsApp rate limits: calling `getChats()` frequently could trigger rate limiting. 5-minute intervals should be safe.
- Group name changes: bot should update names on each sync
- Groups with 256+ members may have different WhatsApp behavior
- Bot removed from group between syncs: will show stale data until next sync

---

### F-02: Auto-Learn from Confirmations (Feedback Loop)

**Priority:** P0 (Critical)
**Severity:** Critical gap — every confirmed spam is a learning opportunity that's currently wasted. The admin manually extracts rules, but the system should learn automatically.
**Estimated Complexity:** M (1-3 days)
**Dependencies:** None

#### Problem Statement

When the admin reviews a blocked message and clicks "Confirm Spam", nothing happens to improve detection. The admin has to manually go to the Rule Extractor modal, select keywords/domains, and add them. This means:
- Learning is manual and slow
- Many confirmed spam messages are never turned into rules
- The bot doesn't get smarter over time unless the admin actively intervenes

When the admin marks a false positive, there's no mechanism to prevent the same mistake — the rule that caused the false positive remains active.

#### Proposed Solution

**Auto-learn on confirmation:**
When admin clicks "Confirm Spam" on a spam_log entry:
1. Run `extractDomains()` and `extractKeywords()` on the message text (same logic as RuleExtractor)
2. For each extracted domain/keyword, check if it already exists in `uni-wa-bot-custom_rules`
3. If new, auto-insert with `source = 'auto-learned'`
4. Log what was learned in a new `uni-wa-bot-learning_log` table
5. Show a toast/notification: "Auto-learned 2 new rules from this confirmation"

**Auto-adjust on false positive:**
When admin marks "Not Spam":
1. Check which rule caused the block (stored in `matched_rule` field of spam_log)
2. If it was a custom rule, suggest deleting it (or auto-delete with confirmation)
3. If it was a built-in rule, log it as a known false-positive pattern for future AI consideration
4. Increment a `false_positive_count` on the matching custom_rule row

**Database changes:**
```sql
ALTER TABLE "uni-wa-bot-custom_rules" ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE "uni-wa-bot-custom_rules" ADD COLUMN IF NOT EXISTS false_positive_count INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS "uni-wa-bot-learning_log" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  action TEXT NOT NULL,           -- 'rule_added', 'rule_removed', 'rule_adjusted'
  rule_type TEXT,                 -- 'domain' or 'keyword'
  rule_value TEXT,
  source_spam_log_id UUID,
  details TEXT
);

ALTER TABLE "uni-wa-bot-learning_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read learning_log" ON "uni-wa-bot-learning_log" FOR SELECT USING (true);
CREATE POLICY "Anyone can insert learning_log" ON "uni-wa-bot-learning_log" FOR INSERT WITH CHECK (true);
```

#### Implementation Steps

1. Run the SQL above against Supabase
2. Create `web/app/api/auto-learn/route.js`:
   - POST: accepts `{ spam_log_id, action: 'confirm' | 'false_positive' }`
   - On confirm: extract domains/keywords from the message, insert new ones into custom_rules with `source: 'auto-learned'`, log to learning_log
   - On false_positive: find the matching custom_rule by `matched_rule` value, increment `false_positive_count`, if count > 3 auto-disable the rule
3. Update `web/components/ActivityFeed.js`:
   - When "Confirm Spam" is clicked, also call `/api/auto-learn` with `action: 'confirm'`
   - When "Not Spam" is clicked, also call `/api/auto-learn` with `action: 'false_positive'`
   - Show a feedback toast: "Learned 2 new rules" or "Rule X flagged as problematic (3 false positives)"
4. Create `web/components/LearningLog.js` — shows auto-learned actions chronologically
5. Add LearningLog to the admin panel (under Rules tab or Bot Stats)
6. Build and test

#### Acceptance Criteria

- [ ] Confirming spam auto-extracts and adds new rules to custom_rules with `source: 'auto-learned'`
- [ ] Duplicate rules are not added (existing domains/keywords are skipped)
- [ ] Marking false positive increments `false_positive_count` on the matching rule
- [ ] Rules with 3+ false positives are highlighted as "problematic" in RulesList
- [ ] Learning log shows all auto-learn actions with timestamps
- [ ] Admin sees a feedback message after each confirm/false-positive action

#### Impact

The bot becomes self-improving: every admin review makes detection better. Over time, fewer spam messages slip through and fewer false positives occur. The admin's workload decreases as the system learns.

#### Risks & Edge Cases

- Over-learning: auto-adding too many rules could increase false positives. Mitigate by only adding rules from messages with high-confidence matches.
- Keyword collision: a common English word extracted from spam (e.g. "help") could match legitimate messages. Only extract multi-word phrases.
- Race condition: admin confirms spam while bot is polling rules — rule might not be available for 60 seconds.

---

### F-03: Sender Reputation System

**Priority:** P0 (Critical)
**Severity:** Critical gap — repeat offenders are treated the same as first-time spammers. A sender kicked from 5 groups should be auto-blocked, not given equal treatment.
**Estimated Complexity:** L (3-5 days)
**Dependencies:** None

#### Problem Statement

Currently, the bot evaluates each message independently. A sender who has been kicked from 3 groups for trading spam can join a 4th group and post the same spam — the bot treats them as a brand-new sender. There's no memory across groups.

This means:
- Repeat spammers get unlimited chances
- Sophisticated spammers can craft messages that barely pass the rule engine, knowing each attempt is independent
- The admin has no way to see "this sender has been flagged 5 times across 3 groups"

#### Proposed Solution

**Database:**
```sql
CREATE TABLE IF NOT EXISTS "uni-wa-bot-sender_reputation" (
  sender_id TEXT PRIMARY KEY,       -- WhatsApp ID (@c.us or @lid format)
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  total_messages INT DEFAULT 0,
  total_flags INT DEFAULT 0,        -- times flagged as spam
  total_kicks INT DEFAULT 0,        -- times actually kicked
  groups_seen_in TEXT[] DEFAULT '{}', -- array of group IDs
  reputation_score INT DEFAULT 100,  -- 100 = clean, 0 = confirmed spammer
  is_banned BOOLEAN DEFAULT false,   -- permanent ban
  ban_reason TEXT
);

ALTER TABLE "uni-wa-bot-sender_reputation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sender_reputation" ON "uni-wa-bot-sender_reputation" FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sender_reputation" ON "uni-wa-bot-sender_reputation" FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sender_reputation" ON "uni-wa-bot-sender_reputation" FOR UPDATE USING (true);
```

**Bot logic (`src/supabase.js`):**
- `updateSenderReputation(senderId, groupId, wasSpam)`: upsert sender, increment counters, adjust score
- Reputation score formula: starts at 100, -25 per spam flag, -10 per kick, +5 per clean message (capped at 100)
- `checkSenderBanned(senderId)`: returns true if `is_banned` or `reputation_score < 10`

**Bot logic (`src/index.js`):**
- Before rule engine check: if sender is banned, auto-kick immediately (skip all analysis)
- If reputation_score < 30: skip AI escalation, treat any uncertain message as spam
- After each spam detection: update reputation

**Admin panel:**
- When viewing a spam log entry, show sender's reputation card: score, history, groups
- "Ban Sender" button that sets `is_banned = true`
- "Repeat Offender" badge on entries from senders with score < 50
- Sender reputation list accessible from Bot Stats tab

#### Implementation Steps

1. Run the SQL above against Supabase
2. Add `updateSenderReputation()`, `checkSenderBanned()`, `getSenderReputation()` to `src/supabase.js`
3. In `src/index.js`, after `shouldAnalyze(msg)`:
   - Call `checkSenderBanned(msg.author)`. If banned, immediately `handleSpam()` and return.
4. In `src/index.js`, after successful spam action: call `updateSenderReputation(msg.author, msg.from, true)`
5. Create `web/app/api/senders/route.js` with GET (list senders by reputation) and PATCH (ban/unban)
6. Create `web/components/SenderCard.js` — shows sender reputation when viewing spam details
7. Update `web/components/ActivityFeed.js` to fetch and display sender reputation inline
8. Add sender reputation list to admin panel Bot Stats tab
9. Run tests, build, commit

#### Acceptance Criteria

- [ ] First-time spammer gets reputation 75 after one flag (100 - 25)
- [ ] Sender with reputation < 10 is auto-kicked without rule/AI analysis
- [ ] Admin can ban a sender permanently from the admin panel
- [ ] Banned sender is kicked immediately on any message in any group
- [ ] Sender reputation card shows in the spam log detail view
- [ ] "Repeat Offender" badge appears on entries from senders with 2+ flags

#### Impact

The bot develops "memory" across groups. Repeat spammers are caught faster (eventually instantly). The system becomes harder to game — spammers can't just rejoin and try again.

#### Risks & Edge Cases

- LID format: WhatsApp's new Linked ID format (`@lid`) may not map cleanly to `@c.us` IDs. The same person might have two IDs. Resolution: track both formats, link them via `msg.getContact()`.
- Legitimate users falsely flagged: if a student is wrongly kicked once, their reputation drops. False-positive undo should restore reputation (+25).
- Phone number recycling: a spammer's old number could be assigned to a new person. Reputation should decay over time (e.g. +1 per day back toward 100).

---

### F-04: Rule Testing Sandbox

**Priority:** P0 (Critical)
**Severity:** Critical gap — there's no way to test if a rule works before deploying it. The admin adds rules blind and discovers false positives only when real users get kicked.
**Estimated Complexity:** S (< 1 day)
**Dependencies:** None

#### Problem Statement

When the admin adds a new keyword rule like `\bhelp\s*writing\b`, they have no idea if it would match legitimate messages like "Can someone help with writing the report?". The only way to find out is to deploy the rule and wait for real users to get kicked — then fix it.

This is the #1 cause of false positives and admin frustration.

#### Proposed Solution

**API route (`web/app/api/test-rules/route.js`):**

```javascript
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { message } = await req.json();
  
  // Import the bot's actual rule engine logic
  // Since this runs server-side in Next.js, we can't directly require the bot's CommonJS modules
  // Instead, replicate the checkRules logic or create a shared module
  
  // Run through: URL extraction → rule engine → return result
  // Return: { verdict, reason, matchedText, context, wasNormalized, links }
}
```

Since the rule engine is in the bot (CommonJS) and the web UI is Next.js (ESM), the cleanest approach is to:
1. Create a shared `lib/rule-engine.js` in the web project that mirrors the bot's rule-checking logic
2. It should import custom rules from Supabase and merge with built-in rules
3. The API route calls this function

**Admin panel component (`web/components/RuleSandbox.js`):**
- Large textarea: "Paste a message to test"
- "Test" button
- Results panel showing:
  - Verdict: SPAM / CLEAN / UNCERTAIN with colored badge
  - If spam: which rule matched, where in the text, context snippet with highlight
  - If uncertain: which uncertain signal triggered (e.g. "WhatsApp invite without keywords")
  - If clean: "No rules triggered"
  - Links extracted from the message
  - Whether Unicode normalization changed the text (show before/after)

#### Implementation Steps

1. Create `web/lib/rule-engine.js` — port the core logic from `src/rules.js`:
   - Copy SPAM_DOMAINS, SPAM_KEYWORDS, CONTEXT_KEYWORDS, PROMO_INDICATORS arrays
   - Copy `normalizeText()`, `getDomain()`, `findMatch()`, `checkRules()` functions
   - Convert from CommonJS to ESM exports
   - Add a `checkRulesWithCustom(text, links, customDomains, customKeywords)` function
2. Create `web/app/api/test-rules/route.js`:
   - POST handler that accepts `{ message }`
   - Fetches custom rules from Supabase
   - Extracts URLs from the message
   - Runs `checkRulesWithCustom()` with both built-in and custom rules
   - Returns full result: verdict, reason, matched text, context, links, normalized text
3. Create `web/components/RuleSandbox.js`:
   - Textarea with stealth-input styling
   - "Test Message" button (btn-primary)
   - Results display: verdict badge, rule match details, extracted links, normalization diff
4. Add RuleSandbox to the Rules tab in admin panel (above RulesList)
5. Build and test with various messages:
   - Known spam: "Join our forex group https://binance.com"
   - False positive: "Can someone help my thesis writing? https://university.edu"
   - Unicode spam: "📚𝗔𝘀𝘀𝗶𝗴𝗻𝗺𝗲𝗻𝘁𝘀 𝗛𝗲𝗹𝗽 https://wa.me/123"
   - Clean: "Here's the lecture: https://youtube.com/watch?v=abc"
6. Commit

#### Acceptance Criteria

- [ ] Pasting a known spam message shows "SPAM" verdict with the matched rule highlighted
- [ ] Pasting a clean message shows "CLEAN" verdict
- [ ] Pasting a borderline message shows "UNCERTAIN" with explanation
- [ ] Unicode text shows the normalization: original vs normalized side by side
- [ ] Custom rules from Supabase are included in the test
- [ ] Extracted URLs are listed
- [ ] Context snippet shows exactly where the match occurred with highlighting

#### Impact

Admins can test rules before deploying them, eliminating blind-spot false positives. New rules can be validated against a corpus of known messages. This alone could prevent 90% of false positive incidents.

#### Risks & Edge Cases

- Rule engine drift: if the bot's `src/rules.js` is updated but `web/lib/rule-engine.js` isn't synced, results will differ. Consider: generate the web version from the bot source, or use a build step.
- AI classification not tested: the sandbox only tests the rule engine, not the AI classifier. For uncertain messages, note: "This message would be sent to AI for classification."

---

## P1 — High

---

### F-05: Real-time Push Notifications

**Priority:** P1 (High)
**Severity:** Significant limitation — the admin panel polls every 15 seconds, so there's up to 15s delay before seeing new spam events. For time-sensitive spam (e.g. a phishing link), every second counts.
**Estimated Complexity:** M (1-3 days)
**Dependencies:** None

#### Problem Statement

The Activity Feed polls `/api/spam-log` every 15 seconds. If a spam message is blocked at t=0, the admin might not see it until t=15. There's no way to know something happened unless you're staring at the admin panel. If the admin is in another tab, they have no notification.

#### Proposed Solution

**Approach: Supabase Realtime**

Supabase supports real-time subscriptions via WebSocket. The web UI can subscribe to changes on `uni-wa-bot-spam_log` and receive new rows instantly.

**Implementation:**
1. Enable Realtime on the `uni-wa-bot-spam_log` table in Supabase dashboard (Database → Replication → enable for this table)
2. In the ActivityFeed component, use `supabase.channel('spam-log').on('postgres_changes', ...)` to listen for INSERTs
3. When a new row arrives, prepend it to the feed instantly
4. Add Browser Notification API: request permission, show desktop notification when spam is blocked
5. Add a subtle sound effect (optional, configurable)
6. Notification bell in top bar: show unread count badge

**Note:** Since Supabase calls are now server-side via API routes, the realtime subscription needs a different approach. Options:
- a) Create a lightweight client-side Supabase instance just for realtime (read-only, anon key is okay for listening)
- b) Use Server-Sent Events from a Next.js API route that subscribes server-side
- c) Reduce polling interval to 3 seconds (simplest, good enough)

Option (a) is recommended — the anon key is safe for read-only realtime since the table has public SELECT policy.

#### Implementation Steps

1. Enable Realtime replication for `uni-wa-bot-spam_log` in Supabase dashboard
2. Create `web/lib/supabase-client.js` — a browser-side Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (only used for realtime subscriptions, not data queries)
3. In `web/components/ActivityFeed.js`, subscribe to postgres_changes on `uni-wa-bot-spam_log` INSERT events
4. When new event arrives: prepend to entries array, increment unread count
5. Add `Notification.requestPermission()` on first admin login
6. When new spam event arrives and tab is not focused: show `new Notification('Spam Blocked', { body: '...' })`
7. In admin page header, add unread count badge to the notification bell icon
8. Clicking notification bell scrolls to Activity Feed and clears count
9. Build and test

#### Acceptance Criteria

- [ ] New spam events appear in the feed within 1 second of being blocked (not 15s)
- [ ] Browser desktop notification appears when tab is in background
- [ ] Notification bell shows unread count badge
- [ ] Clicking the bell scrolls to and highlights the new event
- [ ] Realtime subscription reconnects automatically after network interruption
- [ ] If user denies notification permission, everything else still works

#### Impact

Admin response time drops from 15 seconds to < 1 second. Critical phishing links can be reviewed immediately. The admin doesn't need to keep the panel open — desktop notifications cover it.

#### Risks & Edge Cases

- Supabase Realtime has connection limits on free tier (200 concurrent connections). One admin is fine.
- If many spam events fire at once (spam flood), notifications could be overwhelming. Batch: "5 new spam events" instead of 5 separate notifications.
- Browser notification permission denied: fall back to in-app badge only.

---

### F-06: Multi-language Spam Detection

**Priority:** P1 (High)
**Severity:** Significant limitation — university groups often have spam in Turkish, Arabic, Hindi, German. The rule engine only catches English spam.
**Estimated Complexity:** M (1-3 days)
**Dependencies:** None

#### Problem Statement

The current rule engine has English-only keywords: `forex`, `trading signals`, `betting tips`, etc. But university WhatsApp groups — especially in Germany, Turkey, and Middle Eastern countries — receive spam in the local language:

- Turkish: "Yatırım grubu", "Bahis tüyoları", "Tez yazım hizmeti"
- Arabic: "مجموعة تداول", "نصائح مراهنات", "كتابة أطروحة"
- German: "Handelsgruppe", "Wett-Tipps", "Hausarbeit schreiben lassen"
- Hindi: "ट्रेडिंग ग्रुप", "सट्टा टिप्स"

The AI classifier (Gemini/OpenAI) handles multi-language text, but it's only triggered for "uncertain" messages. If a Turkish spam message doesn't contain English keywords, it goes through as "clean" and is never sent to AI.

#### Proposed Solution

**Expand rule engine keywords** in `src/rules.js`:

Add new keyword arrays organized by language. The same two-tier system applies (strong vs context keywords).

**Turkish keywords:**
- Strong: `yatırım\s*grubu`, `forex\s*sinyalleri`, `bahis\s*tüyoları`, `kumar\s*bonusu`, `kripto\s*sinyalleri`
- Context: `tez\s*yazım`, `ödev\s*yardımı`, `akademik\s*yazım`

**German keywords:**
- Strong: `Handelsgruppe`, `Trading\s*Signale`, `Wett-Tipps`, `Casino\s*Bonus`, `Krypto\s*Signale`
- Context: `Hausarbeit\s*schreiben`, `Abschlussarbeit\s*Hilfe`, `akademische\s*Arbeit`

**Arabic keywords:**
- Strong: `مجموعة\s*تداول`, `إشارات\s*تداول`, `نصائح\s*مراهنات`, `مكافأة\s*كازينو`
- Context: `كتابة\s*أطروحة`, `مساعدة\s*واجبات`, `كتابة\s*أكاديمية`

**Also:** Update the "uncertain" trigger to include `wa.me` links combined with non-Latin scripts (Arabic, Devanagari, etc.) — these are almost always spam.

#### Implementation Steps

1. In `src/rules.js`, add `SPAM_KEYWORDS_TR`, `SPAM_KEYWORDS_DE`, `SPAM_KEYWORDS_AR` arrays
2. Merge them into the main SPAM_KEYWORDS and CONTEXT_KEYWORDS arrays (or check them separately)
3. Add corresponding PROMO_INDICATORS for each language
4. Update `normalizeText()` to handle Arabic diacritics and Turkish special characters
5. Add test cases in `tests/rules.test.js` for each language
6. Update the AI classifier prompt in `src/classifier.js` to mention it should analyze messages in any language
7. Run tests, build, commit

#### Acceptance Criteria

- [ ] Turkish forex spam is caught by rule engine: "Forex sinyalleri grubuna katılın https://wa.me/123"
- [ ] German academic fraud is caught: "Hausarbeit schreiben lassen 30% Rabatt https://wa.me/456"
- [ ] Arabic trading spam is caught: "مجموعة تداول https://chat.whatsapp.com/ABC"
- [ ] Legitimate Turkish/German/Arabic messages with university links are not flagged
- [ ] AI classifier prompt handles non-English messages correctly

#### Impact

Coverage extends to the majority of non-English spam hitting university groups, especially in multilingual European and Middle Eastern universities.

#### Risks & Edge Cases

- False positives in Turkish: "tez" means "thesis" — a student discussing their thesis could be flagged. Use the two-tier system (only flag with promo indicators).
- Arabic right-to-left text: regex may behave differently. Test thoroughly.
- Mixed-language messages: "Join our يستثمر group" — rule engine should catch either language.

---

### F-07: Allowlist / Whitelist System

**Priority:** P1 (High)
**Severity:** Significant limitation — group admins and trusted users can accidentally trigger rules (e.g. an admin sharing a bet365 link as an example of spam). There's no way to exempt them.
**Estimated Complexity:** S (< 1 day)
**Dependencies:** None

#### Problem Statement

The bot treats every group member equally. A group admin who posts "Don't click links like bet365.com, they're scams" could be kicked by the bot for mentioning a spam domain. A professor sharing an OnlyFans news article link gets kicked. There's no way to exempt trusted users.

#### Proposed Solution

**Database:**
```sql
CREATE TABLE IF NOT EXISTS "uni-wa-bot-allowlist" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  display_name TEXT,
  reason TEXT,
  added_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "uni-wa-bot-allowlist" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read allowlist" ON "uni-wa-bot-allowlist" FOR SELECT USING (true);
CREATE POLICY "Anyone can insert allowlist" ON "uni-wa-bot-allowlist" FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete allowlist" ON "uni-wa-bot-allowlist" FOR DELETE USING (true);
```

**Bot:** In `src/index.js`, before running rule engine, check if sender is on allowlist. If yes, skip all spam analysis.
**Bot:** Poll allowlist from Supabase alongside custom rules (every 60 seconds).
**Admin:** New section in Rules tab — "Trusted Senders" with add/remove functionality.

#### Implementation Steps

1. Run the SQL above
2. Add `pollAllowlist()` and `isAllowlisted(senderId)` to `src/supabase.js`
3. Call `pollAllowlist()` in `startPolling()` alongside `pollCustomRules()`
4. In `src/index.js`, after `shouldAnalyze(msg)` and before rule engine: `if (isAllowlisted(msg.author)) return;`
5. Create `web/app/api/allowlist/route.js` with GET, POST, DELETE
6. Create `web/components/AllowList.js` — list with add form and delete button
7. Add AllowList to the Rules tab in admin panel, below RulesList
8. Build and test

#### Acceptance Criteria

- [ ] Allowlisted users' messages are never analyzed for spam
- [ ] Admin can add/remove phone numbers from the allowlist
- [ ] Allowlist syncs to bot within 60 seconds
- [ ] Adding a user shows their display name if available

#### Impact

Eliminates false positives for trusted users. Group admins can freely discuss spam examples without being kicked.

#### Risks & Edge Cases

- Compromised account: if an allowlisted user's WhatsApp is hacked, the hacker can spam freely. Mitigate: if an allowlisted user posts 5+ messages with links in 1 minute, flag for review anyway.
- LID vs phone number: the bot sees `@lid` format IDs. Allowlist needs to match both formats.

---

### F-08: Scheduled Email Reports

**Priority:** P1 (High)
**Severity:** Significant limitation — the admin only sees stats when they log into the panel. There's no proactive "here's what happened this week" summary.
**Estimated Complexity:** M (1-3 days)
**Dependencies:** None

#### Problem Statement

The admin must actively check the admin panel to see what's happening. If they're busy and don't check for a week, they miss trends (e.g. a new type of spam emerging, false positive rate increasing).

#### Proposed Solution

**Supabase Edge Function** (`supabase/functions/send-report/index.ts`):
- Triggered on a cron schedule (Supabase pg_cron or external cron)
- Queries spam_log, custom_rules, bot_status for the reporting period
- Generates an HTML email with:
  - Spam blocked count (total, by category)
  - Top matched rules
  - False positive rate
  - New submissions pending review
  - Bot uptime
  - Trend: spam this week vs last week
- Sends via Resend to admin email

**Configuration:** Store schedule preference in bot_status or a new config table. Default: weekly on Monday 9am.

#### Implementation Steps

1. Create `supabase/functions/send-report/index.ts`
2. Query `uni-wa-bot-spam_log` for entries in the last 7 days
3. Query `uni-wa-bot-submissions` for pending submissions count
4. Query `uni-wa-bot-bot_status` for uptime info
5. Generate HTML email matching Sentinel Protocol design
6. Send via Resend API
7. Set up pg_cron or Supabase scheduled function to trigger weekly
8. Deploy: `supabase functions deploy send-report`
9. Test by invoking manually: `supabase functions invoke send-report`

#### Acceptance Criteria

- [ ] Weekly email arrives with correct stats
- [ ] Email includes: spam blocked, top rules, false positive rate, pending submissions
- [ ] Email design matches Sentinel Protocol branding
- [ ] Admin can trigger a report manually from the admin panel

#### Impact

Admin stays informed without logging in. Trends become visible (is spam increasing? Are rules effective?). False positives are caught earlier through rate monitoring.

#### Risks & Edge Cases

- Email deliverability: Resend's free tier uses `onboarding@resend.dev` which may land in spam. Custom domain recommended for production.
- Time zones: report should use admin's timezone, not UTC.

---

### F-09: Image/Media Spam Detection

**Priority:** P1 (High)
**Severity:** Significant limitation — spammers increasingly use images with text (screenshots of forex profits, academic service flyers). The bot completely ignores media messages.
**Estimated Complexity:** XL (5+ days)
**Dependencies:** None

#### Problem Statement

A growing trend: spammers post images instead of text to evade keyword detection. Common patterns:
- Screenshots of "forex profits" showing fake trading charts
- Flyers for academic writing services with phone numbers baked into the image
- Adult content preview images
- QR codes leading to spam groups

The bot currently skips any message that doesn't have text with links. All image-based spam passes through undetected.

#### Proposed Solution

**Media pipeline:**
1. Bot detects `msg.hasMedia` in the message handler
2. Downloads the media: `const media = await msg.downloadMedia()`
3. If image (JPEG/PNG): send to OCR service
4. OCR returns extracted text
5. Run extracted text through the same rule engine + AI classifier
6. If spam: delete message and kick sender (same as text spam)

**OCR options:**
- Google Cloud Vision API (most accurate, free tier: 1000 images/month)
- Tesseract.js (local, free, less accurate with stylized text)
- OpenAI Vision (can analyze image content directly, not just OCR)

**Recommended: Google Cloud Vision** for OCR, with fallback to OpenAI Vision for images that OCR doesn't catch (e.g. stylized text, screenshots).

**Bot changes (`src/index.js`, new `src/media.js`):**
- New `src/media.js` module with `analyzeImage(mediaData)` function
- In message handler: if `msg.hasMedia && msg.type === 'image'`, download and analyze
- Combine OCR text with any message caption text for analysis

#### Implementation Steps

1. `npm install @google-cloud/vision` (or use REST API directly)
2. Create `src/media.js` with `analyzeImage(base64Data)` that calls Google Vision OCR
3. In `src/index.js`, add image handling branch in message handler
4. Download media, extract text, run through `checkRules()`
5. Add `GOOGLE_CLOUD_API_KEY` to config
6. Create fallback: if OCR returns no text, send image to OpenAI Vision with spam detection prompt
7. Log media spam events with a `media_type: 'image'` flag
8. Test with known spam images
9. Commit

#### Acceptance Criteria

- [ ] Image with text "FOREX SIGNALS" is caught and sender is kicked
- [ ] Image with academic service flyer is caught
- [ ] Regular photos (group selfies, lecture slides) are not flagged
- [ ] OCR failure falls back to AI Vision analysis
- [ ] Media spam events are logged with `media_type` flag

#### Impact

Closes the biggest remaining detection gap. Image-based spam is a growing trend that currently bypasses all detection.

#### Risks & Edge Cases

- Processing time: OCR + download adds 2-5 seconds per image. Spammer's message is visible during processing.
- False positives on lecture slides: a professor sharing slides with "trading" or "binary options" in a finance course.
- Storage: downloaded media should be temporary, not stored permanently.
- Rate limits: Google Vision free tier is 1000 images/month. In a busy group, this could be exceeded.

---

## P2 — Medium

---

### F-10: Export/Import Rules

**Priority:** P2 (Medium)
**Severity:** Minor inconvenience
**Estimated Complexity:** S (< 1 day)
**Dependencies:** None

#### Problem Statement

Custom rules are stored in Supabase with no backup mechanism. If the Supabase project is deleted or rules are accidentally removed, they're gone. There's also no way to share rules between bot instances.

#### Proposed Solution

**API routes:**
- `GET /api/rules/export` — returns all custom rules as downloadable JSON
- `POST /api/rules/import` — accepts JSON file, validates, and bulk-inserts rules

**Admin panel:** "Export Rules" and "Import Rules" buttons in the Rules tab.

#### Implementation Steps

1. Create `web/app/api/rules/export/route.js` — fetches all custom rules, returns as JSON with `Content-Disposition: attachment`
2. Create `web/app/api/rules/import/route.js` — accepts JSON body, validates schema, inserts into custom_rules
3. Add export/import buttons to `web/components/RulesList.js`
4. For import: file input, parse JSON, show preview of rules to import, confirm button
5. Build and test

#### Acceptance Criteria

- [ ] Clicking "Export" downloads a JSON file with all custom rules
- [ ] Uploading a valid JSON file imports rules into custom_rules table
- [ ] Duplicate rules are skipped during import
- [ ] Invalid JSON shows error message

#### Impact

Rules can be backed up, shared, and migrated between instances.

#### Risks & Edge Cases

- Regex injection: imported keyword rules contain regex. Validate that they're valid regex before inserting.
- Large imports: if someone imports 1000 rules, it could slow down the bot's polling.

---

### F-11: Audit Log

**Priority:** P2 (Medium)
**Severity:** Minor inconvenience
**Estimated Complexity:** M (1-3 days)
**Dependencies:** None

#### Problem Statement

There's no record of who did what in the admin panel. If the admin password is shared with multiple people, there's no accountability. If a rule is deleted, there's no way to know when or why.

#### Proposed Solution

**Database:**
```sql
CREATE TABLE IF NOT EXISTS "uni-wa-bot-audit_log" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  action_type TEXT NOT NULL,
  details JSONB,
  ip_address TEXT
);

ALTER TABLE "uni-wa-bot-audit_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read audit_log" ON "uni-wa-bot-audit_log" FOR SELECT USING (true);
CREATE POLICY "Anyone can insert audit_log" ON "uni-wa-bot-audit_log" FOR INSERT WITH CHECK (true);
```

**Actions to log:** rule_added, rule_deleted, submission_reviewed, spam_confirmed, false_positive_marked, allowlist_changed, settings_changed.

**Log in every API route** that modifies data: insert an audit_log entry with action type, details, and requester IP.

#### Implementation Steps

1. Run SQL above
2. Create `web/lib/audit.js` utility: `logAudit(actionType, details, req)` — extracts IP from request headers, inserts into audit_log
3. Call `logAudit()` in all mutating API routes (rules POST/DELETE, submissions PATCH, spam-log PATCH)
4. Create `web/app/api/audit/route.js` with GET
5. Create `web/components/AuditLog.js` — chronological list of admin actions
6. Add to admin panel under Bot Stats tab
7. Build and test

#### Acceptance Criteria

- [ ] Every rule addition/deletion is logged with timestamp
- [ ] Every submission review (approve/dismiss) is logged
- [ ] Every spam confirmation/false-positive marking is logged
- [ ] Audit log is viewable in admin panel
- [ ] Each entry shows action type, details, and timestamp

#### Impact

Full accountability for all admin actions. Enables debugging ("when was this rule deleted?") and compliance.

#### Risks & Edge Cases

- Audit log grows indefinitely. Add a retention policy (e.g. keep last 90 days).
- IP address: behind proxies, `x-forwarded-for` header may be needed.

---

### F-12: Rate Limiting on Public Form

**Priority:** P2 (Medium)
**Severity:** Minor inconvenience
**Estimated Complexity:** S (< 1 day)
**Dependencies:** None

#### Problem Statement

The public spam submission form at `/` has no rate limiting. A malicious user could flood it with thousands of fake submissions, wasting admin review time and filling the database.

#### Proposed Solution

**Server-side rate limiting** in `web/app/api/submissions/route.js`:
- Track submission count per IP address
- Allow max 5 submissions per hour per IP
- Store counts in a simple in-memory Map (sufficient for single Vercel instance)
- Return 429 Too Many Requests with friendly error message

#### Implementation Steps

1. Create `web/lib/rate-limit.js` with a simple IP-based rate limiter using Map + timestamp
2. In `web/app/api/submissions/route.js` POST handler, check rate limit before processing
3. If exceeded, return `{ error: 'Too many submissions. Please try again later.' }` with status 429
4. In `web/components/SubmissionForm.js`, handle 429 response with a specific error message
5. Build and test

#### Acceptance Criteria

- [ ] First 5 submissions in an hour succeed normally
- [ ] 6th submission returns 429 with friendly error message
- [ ] After 1 hour, submissions are allowed again
- [ ] Rate limit does not affect admin panel operations

#### Impact

Prevents form abuse and database flooding.

#### Risks & Edge Cases

- Serverless: Vercel functions are stateless — in-memory Map resets on cold start. For production, use Supabase to store rate limit counts.
- Shared IP: university students often share IP (campus WiFi). Rate limit should be generous (5/hour).

---

### F-13: Submission Deduplication

**Priority:** P2 (Medium)
**Severity:** Minor inconvenience
**Estimated Complexity:** S (< 1 day)
**Dependencies:** None

#### Problem Statement

If 10 students all report the same spam message, the admin sees 10 identical submissions. This wastes review time and clutters the queue.

#### Proposed Solution

Hash the message text (SHA-256) and store as a column. Before inserting, check if a submission with the same hash already exists. If yes, increment a `report_count` field instead of creating a new row.

**Database:**
```sql
ALTER TABLE "uni-wa-bot-submissions" ADD COLUMN IF NOT EXISTS message_hash TEXT;
ALTER TABLE "uni-wa-bot-submissions" ADD COLUMN IF NOT EXISTS report_count INT DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_submissions_hash ON "uni-wa-bot-submissions" (message_hash);
```

**API change:** In POST handler, hash the message, check for existing, upsert.

**Admin display:** Show "Reported X times" badge — higher count = more people saw this spam = higher priority.

#### Implementation Steps

1. Run SQL above
2. In `web/app/api/submissions/route.js` POST, hash message text, check for existing hash
3. If exists: increment report_count, return success
4. If not: insert with hash and report_count=1
5. In `web/components/SubmissionList.js`, show report_count badge
6. Sort by report_count (higher = more urgent) when filter is "pending"
7. Build and test

#### Acceptance Criteria

- [ ] Submitting the same message twice increments report_count instead of creating a duplicate
- [ ] Admin sees "Reported 3 times" badge on submissions
- [ ] Submissions are sorted by report_count (most reported first)
- [ ] Slightly different messages (e.g. extra whitespace) are treated as separate

#### Impact

Reduces admin workload by deduplicating common spam reports. Higher report counts signal community consensus.

#### Risks & Edge Cases

- Hash collision: extremely unlikely with SHA-256 but theoretically possible. Not a practical concern.
- Whitespace/encoding differences: "Hello  world" and "Hello world" would be different hashes. Consider normalizing whitespace before hashing.

---

### F-14: Bot Health Monitoring & Alerts

**Priority:** P2 (Medium)
**Severity:** Minor inconvenience
**Estimated Complexity:** M (1-3 days)
**Dependencies:** F-08 (Scheduled Reports — for email sending infrastructure)

#### Problem Statement

If the bot crashes at 3am and the admin doesn't check the panel until 9am, 6 hours of spam goes undetected. There's no alert mechanism for bot downtime.

#### Proposed Solution

**Supabase Edge Function** (`supabase/functions/health-check/index.ts`):
- Runs every 5 minutes via pg_cron
- Checks `uni-wa-bot-bot_status.updated_at`
- If stale by more than 5 minutes: send "Bot Offline" alert email via Resend
- If bot comes back online after being down: send "Bot Recovered" email
- Store last alert state to avoid duplicate alerts

#### Implementation Steps

1. Create `supabase/functions/health-check/index.ts`
2. Query bot_status, check if updated_at is older than 5 minutes
3. If stale and last alert was not "offline": send alert email, store "offline" state
4. If fresh and last alert was "offline": send recovery email, store "online" state
5. Set up pg_cron to run every 5 minutes
6. Deploy function
7. Test by stopping the bot and waiting 5 minutes

#### Acceptance Criteria

- [ ] Email alert sent within 5 minutes of bot going offline
- [ ] Recovery email sent when bot comes back online
- [ ] No duplicate alerts (one "offline" email until recovery)
- [ ] Alert email includes: when bot was last seen, how long it's been down

#### Impact

Downtime is caught automatically. Admin can respond to outages without manually checking the panel.

#### Risks & Edge Cases

- False alerts: network blip causes heartbeat to miss one cycle. Use a threshold (2 missed heartbeats = 1 minute) before alerting.
- Supabase downtime: if Supabase itself is down, the health check can't run. This is a platform-level risk with no mitigation.

---

## P3 — Nice to Have

---

### F-15: Dark/Light Theme Toggle

**Priority:** P3 (Nice to Have)
**Severity:** Enhancement
**Estimated Complexity:** S (< 1 day)
**Dependencies:** None

#### Problem Statement
The Sentinel Protocol design is dark-mode only. Some users prefer light mode.

#### Proposed Solution
Add CSS custom property toggle. Store preference in localStorage. Toggle button in admin panel top bar.

#### Implementation Steps
1. Create light-mode color tokens in globals.css (surface: white, on-surface: dark, etc.)
2. Add `data-theme` attribute toggle on `<html>` element
3. Read/write preference to localStorage
4. Add toggle icon button (light_mode/dark_mode) in admin header
5. Build and test

#### Acceptance Criteria
- [ ] Clicking theme toggle switches between dark and light mode
- [ ] Preference persists across page reloads
- [ ] All components are readable in both themes

#### Impact
Better accessibility and user preference support.

#### Risks & Edge Cases
- The Sentinel Protocol design is specifically built for dark mode. Light mode will need significant color adjustments to maintain the premium feel.

---

### F-16: Telegram/Discord Integration

**Priority:** P3 (Nice to Have)
**Severity:** Enhancement
**Estimated Complexity:** XL (5+ days)
**Dependencies:** None

#### Problem Statement
The same spam problem exists on Telegram and Discord university groups. Currently a separate tool would be needed.

#### Proposed Solution
Abstract the message handler: create a platform-agnostic `processMessage(text, links, senderId, groupId, platform)` function. Implement platform adapters for Telegram (node-telegram-bot-api) and Discord (discord.js). Share: rule engine, AI classifier, Supabase logging, admin panel.

#### Implementation Steps
1. Refactor `src/index.js` to extract message processing into `src/processor.js`
2. Create `src/platforms/whatsapp.js` (current logic)
3. Create `src/platforms/telegram.js` with Telegram Bot API
4. Create `src/platforms/discord.js` with Discord.js
5. Add platform selection via env vars: `PLATFORMS=whatsapp,telegram`
6. Update admin panel to show platform badges on spam events
7. Build and test each platform independently

#### Acceptance Criteria
- [ ] Same spam message is detected on WhatsApp, Telegram, and Discord
- [ ] Admin panel shows platform badge (WhatsApp/Telegram/Discord) on each event
- [ ] Each platform can be enabled/disabled independently
- [ ] Shared rule engine works across all platforms

#### Impact
One tool covers all university communication platforms.

#### Risks & Edge Cases
- Each platform has different APIs, rate limits, and permission models
- Message format differences (Telegram Markdown vs WhatsApp formatting)
- Admin panel needs to show platform-specific actions (kick on WhatsApp vs ban on Discord)

---

### F-17: API Key for External Integrations

**Priority:** P3 (Nice to Have)
**Severity:** Enhancement
**Estimated Complexity:** M (1-3 days)
**Dependencies:** None

#### Problem Statement
External tools (browser extensions, other bots, automated scanners) can't submit spam reports programmatically.

#### Proposed Solution
Generate API keys in admin panel. Authenticate `/api/submissions` POST with optional `Authorization: Bearer <key>` header. Store keys in Supabase table.

#### Implementation Steps
1. Create `uni-wa-bot-api_keys` table with key, name, created_at, last_used
2. Add API key generation in admin panel settings
3. Modify submissions API to accept Bearer auth (bypass rate limiting for authenticated requests)
4. Build and test

#### Acceptance Criteria
- [ ] Admin can generate API keys from the panel
- [ ] API key authenticates programmatic submissions
- [ ] Authenticated requests bypass rate limiting
- [ ] Keys can be revoked from the panel

#### Impact
Enables ecosystem: browser extensions, automated scanners, integrations with other tools.

#### Risks & Edge Cases
- Leaked API key: must be revocable. Add key rotation support.

---

### F-18: Spam Pattern Analytics

**Priority:** P3 (Nice to Have)
**Severity:** Enhancement
**Estimated Complexity:** L (3-5 days)
**Dependencies:** None

#### Problem Statement
The admin sees individual spam events but can't identify patterns: What type of spam is most common? Is a new spam trend emerging? Which groups are most targeted?

#### Proposed Solution
Analytics dashboard with:
- Category breakdown pie chart (trading vs adult vs gambling vs academic)
- Trend line: spam per week over time
- Top matched rules leaderboard
- Geographic analysis: which country codes (+92, +44, +1) appear most in spam
- Word cloud of most common spam terms
- Group heat map: which groups get the most spam

#### Implementation Steps
1. Create `web/app/api/analytics/route.js` — aggregate queries on spam_log
2. Create `web/components/AnalyticsDashboard.js` with charts (use CSS bar charts or install lightweight chart lib)
3. Add "Analytics" tab to admin panel
4. Implement each visualization
5. Build and test

#### Acceptance Criteria
- [ ] Category breakdown shows which spam types are most common
- [ ] Trend chart shows spam volume over time
- [ ] Top rules leaderboard shows which rules fire most often
- [ ] Data is accurate and matches spam_log entries

#### Impact
Transforms raw data into actionable insights. Admin can prioritize: "Academic fraud is 60% of spam — we need more rules for that."

#### Risks & Edge Cases
- Empty state: new installations have no data. Show friendly "Not enough data yet" messages.
- Performance: aggregate queries on large tables could be slow. Add database indexes.

---

### F-19: Message Queue / Retry System

**Priority:** P3 (Nice to Have)
**Severity:** Enhancement
**Estimated Complexity:** M (1-3 days)
**Dependencies:** None

#### Problem Statement
If Supabase is temporarily unavailable when the bot tries to log a spam event, the event is silently lost. The `logSpamEvent()` function catches errors but doesn't retry.

#### Proposed Solution
Implement a simple in-memory queue with file-based persistence:
1. When Supabase call fails, push the event to a queue
2. Retry queue every 30 seconds with exponential backoff
3. Persist queue to a JSON file so events survive bot restarts
4. When Supabase is back, flush the queue

#### Implementation Steps
1. Create `src/queue.js` with `enqueue(event)`, `processQueue()`, `persistQueue()`, `loadQueue()`
2. In `src/supabase.js`, on error in `logSpamEvent()` and `sendHeartbeat()`, enqueue the failed operation
3. Start a 30-second interval that processes the queue
4. On bot startup, load persisted queue from file and process
5. Add queue stats to heartbeat (queued events count)
6. Build and test

#### Acceptance Criteria
- [ ] Failed Supabase operations are queued instead of lost
- [ ] Queue is retried every 30 seconds
- [ ] Queue survives bot restart (persisted to file)
- [ ] When Supabase recovers, all queued events are flushed
- [ ] Admin panel shows "X events queued" if queue is non-empty

#### Impact
Zero data loss even during Supabase outages.

#### Risks & Edge Cases
- Queue growth: if Supabase is down for hours, queue could grow large. Cap at 1000 events, discard oldest.
- File I/O: writing queue to disk on every enqueue could be slow. Batch writes.

---

### F-20: Custom AI Prompt Configuration

**Priority:** P3 (Nice to Have)
**Severity:** Enhancement
**Estimated Complexity:** M (1-3 days)
**Dependencies:** None

#### Problem Statement
The AI classifier uses a hardcoded prompt. Different universities have different spam patterns. A German university might need the prompt to understand German spam nuances. The admin can't customize this without modifying code.

#### Proposed Solution
Store the AI prompt in Supabase. The bot polls it alongside custom rules. Admin panel has a "Prompt Editor" in the Rules tab with:
- Syntax-highlighted textarea
- "Test Prompt" button that runs a sample message through the custom prompt
- "Reset to Default" button
- Version history (optional)

**Database:**
```sql
CREATE TABLE IF NOT EXISTS "uni-wa-bot-config" (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO "uni-wa-bot-config" (key, value) VALUES ('ai_prompt', '<default prompt>');
```

#### Implementation Steps
1. Run SQL above with the current default prompt from `src/classifier.js`
2. In `src/supabase.js`, add `pollConfig()` to fetch the prompt
3. In `src/classifier.js`, use polled prompt instead of hardcoded one
4. Create `web/app/api/config/route.js` with GET/PUT
5. Create `web/components/PromptEditor.js` with textarea, test button, reset button
6. Add PromptEditor to admin panel Rules tab
7. Build and test

#### Acceptance Criteria
- [ ] Admin can edit the AI prompt from the admin panel
- [ ] Bot uses the updated prompt within 60 seconds
- [ ] "Test Prompt" runs a sample message and shows the AI's response
- [ ] "Reset to Default" restores the original hardcoded prompt
- [ ] Invalid prompt (empty, too short) shows error

#### Impact
Admins can customize AI behavior for their specific university context without touching code.

#### Risks & Edge Cases
- Prompt injection: a malicious prompt could make the AI approve all spam. Add validation (prompt must contain "spam" and "JSON").
- Cost: testing prompts costs API calls. Rate limit test button.

---

## Recommended Implementation Order

Based on dependencies, impact, and complexity:

### Phase 1 — Foundation (Week 1)
1. **F-04: Rule Testing Sandbox** (S) — Immediately useful, no dependencies, prevents false positives
2. **F-07: Allowlist System** (S) — Quick win, prevents admin/professor false positives
3. **F-12: Rate Limiting** (S) — Security hardening, prevents form abuse

### Phase 2 — Intelligence (Week 2)
4. **F-03: Sender Reputation** (L) — Makes bot smarter, enables auto-banning repeat offenders
5. **F-02: Auto-Learn from Confirmations** (M) — Closes the feedback loop, bot improves over time

### Phase 3 — Visibility (Week 3)
6. **F-01: Group Management Dashboard** (L) — Full operational visibility
7. **F-05: Real-time Notifications** (M) — Faster admin response
8. **F-11: Audit Log** (M) — Accountability

### Phase 4 — Coverage (Week 4)
9. **F-06: Multi-language Detection** (M) — Expand to non-English spam
10. **F-08: Scheduled Reports** (M) — Proactive monitoring
11. **F-14: Bot Health Alerts** (M) — Downtime detection

### Phase 5 — Advanced (Week 5+)
12. **F-09: Image/Media Detection** (XL) — Close biggest remaining gap
13. **F-13: Submission Deduplication** (S) — Quality of life
14. **F-10: Export/Import Rules** (S) — Backup and sharing
15. **F-18: Spam Analytics** (L) — Data insights

### Phase 6 — Ecosystem (Future)
16. **F-20: Custom AI Prompt** (M)
17. **F-17: API Keys** (M)
18. **F-19: Message Queue** (M)
19. **F-15: Theme Toggle** (S)
20. **F-16: Multi-platform** (XL)
