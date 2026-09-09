export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Shell, PageTitle, Empty, Icon } from '@/components/ui';
import { context } from '@/lib/supabase';
import { gestation } from '@/lib/validation';
export default async function Today() {
  const ctx = await context();
  const [pregnancy, appointments, items] = await Promise.all([
    ctx.client
      .from('pregnancies')
      .select('due_date,baby_name')
      .eq('household_id', ctx.householdId)
      .is('birth_date', null)
      .order('created_at', { ascending: false })
      .limit(1),
    ctx.client
      .from('appointments')
      .select('id,title,starts_at,location')
      .eq('household_id', ctx.householdId)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(1),
    ctx.client.from('preparation_items').select('id,status').eq('household_id', ctx.householdId),
  ]);
  if (pregnancy.error || appointments.error || items.error) throw new Error('تعذر تحميل يومكم.');
  const p = pregnancy.data?.[0],
    stage = p ? gestation(p.due_date) : null,
    next = appointments.data?.[0];
  const ready = items.data?.filter((x) => x.status === 'ready').length ?? 0;
  return (
    <Shell active="today">
      <PageTitle
        eyebrow="كل يوم أقرب"
        title={'أهلًا، ' + ctx.membership.display_name}
        description="مساحة هادئة لرحلتكم، خطوة بخطوة."
      />
      {stage ? (
        <section className="week-card">
          <div className="row">
            <span className="eyebrow">عمر الحمل المحسوب من موعد الولادة</span>
            <span className="badge">
              أسبوع {stage.weeks} + {stage.days} أيام
            </span>
          </div>
          <div className="row">
            <div>
              <span className="week-number numeric">{stage.weeks}</span>
              <p>أسبوعًا مكتملًا</p>
            </div>
            <p>
              {p.baby_name || 'صغيركم'}
              <br />
              مع كل يوم، نقترب من اللقاء
            </p>
          </div>
          <div className="stack">
            <div
              className="progress"
              role="progressbar"
              aria-label="المدة التقريبية للحمل"
              aria-valuemin={0}
              aria-valuemax={40}
              aria-valuenow={Math.min(40, stage.weeks)}
            >
              <span style={{ width: Math.min(100, (stage.weeks / 40) * 100) + '%' }} />
            </div>
            <small>
              الموعد المتوقع: <bdi>{p.due_date}</bdi> · يمكن للطبيب تعديله.
            </small>
          </div>
        </section>
      ) : (
        <Empty title="نبدأ بمعرفة موعد اللقاء">
          أضف موعد الولادة المتوقع لتخصيص الرحلة.{' '}
          <Link href="/pregnancy" className="text-link">
            إضافة موعد الولادة
          </Link>
        </Empty>
      )}
      {next ? (
        <Link href="/journey" className="card medical card-link">
          <span className="eyebrow">الموعد القادم</span>
          <h2>{next.title}</h2>
          <p>
            {new Intl.DateTimeFormat('ar-SA', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Asia/Riyadh',
              calendar: 'gregory',
            }).format(new Date(next.starts_at))}
          </p>
          <small>{next.location}</small>
        </Link>
      ) : (
        <Link href="/journey" className="card medical">
          <h2>نرتّب أول موعد؟</h2>
          <p>المواعيد التي تضيفونها تظهر هنا.</p>
        </Link>
      )}
      <div className="bento">
        <Link href="/preparation" className="card ready">
          <Icon name="preparation" />
          <h3>التجهيز على مهل</h3>
          <p>
            {ready} من {items.data?.length ?? 0} جاهز
          </p>
        </Link>
        <Link href="/private" className="card">
          <Icon name="lock" />
          <h3>مساحتي الخاصة</h3>
          <p>المال والملاحظات الشخصية</p>
        </Link>
      </div>
      <Link href="/pregnancy" className="text-link">
        تعديل تفاصيل الحمل
      </Link>
    </Shell>
  );
}
