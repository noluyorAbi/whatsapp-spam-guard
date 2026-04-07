import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// POST — public submission
export async function POST(req) {
  const { message_text, submitted_by } = await req.json();

  if (!message_text?.trim()) {
    return NextResponse.json({ error: 'message_text required' }, { status: 400 });
  }

  const { error } = await supabase.from('uni-wa-bot-submissions').insert({
    message_text: message_text.trim(),
    submitted_by: submitted_by?.trim() || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// GET — list submissions (admin)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('status') || 'pending';

  let query = supabase
    .from('uni-wa-bot-submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH — update submission status (admin)
export async function PATCH(req) {
  const { id, status } = await req.json();

  const { error } = await supabase
    .from('uni-wa-bot-submissions')
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
