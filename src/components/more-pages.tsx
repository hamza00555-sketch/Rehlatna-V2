import Link from 'next/link';
import { EditorialArt } from './editorial-art';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { productContext, records } from '@/lib/product-server';
import { roleNames, memberRoles, permissions, dateLabel, daysBetween } from '@/lib/product';
import { gestation } from '@/lib/validation';
import { ProductPage, Field, Toggle, RowLink, Select, Progress } from './product-ui';
import { ActionForm } from './form';
import { productAction } from '@/app/product-actions';
import { createInvite, signOut, savePregnancy, removeMember } from '@/app/actions';
import { PermissionEditor } from './permission-editor';
import { CarePages } from './care-pages';
export async function MorePages({
  path = [],
  query = {},
}: {
  path?: string[];
  query?: Record<string, string | undefined>;
}) {
  const ctx = await productContext(),
    p = ctx.pregnancy;
  const [section, id] = path;
  if (['providers', 'birth-plan', 'travel', 'feeding'].includes(section))
    return <CarePages path={path} kindQuery={query.kind} />;
  if (!section || section === 'permissions' || section === 'family') {
    const { data: members, error } = await ctx.client
      .from('memberships')
      .select('user_id,display_name,role,roles,permission_overrides')
      .eq('household_id', ctx.householdId)
      .eq('active', true)
      .order('created_at');
    if (error) throw Error('تعذر تحميل العائلة');
    const finance = await ctx.client
      .from('finance_settings')
      .select('enabled,shared,owner_id')
      .eq('household_id', ctx.householdId)
      .maybeSingle();
    if (finance.error) throw Error('تعذر تحميل الإعدادات');
    if (section === 'family') {
      const m = members.find((m) => m.user_id === id);
      if (!m || path.length !== 2) notFound();
      let rh = false;
      if (memberRoles(m).includes('mother') && ctx.can('care.view'))
        rh = (await records('mother_details', 'care.view'))[0]?.rh_negative ?? false;
      return (
        <ProductPage
          title={m.display_name}
          description={memberRoles(m)
            .map((r) => roleNames[r])
            .join(' · ')}
        >
          {memberRoles(m).includes('mother') && (
            <>
              <p className="notice">نعرض هنا الحد الأدنى من البيانات الحساسة.</p>
              <div className="product-grid">
                <section className="card">
                  <h3>موعد الوصول المتوقع</h3>
                  <p>{dateLabel(p?.due_date)}</p>
                </section>
                <section className="card">
                  <h3>المدن</h3>
                  <p>
                    {ctx.household?.follow_city} ← {ctx.household?.birth_city}
                  </p>
                </section>
              </div>
              {ctx.can('journey.edit') && !p?.birth_date && (
                <details className="card">
                  <summary>تعديل موعد الوصول</summary>
                  <ActionForm action={savePregnancy} label="حفظ">
                    <Field
                      name="dueDate"
                      label="موعد الوصول المتوقع"
                      type="date"
                      value={p?.due_date}
                      required
                    />
                    <input type="hidden" name="babyName" value={p?.baby_name ?? ''} />
                    <p>الأسبوع المعروض يُحسب من الموعد الجديد، والمواعيد المحفوظة لا تتغيّر.</p>
                  </ActionForm>
                </details>
              )}
              {ctx.can('care.edit') && !p?.birth_date && (
                <section className="card">
                  <h2>معلومات تُخصّص المتابعة</h2>
                  <ActionForm action={productAction} label="حفظ">
                    <input type="hidden" name="action" value="rh" />
                    <Toggle name="rh_negative" label="عامل Rh سالب" checked={rh} />
                    <small>
                      يُستخدم فقط لإظهار تذكير مناقشة حقنة Anti-D. اتركيه مطفأً إن لم تكوني متأكدة.
                    </small>
                  </ActionForm>
                </section>
              )}
            </>
          )}
          <section className="card">
            <h2>الصلاحيات</h2>
            {ctx.can('family.manage') ? (
              <PermissionEditor
                id={m.user_id}
                member={m}
                self={m.user_id === ctx.current.id}
                financeOwner={finance.data?.owner_id === ctx.current.id}
              />
            ) : (
              <p>يعدّل الصلاحيات من لديه صلاحية إدارة العائلة.</p>
            )}
          </section>
          {ctx.membership.role === 'owner' && m.user_id !== ctx.current.id && (
            <details className="card danger-zone">
              <summary>إيقاف وصول العضو</summary>
              <p>يمنع هذا الحساب من الوصول للعائلة، ولا ينقل سجلاته الخاصة إلى أحد.</p>
              <ActionForm action={removeMember} label="تأكيد إيقاف الوصول">
                <input type="hidden" name="memberId" value={m.user_id} />
              </ActionForm>
            </details>
          )}
        </ProductPage>
      );
    }
    return (
      <ProductPage
        title={section === 'permissions' ? 'الأدوار والصلاحيات' : 'عائلتنا'}
        description={
          section === 'permissions' ? 'إدارة أفراد العائلة والصلاحيات' : 'شركاء في هذه الرحلة'
        }
        back="/today"
      >
        {!section && (
          <EditorialArt
            kind="journey"
            title="الرحلة أجمل معاً"
            caption="مساحة تجمع عائلتكم"
            priority
          />
        )}
        <div className="product-grid">
          {members.map((m) => (
            <Link className="product-tile" key={m.user_id} href={'/more/family/' + m.user_id}>
              <span className="member-avatar">{Array.from(String(m.display_name))[0]}</span>
              <h2>{m.display_name}</h2>
              <p>
                {memberRoles(m)
                  .map((r) => roleNames[r])
                  .join(' · ')}
              </p>
              <small>
                {m.user_id === ctx.current.id ? 'العضو الحالي · ' : ''}
                {permissions(m).size} صلاحيات
              </small>
            </Link>
          ))}
          {!section && (
            <Link className="product-tile" href="/more/baby">
              <div className="story-orbit" />
              <h2>{p?.baby_name || 'صغيركم'}</h2>
              <p>
                {p?.birth_date
                  ? dateLabel(p.birth_date)
                  : 'الأسبوع ' + (p ? (gestation(p.due_date)?.weeks ?? 0) : 0)}
              </p>
            </Link>
          )}
        </div>
        {ctx.membership.role === 'owner' && (
          <details className="card section-space">
            <summary>إضافة عضو بحسابه</summary>
            <p>الدعوة مرتبطة ببريده. بعد انضمامه يمكنكم تخصيص أدواره وصلاحياته.</p>
            <ActionForm action={createInvite} label="إنشاء رابط الدعوة">
              <Field name="email" label="بريد الشخص المدعو" type="email" required />
              <Select
                name="role"
                label="الدور الأولي"
                options={{ editor: 'الشريك', viewer: 'داعم من العائلة' }}
                value="viewer"
              />
            </ActionForm>
          </details>
        )}
        {!section && (
          <>
            {ctx.can('care.view') && (
              <section className="section-space">
                <h2>الرعاية الصحية</h2>
                <RowLink
                  href="/more/providers"
                  title="الأطباء والمستشفيات والتأمين"
                  sub="كل من يرافقكم في الرحلة في مكان واحد"
                  icon="heart"
                />
              </section>
            )}
            <section className="section-space">
              <h2>التخطيط</h2>
              {ctx.can('care.view') && !p?.birth_date && (
                <>
                  <RowLink
                    href="/more/birth-plan"
                    title="خطة الولادة"
                    sub={'الولادة في ' + (ctx.household?.birth_city || 'مدينتكم')}
                  />
                  {ctx.household?.follow_city !== ctx.household?.birth_city && (
                    <RowLink
                      href="/more/travel"
                      title="خطة السفر"
                      sub={`${ctx.household?.follow_city} ← ${ctx.household?.birth_city}`}
                    />
                  )}
                </>
              )}
              {p?.birth_date && ctx.can('journey.view') && (
                <RowLink href="/journey/postpartum" title="الأربعين والأشهر الأولى" />
              )}
              {ctx.can('care.view') && <RowLink href="/more/feeding" title="خيارات التغذية" />}
              {ctx.can('preparation.view') && !p?.birth_date && (
                <RowLink href="/preparation/hospital-bag" title="حقيبة المستشفى" />
              )}
              {ctx.can('finance.view') && finance.data?.enabled && (
                <RowLink href="/finance" title="الخطة المالية" sub="خاصة" icon="lock" />
              )}
              {ctx.can('journey.edit') && !p?.birth_date && (
                <RowLink
                  href="/journey/birth"
                  title="وصل صغيرنا"
                  sub="سجّلوا الوصول عند حدوثه فعلاً."
                  icon="heart"
                />
              )}
            </section>
            <RowLink href="/more/permissions" title="الأدوار والصلاحيات" />
            <RowLink href="/more/settings" title="الإعدادات والخصوصية" />
          </>
        )}
      </ProductPage>
    );
  }
  if (section === 'baby') {
    return (
      <ProductPage title={p?.baby_name || 'صغيركم'} description="ملف الصغير">
        <section className="story-panel">
          <div className="story-orbit" />
          <p>خامة وضوء هادئان — لا صورة شخصية بعد</p>
          <small>رفع الصور من الجهاز يُضاف في نسخة لاحقة.</small>
        </section>
        <div className="product-grid section-space">
          <section className="card">
            <h3>{p?.birth_date ? 'تاريخ الولادة' : 'موعد الوصول المتوقع'}</h3>
            <p>{dateLabel(p?.birth_date || p?.due_date)}</p>
          </section>
          <section className="card">
            <h3>{p?.birth_date ? 'العمر' : 'الأسبوع الحالي'}</h3>
            <p>
              {p?.birth_date
                ? Math.max(0, -daysBetween(p.birth_date)) + ' أيام'
                : p
                  ? (gestation(p.due_date)?.weeks ?? 0)
                  : '—'}
            </p>
          </section>
        </div>
        {ctx.can('journey.edit') ? (
          <>
            <RowLink
              href="/journey/name"
              title="الاسم"
              sub={p?.baby_name || 'نبقيه «صغيركم» حالياً'}
            />
            <RowLink
              href="/journey/gender"
              title="الجنس"
              sub={
                (
                  { female: 'بنت', male: 'ولد', undisclosed: 'نفضّل عدم التسجيل' } as Record<
                    string,
                    string
                  >
                )[p?.sex] || 'لم يُسجَّل بعد'
              }
            />
            {!p?.birth_date && <RowLink href="/journey/birth" title="وصل صغيرنا" />}
          </>
        ) : (
          <p>{p?.baby_name || 'صغيركم'}</p>
        )}
      </ProductPage>
    );
  }
  if (section === 'settings') {
    const jar = await cookies(),
      fin = await ctx.client
        .from('finance_settings')
        .select('*')
        .eq('household_id', ctx.householdId)
        .maybeSingle();
    return (
      <ProductPage title="الإعدادات · الخصوصية" description="لأن رحلتكم تستحق خصوصية وأماناً">
        <section className="card">
          <h2>خصوصية عائلتكم</h2>
          <p>
            الحمل بيانات حساسة؛ نجمع فقط ما يساعد في المتابعة والتخطيط. الخطة المالية لا تظهر إلا
            لمن أُعطي صلاحيتها.
          </p>
        </section>
        <section className="card">
          <h2>المظهر</h2>
          <ActionForm action={productAction} label="حفظ المظهر">
            <input type="hidden" name="action" value="preferences" />
            <Select
              name="theme"
              label="السمة"
              options={{ system: 'حسب النظام', light: 'فاتح', dark: 'داكن' }}
              value={jar.get('rehlatna-theme')?.value ?? 'system'}
            />
            <Toggle
              name="reduce_motion"
              label="تقليل الحركة"
              checked={jar.get('rehlatna-motion')?.value === 'reduce'}
            />
            <small>يستبدل الفيديو بالصورة الثابتة ويحدّ من الانتقالات.</small>
          </ActionForm>
        </section>
        <section className="card">
          <h2>التنبيهات · غير متاحة بعد</h2>
          <p>التنبيهات لم تُفعَّل في هذه النسخة، ولا يصلكم شيء الآن.</p>
          {['تذكير بالمواعيد', 'تحديث الأسبوع', 'التجهيز'].map((t) => (
            <Toggle key={t} name="notification" label={t} disabled />
          ))}
        </section>
        {fin.data?.owner_id === ctx.current.id && (
          <section className="card">
            <h2>الخطة المالية</h2>
            <p>خاصة بحساب {ctx.membership.display_name}</p>
            {!ctx.can('finance.edit') ? (
              <ActionForm action={productAction} label="إعداد الخطة المالية">
                <input type="hidden" name="action" value="finance-enable" />
              </ActionForm>
            ) : (
              <ActionForm action={productAction} label="حفظ">
                <input type="hidden" name="action" value="finance-settings" />
                <Toggle name="enabled" label="تفعيل التخطيط المالي" checked={fin.data.enabled} />
                <Toggle
                  name="shared"
                  label="مشتركة بين من لديهم صلاحية"
                  checked={fin.data.shared}
                />
                <small>عند المشاركة تظهر أهداف أفراد الخطة لمن لديهم صلاحية مالية.</small>
              </ActionForm>
            )}
          </section>
        )}
        {!fin.data && ctx.can('family.manage') && (
          <section className="card">
            <ActionForm action={productAction} label="إعداد التخطيط المالي">
              <input type="hidden" name="action" value="finance-enable" />
            </ActionForm>
          </section>
        )}
        {ctx.can('family.manage') && (
          <section className="card">
            <h2>اسم التطبيق والمدن</h2>
            <ActionForm action={productAction} label="حفظ">
              <input type="hidden" name="action" value="profile" />
              <Field
                name="name"
                label="اسم التطبيق"
                value={ctx.household?.name}
                required
                maxLength={40}
              />
              <Field
                name="follow_city"
                label="مدينة المتابعة"
                value={ctx.household?.follow_city}
                required
                maxLength={100}
              />
              <Field
                name="birth_city"
                label="مدينة الولادة"
                value={ctx.household?.birth_city}
                required
                maxLength={100}
              />
              <Field
                name="currency"
                label="العملة"
                value={ctx.household?.currency ?? 'SAR'}
                maxLength={3}
                required
              />
            </ActionForm>
          </section>
        )}
        <section className="card">
          <h2>تصدير البيانات</h2>
          <p>النسخة تحتوي فقط ما يحق لحسابكم رؤيته.</p>
          <a className="button secondary" href="/api/export" download>
            طلب نسخة من بياناتكم
          </a>
        </section>
        <section className="card">
          <h2>الحساب</h2>
          <p>
            <bdi>{ctx.current.email}</bdi>
          </p>
          <form action={signOut}>
            <button className="button secondary">تسجيل الخروج</button>
          </form>
        </section>
        {ctx.membership.role === 'owner' && (
          <details className="card danger-zone">
            <summary>مسح كل البيانات والبدء من جديد</summary>
            <p>
              سيُحذف بيتكم بكل ما فيه نهائياً ولا يمكن التراجع. صدّروا نسخة قبل المتابعة إن احتجتم
              إليها.
            </p>
            <ActionForm action={productAction} label="نعم، امسحوا كل شيء">
              <input type="hidden" name="action" value="reset" />
              <Toggle name="confirm" label="أؤكد حذف بيتنا بكل بياناته نهائياً" />
            </ActionForm>
          </details>
        )}
      </ProductPage>
    );
  }
  notFound();
}
