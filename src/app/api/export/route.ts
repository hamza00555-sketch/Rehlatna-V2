import { context } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET() {
  const ctx = await context();
  const tables: Record<string, Parameters<typeof ctx.can>[0]> = {
    pregnancies: 'journey.view',
    milestones: 'journey.view',
    appointments: 'appointments.view',
    ultrasounds: 'appointments.view',
    care_registrations: 'appointments.view',
    preparation_items: 'preparation.view',
    providers: 'care.view',
    care_plans: 'care.view',
    mother_details: 'care.view',
    verification_tasks: 'care.view',
    postpartum_tasks: 'care.view',
    finance_goals: 'finance.view',
    finance_contributions: 'finance.view',
    finance_changes: 'finance.view',
  };
  const out: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    household: ctx.household,
  };
  for (const [table, permission] of Object.entries(tables)) {
    if (!ctx.can(permission)) continue;
    const r = await ctx.client.from(table).select('*').eq('household_id', ctx.householdId);
    if (r.error) return new Response('تعذر تصدير البيانات. حاولوا مرة أخرى.', { status: 500 });
    out[table] = r.data;
  }
  const own = await ctx.client
    .from('private_records')
    .select('*')
    .eq('household_id', ctx.householdId);
  if (own.error) return new Response('تعذر التصدير', { status: 500 });
  out.private_records = own.data;
  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rehlatna-export.json"',
      'Cache-Control': 'no-store',
    },
  });
}
