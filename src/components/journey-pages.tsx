import Link from 'next/link';
import { EditorialArt } from './editorial-art';
import { NameForm } from './name-form';
import { notFound, redirect } from 'next/navigation';
import { productContext, records } from '@/lib/product-server';
import {
  appointmentKinds,
  monthDate,
  dateLabel,
  daysBetween,
  shiftDate,
  isoToday,
  taskKinds,
  feedingNames,
} from '@/lib/product';
import { gestation } from '@/lib/validation';
import {
  ProductPage,
  PrivatePage,
  Field,
  Select,
  Notes,
  Toggle,
  RowLink,
  Progress,
  Badge,
} from './product-ui';
import { ActionForm } from './form';
import { productAction } from '@/app/product-actions';
import { DeleteForm } from './preparation-pages';
import { Empty } from './ui';
import { careWindows } from '@/lib/care-windows';
import { CareWindows } from './care-windows';
import { Sheet } from './sheet';
type Appointment = {
  id: string;
  title: string;
  kind: string;
  starts_at: string;
  has_time: boolean;
  location: string;
  city: string;
  doctor_id: string | null;
  hospital_id: string | null;
  notes: string;
  steps: { title: string; done: boolean }[];
  reminder: boolean;
  status: string;
  window_key: string | null;
};
export async function JourneyPages({
  path = [],
  query = {},
}: {
  path?: string[];
  query?: Record<string, string | undefined>;
}) {
  const ctx = await productContext(),
    p = ctx.pregnancy;
  const [section, id, mode] = path;
  if (!section) {
    if (!ctx.can('journey.view')) return <PrivatePage />;
    const appointments = await records('appointments', 'appointments.view'),
      custom = await records('milestones', 'journey.view');
    const auto = p
      ? [
          { id: 'start', title: 'بداية الرحلة', event_date: shiftDate(p.due_date, -280) },
          { id: 'first-end', title: 'نهاية الثلث الأول', event_date: shiftDate(p.due_date, -183) },
          { id: 'second', title: 'بداية الثلث الثاني', event_date: shiftDate(p.due_date, -182) },
          { id: 'third', title: 'بداية الثلث الثالث', event_date: shiftDate(p.due_date, -84) },
          { id: 'bag', title: 'تجهيز حقيبة المستشفى', event_date: shiftDate(p.due_date, -28) },
          { id: 'window', title: 'نافذة الولادة المتوقعة', event_date: shiftDate(p.due_date, -21) },
          { id: 'due', title: 'موعد الوصول المتوقع', event_date: p.due_date },
        ].filter((a) => !p.birth_date || a.event_date <= p.birth_date)
      : [];
    const entries = [
      ...careWindows
        .filter(
          (w) =>
            ['early-scan', 'anatomy', 'diabetes', 'tdap', 'gbs'].includes(w.key) &&
            p &&
            (!p.birth_date || shiftDate(p.due_date, w.start * 7 - 280) <= p.birth_date),
        )
        .map((w) => ({
          id: 'care-' + w.key,
          title: w.title,
          event_date: shiftDate(p.due_date, w.start * 7 - 280),
          href: '/today/week',
        })),
      ...auto.map((a) => ({ ...a, href: '/journey/milestone/' + a.id })),
      ...custom.map((a) => ({
        id: a.id,
        title: a.title,
        event_date: a.event_date,
        href: '/journey/milestone/' + a.id,
      })),
      ...appointments
        .filter((a) => a.status !== 'cancelled')
        .map((a) => ({
          id: a.id,
          title: a.title,
          event_date: a.starts_at.slice(0, 10),
          href: '/journey/appointments/' + a.id,
        })),
      ...(p?.birth_date
        ? [
            {
              id: 'birth',
              title: 'الولادة',
              event_date: p.birth_date,
              href: '/journey/birth/confirmed',
            },
            ...[30, 40, 60, 90].map((d, i) => ({
              id: 'after-' + d,
              title: ['الشهر الأول', 'الأربعين', 'الشهر الثاني', 'الشهر الثالث'][i],
              event_date: d === 40 ? shiftDate(p.birth_date, 40) : monthDate(p.birth_date, d / 30),
              href: '/journey/postpartum',
            })),
          ]
        : []),
    ].sort((a, b) => a.event_date.localeCompare(b.event_date));
    const current = entries.findLast((e) => e.event_date <= isoToday());
    return (
      <ProductPage
        title="الرحلة"
        description="كل محطة فصلٌ من حكايتكم"
        active="journey"
        back="/today"
      >
        <EditorialArt
          kind="journey"
          title="رحلة واحدة… نعيشها معاً"
          caption="من أول خبر إلى أول لقاء"
          priority
        />
        <div className="filter-chips">
          {ctx.can('appointments.edit') && (
            <Link href="/journey/appointments/new">+ إضافة موعد</Link>
          )}
          {ctx.can('journey.edit') && (
            <Sheet title="إضافة محطة" trigger="+ إضافة محطة">
              <ActionForm action={productAction} label="إضافة">
                <input type="hidden" name="action" value="milestone" />
                <Field name="title" label="عنوان المحطة" required maxLength={160} />
                <Field name="event_date" label="التاريخ" type="date" value={isoToday()} required />
                <Select
                  name="kind"
                  label="النوع"
                  value="family"
                  options={{
                    family: 'عائلي',
                    manual: 'يدوي',
                    travel: 'سفر',
                    preparation: 'تجهيز',
                    medical: 'طبي',
                  }}
                />
                <Notes name="description" label="وصف · اختياري" />
              </ActionForm>
              <RowLink href="/journey/gender" title="تسجيل الجنس" />
              <RowLink href="/journey/name" title="اختيار الاسم" />
            </Sheet>
          )}
        </div>
        {!entries.length ? (
          <Empty title="الرحلة">ستظهر محطات رحلتكم هنا بعد ضبط موعد الوصول.</Empty>
        ) : (
          <div className="timeline">
            {entries.map((e) => (
              <div key={e.id}>
                <article className={'timeline-entry ' + (e.id === current?.id ? 'current' : '')}>
                  {e.id === current?.id && <Badge tone="needed">المرحلة الحالية</Badge>}
                  <Link href={e.href}>
                    <h2>{e.title}</h2>
                    <small>
                      {dateLabel(e.event_date)}
                      {e.event_date > isoToday()
                        ? ' · بعد ' + daysBetween(e.event_date) + ' أيام'
                        : ''}
                    </small>
                  </Link>
                </article>
                {e.id === current?.id && (
                  <p>
                    اليوم · {dateLabel(isoToday())}
                    {p && !p.birth_date ? ' · الأسبوع ' + (gestation(p.due_date)?.weeks ?? 0) : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {p?.birth_date && <RowLink href="/journey/postpartum" title="الأربعين والأشهر الأولى" />}
      </ProductPage>
    );
  }
  if (section === 'appointments') {
    if (!ctx.can('appointments.view')) return <PrivatePage />;
    const appointments = (await records('appointments', 'appointments.view')) as Appointment[],
      a = appointments.find((x) => x.id === id),
      edit = ctx.can('appointments.edit');
    if (id === 'new' || mode === 'edit') {
      if (!edit) return <PrivatePage />;
      if (id !== 'new' && !a) notFound();
      const providers = await records('providers', 'care.view');
      return (
        <ProductPage
          title={a ? 'تعديل الموعد' : 'إضافة موعد'}
          active="journey"
          back={a ? '/journey/appointments/' + a.id : '/journey'}
        >
          <section className="card">
            <ActionForm action={productAction} label="حفظ">
              <input type="hidden" name="action" value="appointment" />
              {a && <input type="hidden" name="id" value={a.id} />}
              <input type="hidden" name="window_key" value={a?.window_key ?? query.window ?? ''} />
              {(a?.window_key || query.window) && <p>مرتبط بنافذة الرعاية</p>}
              <Select
                name="kind"
                label="نوع الموعد"
                options={appointmentKinds}
                value={a?.kind ?? query.kind ?? 'follow'}
              />
              <div className="form-grid">
                <Field
                  name="date"
                  label="التاريخ"
                  type="date"
                  required
                  value={
                    a
                      ? new Date(Date.parse(a.starts_at) + 10800000).toISOString().slice(0, 10)
                      : isoToday()
                  }
                />
                <Field
                  name="time"
                  label="الوقت · اختياري · بتوقيت السعودية"
                  type="time"
                  value={
                    a?.has_time
                      ? new Date(Date.parse(a.starts_at) + 10800000).toISOString().slice(11, 16)
                      : ''
                  }
                />
              </div>
              <Select
                name="doctor_id"
                label="الطبيب · اختياري"
                options={Object.fromEntries(
                  providers.filter((p) => p.kind === 'doctor').map((p) => [p.id, p.name]),
                )}
                value={a?.doctor_id ?? query.doctor ?? ''}
                empty
              />
              <Select
                name="hospital_id"
                label="المستشفى أو العيادة · اختياري"
                options={Object.fromEntries(
                  providers.filter((p) => p.kind === 'hospital').map((p) => [p.id, p.name]),
                )}
                value={a?.hospital_id ?? query.hospital ?? ''}
                empty
              />
              <Field name="city" label="المدينة" value={a?.city ?? ctx.household?.follow_city} />
              <Field name="location" label="المكان · اختياري" value={a?.location} maxLength={200} />
              <Notes
                name="steps"
                label="ما نجهّزه قبل الموعد · خطوة في كل سطر"
                value={a?.steps.map((s) => s.title).join('\n')}
              />
              <Notes value={a?.notes} />
              <Toggle
                name="reminder"
                label="حفظ تفضيل التذكير · التنبيهات غير مفعّلة بعد"
                checked={a?.reminder ?? true}
              />
            </ActionForm>
          </section>
          {a?.status === 'upcoming' && (
            <details className="card danger-zone">
              <summary>إلغاء الموعد</summary>
              <ActionForm action={productAction} label="تأكيد الإلغاء">
                <input type="hidden" name="action" value="appointment-status" />
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="status" value="cancelled" />
                <Toggle name="confirm" label="نعم، نؤكد إلغاء الموعد" />
              </ActionForm>
            </details>
          )}
        </ProductPage>
      );
    }
    if (!a || mode) notFound();
    const scans = (await records('ultrasounds', 'appointments.view')).filter(
      (s) => s.appointment_id === a.id,
    );
    return (
      <ProductPage title={a.title} active="journey" back="/journey">
        {edit && (
          <Link className="button secondary" href={'/journey/appointments/' + a.id + '/edit'}>
            تعديل
          </Link>
        )}
        <section className="story-panel">
          <div className="fact-number">{new Date(a.starts_at).getUTCDate()}</div>
          <h2>{dateLabel(a.starts_at, true)}</h2>
          <p>
            {a.has_time
              ? new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
                  timeStyle: 'short',
                  timeZone: 'Asia/Riyadh',
                }).format(new Date(a.starts_at))
              : ''}
          </p>
          <Badge tone="medical">
            {a.status === 'completed'
              ? 'تم'
              : a.status === 'cancelled'
                ? 'أُلغي'
                : daysBetween(a.starts_at) === 0
                  ? 'اليوم'
                  : daysBetween(a.starts_at) === 1
                    ? 'غداً'
                    : 'بعد ' + daysBetween(a.starts_at) + ' أيام'}
          </Badge>
        </section>
        <p>
          {a.city} · {a.location}
        </p>
        {a.doctor_id && ctx.can('care.view') && (
          <RowLink href={'/more/providers/doctor/' + a.doctor_id} title="الطبيب" />
        )}
        {a.hospital_id && ctx.can('care.view') && (
          <RowLink href={'/more/providers/hospital/' + a.hospital_id} title="المستشفى أو العيادة" />
        )}
        {a.steps.length > 0 && (
          <section className="card">
            <h2>ما نجهّزه قبل الموعد</h2>
            {a.steps.map((s, i) => (
              <div key={i} className="section-space">
                <strong>
                  {s.done ? '✓ ' : ''}
                  {s.title}
                </strong>
                {edit && (
                  <ActionForm action={productAction} label={s.done ? 'إعادة فتح' : 'تم التجهيز'}>
                    <input type="hidden" name="action" value="appointment-step" />
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="index" value={i} />
                    <input type="hidden" name="done" value={String(!s.done)} />
                  </ActionForm>
                )}
              </div>
            ))}
          </section>
        )}
        {a.notes && (
          <section className="card">
            <h2>ملاحظات</h2>
            <p>{a.notes}</p>
          </section>
        )}
        {(a.kind === 'ultrasound' || scans.length > 0) && (
          <section>
            <h2>سجل السونار</h2>
            {scans.map((s) => (
              <RowLink
                key={s.id}
                href={'/journey/ultrasound/' + s.id}
                title={dateLabel(s.scan_date)}
              />
            ))}
            {edit && (
              <Link
                className="button secondary"
                href={'/journey/ultrasound/new?appointment=' + a.id}
              >
                إضافة سجل سونار
              </Link>
            )}
          </section>
        )}
        {a.status === 'upcoming' && edit && (
          <ActionForm action={productAction} label="تم الموعد">
            <input type="hidden" name="action" value="appointment-status" />
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="status" value="completed" />
          </ActionForm>
        )}
      </ProductPage>
    );
  }
  if (section === 'ultrasound') {
    if (!ctx.can('appointments.view')) return <PrivatePage />;
    const scan =
      id === 'new'
        ? null
        : (await records('ultrasounds', 'appointments.view')).find((s) => s.id === id);
    if (id !== 'new' && !scan) notFound();
    if (id === 'new' && !ctx.can('appointments.edit')) return <PrivatePage />;
    return (
      <ProductPage
        title={scan ? 'سجل السونار' : 'إضافة سجل سونار'}
        active="journey"
        back={scan?.appointment_id ? '/journey/appointments/' + scan.appointment_id : '/journey'}
      >
        <div className="product-art">
          <small>صور السونار تُضاف من جهازكم وتبقى لكم. رفع الصور غير متاح بعد.</small>
        </div>
        <ActionForm action={productAction} label="حفظ" disabled={!ctx.can('appointments.edit')}>
          <input type="hidden" name="action" value="ultrasound" />
          {scan && <input type="hidden" name="id" value={scan.id} />}
          <input
            type="hidden"
            name="appointment_id"
            value={scan?.appointment_id ?? query.appointment ?? ''}
          />
          <Field
            name="scan_date"
            label="التاريخ"
            type="date"
            required
            value={scan?.scan_date ?? isoToday()}
          />
          <Field
            name="week"
            label="أسبوع الحمل عند الفحص · اختياري"
            type="number"
            min={0}
            max={44}
            value={scan?.week ?? (p ? gestation(p.due_date)?.weeks : 0) ?? 0}
          />
          <Notes label="ملاحظات السونار" value={scan?.notes} />
        </ActionForm>
      </ProductPage>
    );
  }
  if (section === 'milestone') {
    if (!ctx.can('journey.view')) return <PrivatePage />;
    const custom = (await records('milestones', 'journey.view')).find((m) => m.id === id);
    const auto: Record<string, [string, number]> = {
      start: ['بداية الرحلة', -280],
      'first-end': ['نهاية الثلث الأول', -183],
      second: ['بداية الثلث الثاني', -182],
      third: ['بداية الثلث الثالث', -84],
      bag: ['تجهيز حقيبة المستشفى', -28],
      window: ['نافذة الولادة المتوقعة', -21],
      due: ['موعد الوصول المتوقع', 0],
    };
    const m =
      custom ??
      (p && auto[id]
        ? { title: auto[id][0], event_date: shiftDate(p.due_date, auto[id][1]), description: '' }
        : null);
    if (!m) notFound();
    return (
      <ProductPage title={m.title} active="journey" back="/journey">
        <section className="card warm">
          <Badge>{m.event_date > isoToday() ? 'قادم' : 'سابق'}</Badge>
          <h2>{dateLabel(m.event_date, true)}</h2>
          <p>{m.description}</p>
        </section>
        {custom && ctx.can('journey.edit') && (
          <DeleteForm action="milestone-delete" id={id} title="حذف المحطة" />
        )}
      </ProductPage>
    );
  }
  if (['name', 'gender', 'birth'].includes(section)) {
    if (!ctx.can('journey.view')) return <PrivatePage />;
    if (!p) redirect('/pregnancy');
    const edit = ctx.can('journey.edit');
    if (section === 'name')
      return (
        <ProductPage
          focused
          title="هل اختَرتم اسماً؟"
          description="يظهر الاسم بلطف حيث يضيف قرباً، دون تكراره في كل عنوان."
          back="/journey"
        >
          <NameForm
            initial={p.baby_name ?? ''}
            week={gestation(p.due_date)?.weeks ?? 0}
            editable={edit}
          />
        </ProductPage>
      );
    if (section === 'gender')
      return (
        <ProductPage
          focused
          title="هل تودّون تسجيل الجنس؟"
          description="خيار اختياري تماماً. يغيّر لمسات بسيطة فقط، ولا يغيّر شكل التطبيق."
          back="/journey"
        >
          <div className="story-panel">
            <div className="story-orbit" />
          </div>
          <ActionForm action={productAction} label="حفظ" disabled={!edit}>
            <input type="hidden" name="action" value="baby-sex" />
            <Select
              name="sex"
              label="تسجيل الجنس"
              options={{
                female: 'بنت',
                male: 'ولد',
                unknown: 'لاحقاً',
                undisclosed: 'نفضّل عدم التسجيل',
              }}
              value={p.sex}
            />
          </ActionForm>
        </ProductPage>
      );
    if (id === 'confirmed') {
      if (!p.birth_date) redirect('/journey/birth');
      return (
        <main className="focused-page">
          <section className="story-panel">
            <div className="story-orbit" />
            <h1>{p.baby_name ? 'أهلاً ' + p.baby_name : 'أهلاً بصغيركم'}</h1>
            <p>بدأ فصل جديد من رحلتكم</p>
            <p>{dateLabel(p.birth_date, true)}</p>
            <Link className="button light" href="/today">
              نكمل معاً
            </Link>
          </section>
        </main>
      );
    }
    if (p.birth_date) redirect('/journey/birth/confirmed');
    return (
      <ProductPage
        focused
        title="وصل صغيرنا"
        description="ستنتقل الرحلة من أسابيع الحمل إلى أيام صغيركم، وستبقى كل الذكريات محفوظة."
        back="/journey"
      >
        <section className="card">
          <ActionForm action={productAction} label="نعم، وصل صغيرنا" disabled={!edit}>
            <input type="hidden" name="action" value="birth" />
            <Field name="birth_date" label="تاريخ الولادة" type="date" max={isoToday()} required />
            <Field name="birth_time" label="وقت الولادة · اختياري" type="time" />
            <Field
              name="baby_name"
              label="اسم الصغير · اختياري"
              value={p.baby_name ?? ''}
              maxLength={60}
            />
            <Select
              name="sex"
              label="تسجيل الجنس · اختياري"
              options={{
                unknown: 'لاحقاً',
                female: 'بنت',
                male: 'ولد',
                undisclosed: 'نفضّل عدم التسجيل',
              }}
              value={p.sex}
            />
            <p className="notice">
              بالتأكيد، يتحوّل التطبيق من أسابيع الحمل إلى عمر الصغير، وتبقى رحلة الحمل محفوظة.
            </p>
            <Toggle name="confirm" label="نؤكد أن الولادة حدثت فعلاً" />
          </ActionForm>
        </section>
      </ProductPage>
    );
  }
  if (section === 'postpartum') {
    if (!ctx.can('journey.view')) return <PrivatePage />;
    if (!p?.birth_date) redirect('/journey');
    const age = Math.max(0, -daysBetween(p.birth_date)),
      tasks = await records('postpartum_tasks', 'care.view'),
      plan = (await records('care_plans', 'care.view'))[0],
      edit = ctx.can('care.edit');
    return (
      <ProductPage
        title="الأربعين والأشهر الأولى"
        description="إيقاع هادئ لأول أيام صغيركم"
        active="journey"
        back="/journey"
      >
        <section className="card warm">
          <h2>{p.baby_name || 'صغيركم'}</h2>
          <div className="fact-number">{age}</div>
          <p>يوماً منذ {dateLabel(p.birth_date)}</p>
          <Progress
            value={Math.min(100, ((age + 1) / 40) * 100)}
            label={age >= 40 ? '✓ اكتملت الأربعين' : `الأربعين · اليوم ${age + 1} من 40`}
          />
        </section>
        <div className="month-cards">
          {['الشهر الأول', 'الشهر الثاني', 'الشهر الثالث'].map((v, i) => (
            <section className="card" key={v}>
              <h3>{v}</h3>
              <p>
                {isoToday() >= monthDate(p.birth_date, i + 1)
                  ? 'تم'
                  : isoToday() >= monthDate(p.birth_date, i)
                    ? 'الآن'
                    : 'لاحقاً'}
              </p>
            </section>
          ))}
        </div>
        {ctx.can('care.view') && (
          <>
            <RowLink
              href="/more/feeding"
              title="خيارات التغذية"
              sub={
                plan?.feeding?.length
                  ? plan.feeding.map((k: keyof typeof feedingNames) => feedingNames[k]).join(' · ')
                  : 'لم تختاروا بعد — ولا بأس بذلك.'
              }
            />
            <h2>كل المهام</h2>
            {!tasks.length && (
              <Empty title="لا مهام اليوم — استريحوا.">مساحة هادئة لأول أيامكم معاً.</Empty>
            )}
            {[false, true].map((done) => (
              <section key={String(done)}>
                {tasks.filter((t) => t.done === done).length > 0 && (
                  <h3>{done ? 'منجزة' : 'مفتوحة'}</h3>
                )}
                {tasks
                  .filter((t) => t.done === done)
                  .map((t) => (
                    <article className="card" key={t.id}>
                      <h3>
                        {done ? '✓ ' : ''}
                        {t.title}
                      </h3>
                      <small>
                        {taskKinds[t.kind as keyof typeof taskKinds]} · {dateLabel(t.task_date)}
                      </small>
                      {edit && (
                        <ActionForm action={productAction} label={done ? 'إعادة فتح' : 'تم'}>
                          <input type="hidden" name="action" value="postpartum-done" />
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="done" value={String(!done)} />
                        </ActionForm>
                      )}
                    </article>
                  ))}
              </section>
            ))}
            {edit && (
              <section className="card">
                <h2>إضافة مهمة</h2>
                <ActionForm action={productAction} label="إضافة مهمة">
                  <input type="hidden" name="action" value="postpartum-task" />
                  <Field name="title" label="المهمة" maxLength={160} required />
                  <Select name="kind" label="النوع" options={taskKinds} value="other" />
                  <Field name="task_date" label="التاريخ · اختياري" type="date" />
                </ActionForm>
              </section>
            )}
          </>
        )}
        <RowLink href="/journey" title="استعرضوا رحلة الحمل كاملة" />
      </ProductPage>
    );
  }
  notFound();
}
