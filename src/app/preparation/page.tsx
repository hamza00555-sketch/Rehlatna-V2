export const dynamic = 'force-dynamic';
import { Shell, PageTitle, Empty } from '@/components/ui';
import { ActionForm } from '@/components/form';
import { addItem, setItemStatus } from '@/app/actions';
import { context } from '@/lib/supabase';
export default async function Preparation() {
  const ctx = await context();
  const { data, error } = await ctx.client
    .from('preparation_items')
    .select('id,title,status')
    .eq('household_id', ctx.householdId)
    .order('created_at');
  if (error) throw new Error('تعذر تحميل التجهيز');
  return (
    <Shell active="preparation">
      <PageTitle title="التجهيز على مهل" description="نستفيد من الموجود، ونرتّب ما نحتاجه فعلًا." />
      {!data.length ? (
        <Empty title="قائمة خفيفة، وبداية جديدة">
          ابدأ بالأغراض الموجودة عندكم، ثم أضف الأشياء الناقصة.
        </Empty>
      ) : (
        <div className="list">
          {data.map((x) => (
            <article className={'list-row ' + (x.status === 'ready' ? 'ready' : '')} key={x.id}>
              <h3>{x.title}</h3>
              <form action={setItemStatus}>
                <input type="hidden" name="id" value={x.id} />
                <label>
                  الحالة
                  <select
                    name="status"
                    defaultValue={x.status}
                    disabled={ctx.membership.role === 'viewer'}
                  >
                    <option value="needed">نحتاجه</option>
                    <option value="ready">جاهز</option>
                    <option value="later">لاحقًا</option>
                  </select>
                </label>
                <button className="button secondary" disabled={ctx.membership.role === 'viewer'}>
                  تحديث
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
      <section className="card">
        <h2>شيء نجهّزه للصغير</h2>
        <ActionForm
          action={addItem}
          label="إضافة للقائمة"
          disabled={ctx.membership.role === 'viewer'}
        >
          <label>
            اسم الغرض
            <input name="title" required maxLength={80} placeholder="مقعد السيارة" />
          </label>
        </ActionForm>
      </section>
    </Shell>
  );
}
