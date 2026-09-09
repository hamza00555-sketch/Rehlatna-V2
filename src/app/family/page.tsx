export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Shell, PageTitle, Icon } from '@/components/ui';
import { ActionForm } from '@/components/form';
import { createInvite, removeMember, signOut, switchFamily } from '@/app/actions';
import { context } from '@/lib/supabase';
export default async function Family() {
  const ctx = await context();
  const { data, error } = await ctx.client
    .from('memberships')
    .select('user_id,display_name,role')
    .eq('household_id', ctx.householdId)
    .eq('active', true)
    .order('created_at');
  if (error) throw new Error('تعذر تحميل الأعضاء');
  const names: Record<string, string> = {
    owner: 'مدير العائلة',
    editor: 'شريك في المتابعة',
    viewer: 'داعم · مشاهدة',
  };
  return (
    <Shell active="family">
      <PageTitle title="عائلتنا" description="لكل شخص حسابه، ولكل واحد مساحته." />
      {ctx.memberships.length > 1 && (
        <form className="card" action={switchFamily}>
          <label>
            العائلة الحالية
            <select name="householdId" defaultValue={ctx.householdId}>
              {ctx.memberships.map((m) => (
                <option value={m.household_id} key={m.household_id}>
                  {(Array.isArray(m.households) ? m.households[0] : m.households)?.name ?? 'عائلة'}
                </option>
              ))}
            </select>
          </label>
          <button className="button secondary">تبديل العائلة</button>
        </form>
      )}
      <div className="list">
        {data.map((m) => (
          <article className="card" key={m.user_id}>
            <div className="row">
              <h2>{m.display_name}</h2>
              <span className="badge">{names[m.role]}</span>
            </div>
            {ctx.membership.role === 'owner' && m.user_id !== ctx.current.id && (
              <details>
                <summary>إدارة الوصول</summary>
                <p>
                  إيقاف الوصول يمنع هذا الحساب من فتح بيانات العائلة. السجلات الخاصة لا تنتقل إلى
                  مدير العائلة.
                </p>
                <ActionForm action={removeMember} label="إيقاف وصول العضو">
                  <input type="hidden" name="memberId" value={m.user_id} />
                </ActionForm>
              </details>
            )}
          </article>
        ))}
      </div>
      {ctx.membership.role === 'owner' && (
        <section className="card warm">
          <h2>نكمّل الرحلة معًا</h2>
          <p>ادعُ شريكك أو شخصًا يدعمكم. الدعوة لا تمنحه الوصول لمعلوماتك الخاصة.</p>
          <ActionForm action={createInvite} label="إنشاء رابط الدعوة">
            <label>
              بريد الشخص المدعو
              <input name="email" type="email" required dir="ltr" maxLength={254} />
            </label>
            <label>
              دوره
              <select name="role" defaultValue="editor">
                <option value="editor">شريك · عرض وتعديل الأقسام المشتركة</option>
                <option value="viewer">داعم · عرض الأقسام المشتركة</option>
              </select>
            </label>
          </ActionForm>
        </section>
      )}
      <Link href="/private" className="card">
        <div className="row">
          <Icon name="lock" />
          <h2>مساحتي الخاصة</h2>
        </div>
        <p>المال والملاحظات الطبية ومشاركة كل سجل على حدة.</p>
      </Link>
      <form action={signOut}>
        <button className="button secondary full">تسجيل الخروج</button>
      </form>
      <small>
        الحساب الحالي: <bdi>{ctx.current.email}</bdi>
      </small>
    </Shell>
  );
}
