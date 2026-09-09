import Link from 'next/link';
import { notFound } from 'next/navigation';
import { productContext, records } from '@/lib/product-server';
import {
  doctorRoles,
  coverageNames,
  feedingNames,
  dateLabel,
  daysBetween,
  insuranceDisclaimer,
  type Provider,
} from '@/lib/product';
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
import { Empty, Icon } from './ui';
function ProviderForm({
  provider,
  kind = 'doctor',
  city = '',
}: {
  provider?: Provider;
  kind?: string;
  city?: string;
}) {
  const k = provider?.kind ?? kind;
  return (
    <section className="card">
      <ActionForm action={productAction} label="حفظ">
        <input type="hidden" name="action" value="provider" />
        <input type="hidden" name="kind" value={k} />
        {provider && <input type="hidden" name="id" value={provider.id} />}
        <Field
          name="name"
          label={k === 'hospital' ? 'اسم المستشفى' : k === 'insurance' ? 'شركة التأمين' : 'الاسم'}
          value={provider?.name}
          required
          maxLength={120}
        />
        {k === 'doctor' && (
          <>
            <Select
              name="doctor_role"
              label="الدور"
              options={doctorRoles}
              value={provider?.doctor_role ?? 'follow'}
            />
            <Field name="specialty" label="التخصص · اختياري" value={provider?.specialty} />
          </>
        )}
        {k !== 'insurance' && (
          <>
            <Field name="city" label="المدينة" value={provider?.city ?? city} maxLength={100} />
            <Field name="phone" label="الهاتف · اختياري" type="tel" value={provider?.phone} />
          </>
        )}
        {k === 'hospital' && (
          <>
            <label>الغرض</label>
            {Object.entries({ follow: 'متابعة', birth: 'ولادة', emergency: 'طوارئ' }).map(
              ([v, label]) => (
                <label className="toggle-row" key={v}>
                  {label}
                  <input
                    type="checkbox"
                    name="purposes"
                    value={v}
                    defaultChecked={(provider?.purposes ?? ['birth']).includes(v)}
                  />
                </label>
              ),
            )}
            <Select
              name="coverage"
              label="التغطية التأمينية"
              options={coverageNames}
              value={provider?.coverage ?? 'unknown'}
            />
            <p className="notice">التغطية تُسجَّل كاعتقاد يحتاج تحققاً، ولا تُعرض كضمان.</p>
            <Field name="website" label="الموقع · اختياري" type="url" value={provider?.website} />
          </>
        )}
        {k === 'insurance' && (
          <>
            <Field name="program" label="الفئة أو البرنامج · اختياري" value={provider?.program} />
            <p className="notice">{insuranceDisclaimer}</p>
          </>
        )}
        <Notes
          label={k === 'insurance' ? 'ملاحظات التغطية · اختياري' : 'ملاحظات · اختياري'}
          value={provider?.notes}
        />
      </ActionForm>
    </section>
  );
}
export async function CarePages({
  path,
  kindQuery = 'doctor',
}: {
  path: string[];
  kindQuery?: string;
}) {
  const ctx = await productContext();
  if (!ctx.can('care.view')) return <PrivatePage />;
  const providers = (await records('providers', 'care.view')) as Provider[],
    edit = ctx.can('care.edit');
  const [section, key, id] = path;
  if (section === 'providers') {
    if (key === 'new' || key === 'edit') {
      if (!edit) return <PrivatePage />;
      const provider =
        key === 'edit' ? providers.find((p) => p.id === path[3] && p.kind === id) : undefined;
      if (key === 'edit' && !provider) notFound();
      const kind =
        provider?.kind ??
        (['doctor', 'hospital', 'insurance'].includes(kindQuery) ? kindQuery : 'doctor');
      return (
        <ProductPage
          title={provider ? 'تعديل' : 'إضافة مقدم رعاية'}
          description="طبيب، مستشفى، أو شركة تأمين"
          back="/more/providers"
        >
          {!provider && (
            <div className="filter-chips">
              {Object.entries({ doctor: 'طبيب', hospital: 'مستشفى', insurance: 'تأمين' }).map(
                ([v, l]) => (
                  <Link
                    href={'/more/providers/new?kind=' + v}
                    key={v}
                    aria-current={kind === v ? 'page' : undefined}
                  >
                    {l}
                  </Link>
                ),
              )}
            </div>
          )}
          <ProviderForm
            key={kind}
            provider={provider}
            kind={kind}
            city={ctx.household?.follow_city}
          />
          {provider && (
            <DeleteForm action="provider-delete" id={provider.id} title="حذف مقدم الرعاية" />
          )}
        </ProductPage>
      );
    }
    if (key) {
      const p = providers.find((p) => p.id === id && p.kind === key);
      if (!p || path.length !== 3) notFound();
      const appointments = ctx.can('appointments.view')
        ? await records('appointments', 'appointments.view')
        : [];
      const related = appointments.filter((a) => a.doctor_id === id || a.hospital_id === id);
      const tasks = (await records('verification_tasks', 'care.view')).filter(
        (t) => t.provider_id === id,
      );
      return (
        <ProductPage
          title={p.name}
          description={
            p.kind === 'doctor'
              ? doctorRoles[p.doctor_role] + ' · ' + p.specialty
              : p.city || p.program
          }
          back="/more/providers"
        >
          {edit && (
            <Link className="button secondary" href={`/more/providers/edit/${p.kind}/${p.id}`}>
              تعديل
            </Link>
          )}
          {p.kind === 'hospital' && (
            <div className="product-art">
              <Icon name="today" />
              <small>صورة المكان قيد الإعداد</small>
            </div>
          )}
          {p.kind !== 'doctor' && (
            <section
              className={
                'card ' +
                (p.last_verified &&
                daysBetween(p.last_verified) > -90 &&
                p.coverage === 'believed_included'
                  ? 'ready'
                  : 'warm')
              }
            >
              <h2>{coverageNames[p.coverage]}</h2>
              <p>
                {p.last_verified ? 'آخر تحقق: ' + dateLabel(p.last_verified) : 'لم يتم التحقق بعد'}
              </p>
              {p.last_verified && daysBetween(p.last_verified) < -90 && (
                <Badge tone="unverified">مرّ وقت طويل على آخر تحقق</Badge>
              )}
              <p>{insuranceDisclaimer}</p>
              {edit && (
                <details>
                  <summary>تأكّد من التغطية</summary>
                  <ActionForm action={productAction} label="تحقّقنا اليوم">
                    <input type="hidden" name="action" value="verify-provider" />
                    <input type="hidden" name="id" value={p.id} />
                    <Select
                      name="coverage"
                      label="ما الذي تحققتم منه؟"
                      options={coverageNames}
                      value={p.coverage}
                    />
                  </ActionForm>
                  <ActionForm action={productAction} label="إنشاء مهمة تحقق">
                    <input type="hidden" name="action" value="verification-task" />
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="title" value={'تأكيد تغطية ' + p.name} />
                  </ActionForm>
                </details>
              )}
            </section>
          )}
          {tasks.length > 0 && (
            <section>
              <h2>مهام التحقق</h2>
              {tasks.map((t) => (
                <div className="card" key={t.id}>
                  <strong>
                    {t.done ? '✓ ' : ''}
                    {t.title}
                  </strong>
                  {edit && (
                    <ActionForm action={productAction} label={t.done ? 'إعادة فتح' : 'تم التحقق'}>
                      <input type="hidden" name="action" value="verification-done" />
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="done" value={String(!t.done)} />
                    </ActionForm>
                  )}
                </div>
              ))}
            </section>
          )}
          {related.length > 0 && (
            <section>
              <h2>المواعيد المرتبطة</h2>
              {related.map((a) => (
                <RowLink
                  key={a.id}
                  href={'/journey/appointments/' + a.id}
                  title={a.title}
                  sub={dateLabel(a.starts_at)}
                  badge={a.status === 'completed' ? 'مكتمل' : undefined}
                />
              ))}
            </section>
          )}
          {p.notes && (
            <section className="card">
              <h2>ملاحظات</h2>
              <p>{p.notes}</p>
            </section>
          )}
          <div className="filter-chips">
            {p.phone && <a href={'tel:' + p.phone.replace(/[^+\d]/g, '')}>اتصال</a>}
            {/^https?:\/\//.test(p.website) && (
              <a href={p.website} target="_blank" rel="noreferrer">
                فتح الموقع
              </a>
            )}
            {ctx.can('appointments.edit') && (
              <Link
                href={
                  '/journey/appointments/new?' +
                  (p.kind === 'doctor' ? 'doctor' : 'hospital') +
                  '=' +
                  p.id
                }
              >
                إضافة موعد
              </Link>
            )}
            {edit && p.kind === 'hospital' && p.purposes.includes('birth') && (
              <Link href={'/more/birth-plan?hospital=' + p.id}>اختيار المستشفى</Link>
            )}
          </div>
        </ProductPage>
      );
    }
    return (
      <ProductPage title="الرعاية الصحية" description="كل من يرافقكم في الرحلة في مكان واحد">
        {!providers.length && (
          <Empty title="لا مقدمي رعاية بعد">
            أضيفوا طبيب المتابعة أو مستشفى الولادة أو التأمين.
          </Empty>
        )}
        {[
          {
            title: 'متابعة الحمل',
            sub: ctx.household?.follow_city,
            items: providers.filter((p) =>
              p.kind === 'doctor'
                ? ['follow', 'consultant'].includes(p.doctor_role)
                : p.kind === 'hospital' && p.purposes.includes('follow'),
            ),
          },
          {
            title: 'الولادة',
            sub: ctx.household?.birth_city,
            items: providers.filter((p) =>
              p.kind === 'doctor'
                ? ['birth', 'backup'].includes(p.doctor_role)
                : p.kind === 'hospital' &&
                  (p.purposes.includes('birth') || p.purposes.includes('emergency')),
            ),
          },
          {
            title: 'التأمين',
            sub: 'التغطية تُسجَّل كاعتقاد يحتاج تحققاً، ولا تُعرض كضمان.',
            items: providers.filter((p) => p.kind === 'insurance'),
          },
        ].map((group) => (
          <section className="section-space" key={group.title}>
            <h2>{group.title}</h2>
            <small>{group.sub}</small>
            {group.items.length ? (
              group.items.map((p) => (
                <RowLink
                  key={p.id}
                  href={`/more/providers/${p.kind}/${p.id}`}
                  title={p.name}
                  sub={p.kind === 'doctor' ? doctorRoles[p.doctor_role] : p.city || p.program}
                  badge={
                    p.kind === 'doctor'
                      ? undefined
                      : p.last_verified
                        ? 'آخر تحقق ' + dateLabel(p.last_verified)
                        : 'يحتاج تحقق'
                  }
                />
              ))
            ) : (
              <p>لم يتم الاختيار بعد</p>
            )}
          </section>
        ))}
        {edit && (
          <Link className="button full" href="/more/providers/new">
            إضافة مقدم رعاية
          </Link>
        )}
      </ProductPage>
    );
  }
  if (!['travel', 'birth-plan', 'feeding'].includes(section) || path.length > 1) notFound();
  const plan = (await records('care_plans', 'care.view'))[0];
  const options = (kind: string) =>
    Object.fromEntries(
      providers.filter((p) => p.kind === kind).map((p) => [p.id, p.name + ' · ' + p.city]),
    );
  if (section === 'birth-plan') {
    const total = [
      plan?.hospital_id,
      plan?.doctor_id,
      plan?.insurance_id,
      plan?.support,
      plan?.preferences,
    ].filter(Boolean).length;
    return (
      <ProductPage title="خطة الولادة" description="نخطط بهدوء… ليوم نلتقي فيه">
        <section className="card warm">
          <h2>الولادة في {ctx.household?.birth_city || 'مدينتكم'}</h2>
          <p>{dateLabel(ctx.pregnancy?.due_date)}</p>
          <Progress
            value={(total / 5) * 100}
            label={`${total} من 5 محدد · ${total === 5 ? 'مكتمل' : 'أنتم على الطريق الصحيح'}`}
          />
        </section>
        <section className="card">
          <ActionForm action={productAction} label="حفظ" disabled={!edit}>
            <input type="hidden" name="action" value="birth-plan" />
            <Select
              name="hospital_id"
              label="مستشفى الولادة"
              options={options('hospital')}
              value={plan?.hospital_id ?? ''}
              empty
            />
            <Select
              name="doctor_id"
              label="طبيب الولادة"
              options={options('doctor')}
              value={plan?.doctor_id ?? ''}
              empty
            />
            <Select
              name="insurance_id"
              label="التأمين"
              options={options('insurance')}
              value={plan?.insurance_id ?? ''}
              empty
            />
            <Field
              name="support"
              label="المرافق أو الدعم · اختياري"
              value={plan?.support}
              maxLength={300}
            />
            <Notes name="preferences" label="تفضيلات · اختياري" value={plan?.preferences} />
          </ActionForm>
        </section>
        <p className="notice">كل تفصيلة تصنع فرقاً — الخطة مرنة وتُعدَّل مع الوقت.</p>
        <RowLink href="/preparation/hospital-bag" title="متابعة التجهيز · حقيبة المستشفى" />
      </ProductPage>
    );
  }
  if (section === 'travel')
    return (
      <ProductPage
        title={'السفر إلى ' + (ctx.household?.birth_city || 'مدينة الولادة')}
        description={'من ' + (ctx.household?.follow_city || 'مدينة المتابعة')}
      >
        {ctx.household?.follow_city === ctx.household?.birth_city && !plan?.move_date && (
          <p className="notice">مدينة المتابعة هي مدينة الولادة — لا حاجة لخطة سفر حالياً.</p>
        )}
        <section className="card">
          <ActionForm action={productAction} label="حفظ خطة السفر" disabled={!edit}>
            <input type="hidden" name="action" value="travel" />
            <div className="form-grid">
              <Field
                name="travel_from"
                label="من"
                value={plan?.travel_from || ctx.household?.follow_city}
                required
              />
              <Field
                name="travel_to"
                label="إلى"
                value={plan?.travel_to || ctx.household?.birth_city}
                required
              />
              <Field
                name="move_date"
                label="تاريخ الانتقال المخطط · اختياري"
                type="date"
                value={plan?.move_date ?? ''}
              />
              <Field
                name="return_date"
                label="تاريخ العودة · اختياري"
                type="date"
                value={plan?.return_date ?? ''}
              />
            </div>
            <Notes
              name="travel_steps"
              label="ما نجهّزه للسفر · خطوة في كل سطر"
              value={(plan?.travel_steps ?? []).map((s: { title: string }) => s.title).join('\n')}
            />
            <Notes name="travel_notes" value={plan?.travel_notes} />
          </ActionForm>
        </section>
      </ProductPage>
    );
  return (
    <ProductPage
      title="خيارات التغذية"
      description="لا يوجد اختيار صحيح للجميع — ما يناسب عائلتكم هو الصواب."
      back={ctx.pregnancy?.birth_date ? '/journey/postpartum' : '/more'}
    >
      <p>اختاروا ما يناسب عائلتكم. يمكن تعديل الاختيار في أي وقت.</p>
      <section className="card">
        <ActionForm action={productAction} label="حفظ الاختيار" disabled={!edit}>
          <input type="hidden" name="action" value="feeding" />
          {Object.entries(feedingNames).map(([v, l]) => (
            <label className="choice-card" key={v}>
              <input
                type="checkbox"
                name="feeding"
                value={v}
                defaultChecked={(plan?.feeding ?? []).includes(v)}
              />
              {l}
            </label>
          ))}
          <Notes name="feeding_notes" label="ملاحظات · اختياري" value={plan?.feeding_notes} />
        </ActionForm>
      </section>
      <p className="notice">التطبيق لا يقدّم توصية تغذية؛ الاستشارة الطبية هي مرجع أي قرار.</p>
    </ProductPage>
  );
}
