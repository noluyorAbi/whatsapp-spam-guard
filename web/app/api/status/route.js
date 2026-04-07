import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabase
    .from('bot_status')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    return NextResponse.json(null);
  }

  return NextResponse.json(data);
}
