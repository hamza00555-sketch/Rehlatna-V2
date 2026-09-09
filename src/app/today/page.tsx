export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { EditorialArt } from '@/components/editorial-art';
import { ActionForm } from '@/components/form';
import { productAction } from '@/app/product-actions';
import { BabyHero } from '@/components/baby-hero';
import { DangerSigns } from '@/components/sheet';
import { Shell, Empty, Icon } from '@/components/ui';
import { Progress, RowLink } from '@/components/product-ui';
import { productContext, records } from '@/lib/product-server';
import { gestation } from '@/lib/validation';
import {
  babyAge,
  taskKinds,
  dateLabel,
  daysBetween,
  isoToday,
  goalNumbers,
  money,
  type Goal,
} from '@/lib/product';
import { weeklyMedia } from '@/lib/pregnancy-display';
import { careWindows, windowState, type WindowAppointment } from '@/lib/care-windows';
export default async function Today() {
  const ctx = await productContext(),
    p = ctx.pregnancy,
    stage = p ? gestation(p.due_date) : null,
    week = stage?.weeks ?? 0,
    born = Boolean(p?.birth_date);
  const [appointments, items, plans, tasks, registrations, details] = await Promise.all([
    records('appointments', 'appointments.view'),
    records('preparation_items', 'preparation.view'),
    records('care_plans', 'care.view'),
    records('postpartum_tasks', 'care.view'),
    records('care_registrations', 'appointments.view'),
    records('mother_details', 'care.view'),
  ]);
  const next = appointments
      .filter((a) => a.status === 'upcoming' && daysBetween(a.starts_at) >= 0)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0],
    plan = plans[0],
    counted = items.filter((i) => i.status !== 'not_required'),
    ready = counted.filter((i) => i.status === 'ready').length,
    openSteps = next?.steps?.filter((s: { done: boolean }) => !s.done).length ?? 0;
  let action: { title: string; sub?: string; href: string } | null = null;
  if (born) {
    if (next)
      action = {
        title: 'الموعد القادم',
        sub: next.title + ' · ' + dateLabel(next.starts_at),
        href: '/journey/appointments/' + next.id,
      };
    else if (!plan?.feeding?.length && ctx.can('care.edit'))
      action = {
        title: 'خيارات التغذية',
        sub: 'اختاروا ما يناسب عائلتكم. يمكن تعديل الاختيار في أي وقت.',
        href: '/more/feeding',
      };
    else if (tasks.some((t) => !t.done))
      action = { title: tasks.find((t) => !t.done)!.title, href: '/journey/postpartum' };
  } else if (next && daysBetween(next.starts_at) <= 3 && openSteps)
    action = {
      title: 'ما نجهّزه قبل الموعد',
      sub: next.title + ' · ' + dateLabel(next.starts_at),
      href: '/journey/appointments/' + next.id,
    };
  else {
    const attention =
      ctx.can('appointments.view') && p
        ? careWindows
            .filter((w) => !w.optional && (!w.conditional || details[0]?.rh_negative))
            .find((w) => {
              const state = windowState(
                w,
                week,
                registrations.find((r) => r.window_key === w.key)?.status,
                appointments as WindowAppointment[],
                p.due_date,
              );
              return !state.hidden && ['needed', 'unverified'].includes(state.tone);
            })
        : undefined;
    if (attention)
      action = {
        title: attention.title,
        sub: 'يمكن مناقشة هذه المرحلة مع طبيبكم.',
        href: ctx.can('appointments.edit')
          ? `/journey/appointments/new?window=${attention.key}&kind=${attention.kind}`
          : '/today/week',
      };
    else if (!next && ctx.can('appointments.edit'))
      action = { title: 'أضيفوا موعدكم القادم', href: '/journey/appointments/new' };
    else if (week >= 36 && !plan?.hospital_id && ctx.can('care.edit'))
      action = {
        title: 'خطة الولادة',
        sub: 'وقت تأكيد مستشفى الولادة وخطة الوصول.',
        href: '/more/birth-plan',
      };
    else if (week >= 18 && p?.sex === 'unknown' && ctx.can('journey.edit'))
      action = {
        title: 'هل تودّون تسجيل الجنس؟',
        sub: 'خيار اختياري تماماً.',
        href: '/journey/gender',
      };
    else if (!items.length && ctx.can('preparation.edit'))
      action = { title: 'ابدؤوا قائمة التجهيز', href: '/preparation' };
    else if (
      week >= 34 &&
      items.some((i) => i.hospital_bag && !['ready', 'not_required'].includes(i.status))
    )
      action = { title: 'حقيبة المستشفى', href: '/preparation/hospital-bag' };
    else if (
      week >= 28 &&
      ctx.household?.follow_city !== ctx.household?.birth_city &&
      !plan?.move_date &&
      ctx.can('care.edit')
    )
      action = { title: 'خطة السفر للولادة', href: '/more/travel' };
  }
  let finance = null;
  if (ctx.can('finance.view')) {
    const f = await ctx.client
      .from('finance_settings')
      .select('enabled')
      .eq('household_id', ctx.householdId)
      .maybeSingle();
    if (f.error) throw Error('تعذر تحميل الخطة');
    if (f.data?.enabled) {
      const [goals, contributions] = await Promise.all([
        records('finance_goals', 'finance.view'),
        records('finance_contributions', 'finance.view'),
      ]);
      const ns = (goals as Goal[]).map((g) =>
        goalNumbers(
          g,
          contributions
            .filter((c) => c.goal_id === g.id)
            .reduce((s, c) => s + Number(c.amount_cents), 0),
        ),
      );
      finance = {
        target: ns.reduce((s, n) => s + n.target, 0),
        saved: ns.reduce((s, n) => s + Math.min(n.saved, n.target), 0),
        monthly: ns.reduce((s, n) => s + n.monthly, 0),
      };
    }
  }
  const age = born ? Math.max(0, -daysBetween(p.birth_date)) : 0,
    media = weeklyMedia(week);
  return (
    <Shell active="today">
      {ctx.can('journey.view') ? (
        born ? (
          <section className="story-panel">
            <div className="row">
              <span>{dateLabel(isoToday())}</span>
              <Link href="/more" className="member-avatar">
                {Array.from(String(ctx.membership.display_name))[0]}
              </Link>
            </div>
            <div className="story-orbit" />
            <h1>{p.baby_name || 'صغيركم'}</h1>
            <div className="fact-number">{age}</div>
            <p>{babyAge(p.birth_date, p.sex)}</p>
            {age < 40 && <p>الأربعين · اليوم {age + 1} من 40</p>}
            <small>خامة وضوء هادئان — لا صورة شخصية بعد</small>
            <h2>اليوم مع صغيركم</h2>
            {tasks
              .filter((t) => !t.task_date || t.task_date === isoToday())
              .slice(0, 5)
              .map((t) => (
                <div className="card" key={t.id}>
                  <p>
                    {t.done ? '✓ ' : ''}
                    {t.title}
                  </p>
                  <small>{taskKinds[t.kind as keyof typeof taskKinds]}</small>
                  {ctx.can('care.edit') && (
                    <ActionForm action={productAction} label={t.done ? 'إعادة فتح' : 'تم'}>
                      <input type="hidden" name="action" value="postpartum-done" />
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="done" value={String(!t.done)} />
                    </ActionForm>
                  )}
                </div>
              ))}
            <RowLink
              href="/journey/postpartum"
              title="الأربعين وكل المهام"
              sub={
                tasks
                  .filter((t) => !t.done && (!t.task_date || t.task_date === isoToday()))
                  .slice(0, 5)
                  .map((t) => t.title)
                  .join(' · ') || 'لا مهام اليوم — استريحوا.'
              }
            />
          </section>
        ) : stage ? (
          <BabyHero
            weeks={week}
            days={stage.days}
            babyName={p.baby_name}
            memberName={ctx.membership.display_name}
            mother={ctx.roles.includes('mother')}
            dateIso={new Date().toISOString()}
          />
        ) : (
          <Empty title="نبدأ بمعرفة موعد اللقاء">
            {ctx.can('journey.edit') ? (
              <Link href="/pregnancy">أضيفوا موعد الوصول المتوقع لتخصيص الرحلة.</Link>
            ) : (
              'ستظهر رحلتكم بعد تسجيل موعد الوصول المتوقع.'
            )}
          </Empty>
        )
      ) : (
        <section className="story-panel">
          <div className="story-orbit" />
          <h1>مرحباً {ctx.membership.display_name}</h1>
          <p>تفاصيل صغيرة تصنع وصولاً هادئاً.</p>
        </section>
      )}
      {!born && p?.due_updated_at && Date.now() - Date.parse(p.due_updated_at) <= 7 * 86400000 && (
        <p className="notice">تغيّر الأسبوع المعروض لأن موعد الوصول المتوقع تم تعديله.</p>
      )}
      {action && (
        <Link className="card warm detail-row" href={action.href}>
          <span className="icon-tile">
            <Icon name="arrow" />
          </span>
          <span>
            <small>الخطوة التالية</small>
            <h2>{action.title}</h2>
            {action.sub && <p>{action.sub}</p>}
          </span>
        </Link>
      )}
      <div className="today-bento">
        {next && (
          <Link
            href={'/journey/appointments/' + next.id}
            className={'card medical ' + (daysBetween(next.starts_at) <= 2 ? 'wide' : '')}
          >
            <Icon name="calendar" />
            <small>الموعد القادم</small>
            <h2>{next.title}</h2>
            <p>{dateLabel(next.starts_at)}</p>
            {openSteps > 0 && <span className="badge">{openSteps} خطوات</span>}
          </Link>
        )}
        {ctx.can('journey.view') && (
          <Link className="card journey-tile" href="/journey">
            <Icon name="journey" />
            <h2>أين نحن في الرحلة</h2>
            <p>
              {born
                ? 'فصل جديد مع صغيركم'
                : week < 14
                  ? 'بدايات الحكاية'
                  : week < 28
                    ? 'تكبر الحكاية'
                    : 'نقترب من اللقاء'}
            </p>
            <small>استعرضوا محطاتكم القادمة</small>
          </Link>
        )}
        {!born && ctx.can('journey.view') && (
          <Link
            className={'card ' + (!next || daysBetween(next.starts_at) > 2 ? 'wide' : '')}
            href="/today/week"
          >
            <small>تطور الصغير</small>
            <h2>ماذا يحدث هذا الأسبوع؟</h2>
            <p>{media.summary || 'افتحوا تفاصيل الأسبوع ومرحلتكم الحالية.'}</p>
          </Link>
        )}
        {ctx.can('preparation.view') && (
          <Link className="card ready" href="/preparation">
            <EditorialArt kind="essentials" compact caption="نجهّز بحب، وعلى مهل" />
            <Icon name="preparation" />
            <h2>جاهزية التجهيز</h2>
            <Progress
              value={counted.length ? (ready / counted.length) * 100 : 0}
              label={
                counted.length ? `${ready} من ${counted.length} متوفر` : 'ابدؤوا قائمة التجهيز'
              }
            />
          </Link>
        )}
        {finance && (
          <Link className="finance-hero wide" href="/finance">
            <Icon name="lock" />
            <h2>الخطة المالية · خاصة</h2>
            <Progress
              value={finance.target ? (finance.saved / finance.target) * 100 : 0}
              label={`المدّخر ${money(finance.saved, ctx.household?.currency)} من ${money(finance.target, ctx.household?.currency)}`}
            />
            <p>هدف هذا الشهر: {money(finance.monthly, ctx.household?.currency)}</p>
          </Link>
        )}
        {!born && ctx.can('care.view') && (
          <>
            {week >= 24 && ctx.household?.follow_city !== ctx.household?.birth_city && (
              <Link className="card" href="/more/travel">
                <h2>خطة السفر للولادة</h2>
                <p>
                  {ctx.household?.follow_city} ← {ctx.household?.birth_city}
                </p>
                <small>{dateLabel(plan?.move_date)}</small>
              </Link>
            )}
            {week >= 30 && (
              <Link className="card warm" href="/more/birth-plan">
                <h2>خطة الولادة</h2>
                <p>
                  {
                    [
                      plan?.hospital_id,
                      plan?.doctor_id,
                      plan?.insurance_id,
                      plan?.support,
                      plan?.preferences,
                    ].filter(Boolean).length
                  }{' '}
                  من 5 محدد
                </p>
              </Link>
            )}
          </>
        )}
      </div>
      {!born && <DangerSigns />}
    </Shell>
  );
}
