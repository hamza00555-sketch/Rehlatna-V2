export const dynamic = 'force-dynamic';
import { Shell, PageTitle, Empty } from '@/components/ui';
import { ActionForm } from '@/components/form';
import { addAppointment } from '@/app/actions';
import { context } from '@/lib/supabase';
export default async function Journey() {
  const ctx = await context();
  const { data, error } = await ctx.client
    .from('appointments')
    .select('id,title,starts_at,location')
    .eq('household_id', ctx.householdId)
    .order('starts_at');
  if (error) throw new Error('تعذر تحميل المواعيد');
  return (
    <Shell active="journey">
      <PageTitle
        eyebrow="كل محطة لها حكاية"
        title="رحلتكم"
        description="مواعيدكما المشتركة، من أول زيارة إلى يوم اللقاء."
      />
      {!data.length ? (
        <Empty title="أول محطة تبدأ بموعد">أضف موعد المتابعة، ويقدر شريكك يشوفه من حسابه.</Empty>
      ) : (
        <div className="list">
          {data.map((x) => (
            <article className="card medical" key={x.id}>
              <h2>{x.title}</h2>
              <time dateTime={x.starts_at}>
                {new Intl.DateTimeFormat('ar-SA', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                  timeZone: 'Asia/Riyadh',
                  calendar: 'gregory',
                }).format(new Date(x.starts_at))}
              </time>
              <small>{x.location}</small>
            </article>
          ))}
        </div>
      )}
      <section className="card">
        <h2>إضافة موعد</h2>
        <ActionForm
          action={addAppointment}
          label="حفظ الموعد"
          disabled={ctx.membership.role === 'viewer'}
        >
          <label>
            عنوان الموعد
            <input name="title" required maxLength={80} placeholder="متابعة الحمل" />
          </label>
          <label>
            التاريخ والوقت · بحسب توقيت جهازك
            <input name="startsAt" type="datetime-local" required dir="ltr" />
          </label>
          <label>
            المكان · اختياري
            <input name="location" maxLength={200} />
          </label>
        </ActionForm>
        <small>
          العنوان والمكان مشتركان مع العائلة. احفظ التفاصيل الطبية الحساسة في مساحتك الخاصة.
        </small>
      </section>
    </Shell>
  );
}
