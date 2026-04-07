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

-- Submissions: anon can insert, anyone can read/update
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
