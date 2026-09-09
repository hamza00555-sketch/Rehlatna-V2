export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { BabyHero } from '@/components/baby-hero';
import { DangerSigns } from '@/components/sheet';
import { Shell, Empty, Icon, SectionHeading } from '@/components/ui';
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
      {stage ? (
        <BabyHero
          weeks={stage.weeks}
          days={stage.days}
          babyName={p.baby_name}
          memberName={ctx.membership.display_name}
          dateIso={new Date().toISOString()}
        />
      ) : (
        <Empty title="نبدأ بمعرفة موعد اللقاء">
          أضف موعد الولادة المتوقع لتخصيص الرحلة.
          <Link href="/pregnancy" className="text-link">
            إضافة موعد الولادة
          </Link>
        </Empty>
      )}
      <SectionHeading title="تفاصيل يومكم" subtitle="خطوة صغيرة، كل يوم" />
      <div className="today-grid">
        {next ? (
          <Link href="/journey" className="card medical appointment-card card-link">
            <div className="row">
              <span className="icon-tile">
                <Icon name="calendar" />
              </span>
              <span className="badge">الموعد القادم</span>
            </div>
            <h2>{next.title}</h2>
            <p>
              {new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Asia/Riyadh',
                calendar: 'gregory',
              }).format(new Date(next.starts_at))}
            </p>
            <small>{next.location}</small>
          </Link>
        ) : (
          <Link href="/journey" className="card medical appointment-card">
            <span className="icon-tile">
              <Icon name="calendar" />
            </span>
            <h2>نرتّب أول موعد؟</h2>
            <p>المواعيد التي تضيفونها تظهر هنا.</p>
          </Link>
        )}
        <div className="bento">
          <Link href="/preparation" className="card ready feature-card">
            <span className="icon-tile">
              <Icon name="preparation" />
            </span>
            <h3>التجهيز على مهل</h3>
            <p>
              {ready} من {items.data?.length ?? 0} جاهز
            </p>
          </Link>
          <Link href="/today/week" className="card private-card feature-card">
            <span className="icon-tile">
              <Icon name="lock" />
            </span>
            <h3>ماذا يحدث هذا الأسبوع؟</h3>
            <p>تطور الأسبوع ومرحلتكم الحالية</p>
          </Link>
        </div>
      </div>
      <DangerSigns />
      <Link href="/pregnancy" className="text-link">
        تعديل تفاصيل الحمل
      </Link>
    </Shell>
  );
}
