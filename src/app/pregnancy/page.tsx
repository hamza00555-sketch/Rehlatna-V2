export const dynamic = 'force-dynamic';
import { Shell, PageTitle } from '@/components/ui';
import { ActionForm } from '@/components/form';
import { savePregnancy } from '@/app/actions';
import { context } from '@/lib/supabase';
export default async function Pregnancy() {
  const ctx = await context();
  const { data, error } = await ctx.client
    .from('pregnancies')
    .select('due_date,baby_name')
    .eq('household_id', ctx.householdId)
    .is('birth_date', null)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw new Error('تعذر تحميل الحمل');
  return (
    <Shell active="today">
      <PageTitle
        title="موعد ننتظره معًا"
        description="أدخل الموعد المتوقع الذي حدده الطبيب، ويمكنك تعديله لاحقًا."
      />
      <section className="card">
        <ActionForm
          action={savePregnancy}
          label="حفظ التفاصيل"
          disabled={ctx.membership.role === 'viewer'}
        >
          <label>
            موعد الولادة المتوقع
            <input
              name="dueDate"
              type="date"
              defaultValue={data?.[0]?.due_date}
              required
              dir="ltr"
            />
          </label>
          <label>
            اسم الصغير · اختياري
            <input name="babyName" defaultValue={data?.[0]?.baby_name ?? ''} maxLength={80} />
          </label>
        </ActionForm>
      </section>
    </Shell>
  );
}
