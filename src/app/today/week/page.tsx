export const dynamic = 'force-dynamic';
import { redirect, notFound } from 'next/navigation';
import { context } from '@/lib/supabase';
import { gestation } from '@/lib/validation';
import { WeekPage } from '@/components/week-page';
export default async function Page({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const ctx = await context();
  const { data, error } = await ctx.client
    .from('pregnancies')
    .select('due_date')
    .eq('household_id', ctx.householdId)
    .is('birth_date', null)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw new Error('تعذر تحميل تفاصيل الحمل');
  const stage = data?.[0] ? gestation(data[0].due_date) : null;
  if (!stage) redirect('/pregnancy');
  const query = await searchParams;
  const current = Math.min(40, stage.weeks),
    week = query.week === undefined ? current : Number(query.week);
  if (!Number.isInteger(week) || week < 0 || week > 40) notFound();
  return <WeekPage current={current} week={week} />;
}
