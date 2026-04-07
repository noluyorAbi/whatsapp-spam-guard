import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET — list custom rules
export async function GET() {
  const { data, error } = await supabase
    .from('custom_rules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST — add rules
export async function POST(req) {
  const { rules } = await req.json();

  if (!rules?.length) {
    return NextResponse.json({ error: 'rules required' }, { status: 400 });
  }

  const { error } = await supabase.from('custom_rules').insert(rules);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE — remove a rule
export async function DELETE(req) {
  const { id } = await req.json();

  const { error } = await supabase.from('custom_rules').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
