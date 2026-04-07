import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  // Fetch bot heartbeat status
  const { data: botStatus } = await supabase
    .from('uni-wa-bot-bot_status')
    .select('*')
    .eq('id', 1)
    .single();

  // Fetch real counts from spam_log
  const { count: totalBlocked } = await supabase
    .from('uni-wa-bot-spam_log')
    .select('*', { count: 'exact', head: true });

  const { count: confirmedSpam } = await supabase
    .from('uni-wa-bot-spam_log')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed');

  const { count: falsePositives } = await supabase
    .from('uni-wa-bot-spam_log')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'false_positive');

  // Fetch timeline data — spam events per day for last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentEvents } = await supabase
    .from('uni-wa-bot-spam_log')
    .select('created_at, was_ai_classified, status')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true });

  // Aggregate by day
  const timeline = {};
  (recentEvents || []).forEach((e) => {
    const day = new Date(e.created_at).toISOString().split('T')[0];
    if (!timeline[day]) timeline[day] = { date: day, total: 0, ai: 0, rule: 0 };
    timeline[day].total++;
    if (e.was_ai_classified) timeline[day].ai++;
    else timeline[day].rule++;
  });

  // Fetch hourly distribution (what hours spam is most active)
  const hourlyDist = new Array(24).fill(0);
  (recentEvents || []).forEach((e) => {
    const hour = new Date(e.created_at).getHours();
    hourlyDist[hour]++;
  });

  if (!botStatus) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    ...botStatus,
    // Override in-memory counters with real DB counts
    spam_blocked: totalBlocked || 0,
    confirmed_spam: confirmedSpam || 0,
    false_positives: falsePositives || 0,
    // Analytics data
    timeline: Object.values(timeline),
    hourly_distribution: hourlyDist,
    total_events: recentEvents?.length || 0,
  });
}
