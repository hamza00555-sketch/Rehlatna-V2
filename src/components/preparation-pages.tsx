import Link from 'next/link';
import { Sheet } from './sheet';
import { notFound } from 'next/navigation';
import { productContext, records } from '@/lib/product-server';
import { categories, statuses, type Item } from '@/lib/product';
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
import { Icon, Empty } from './ui';
function ItemForm({ item, category = 'other' }: { item?: Item; category?: string }) {
  return (
    <section className="card">
      <ActionForm action={productAction} label="حفظ">
        <input type="hidden" name="action" value="item" />
        {item && <input type="hidden" name="id" value={item.id} />}
        <Field name="title" label="اسم العنصر" value={item?.title} required maxLength={120} />
        <Select
          name="category"
          label="الفئة"
          options={categories}
          value={item?.category ?? category}
        />
        <Select name="status" label="الحالة" options={statuses} value={item?.status ?? 'later'} />
        <Select
          name="item_type"
          label="نوع العنصر"
          options={{ large: 'غرض كبير · بطاقة مصوّرة', small: 'صغير أو استهلاكي · صف مختصر' }}
          value={item?.item_type ?? 'small'}
        />
        <Toggle
          name="hospital_bag"
          label="ضمن حقيبة المستشفى"
          checked={item?.hospital_bag ?? category === 'hospital'}
        />
        <Notes value={item?.notes} />
      </ActionForm>
    </section>
  );
}
function ItemList({ items }: { items: Item[] }) {
  const sorted = [...items].sort(
    (a, b) =>
      Object.keys(statuses).indexOf(a.status) - Object.keys(statuses).indexOf(b.status) ||
      a.title.localeCompare(b.title, 'ar'),
  );
  return (
    <>
      {sorted.some((i) => i.item_type === 'large') && (
        <>
          <h2>الأغراض الكبيرة</h2>
          <div className="product-grid">
            {sorted
              .filter((i) => i.item_type === 'large')
              .map((i) => (
                <Link className="product-tile" key={i.id} href={'/preparation/item/' + i.id}>
                  <div className="product-art">
                    <Icon name={i.category === 'clothes' ? 'clothes' : 'preparation'} />
                    <small>صورة الغرض قيد الإعداد</small>
                  </div>
                  <h3>{i.title}</h3>
                  <Badge tone={i.status}>{statuses[i.status]}</Badge>
                </Link>
              ))}
          </div>
        </>
      )}
      {sorted.some((i) => i.item_type !== 'large') && (
        <section className="section-space">
          <h2>قائمة المهام</h2>
          {sorted
            .filter((i) => i.item_type !== 'large')
            .map((i) => (
              <RowLink
                key={i.id}
                href={'/preparation/item/' + i.id}
                title={i.title}
                sub={categories[i.category]}
                badge={statuses[i.status]}
                icon="preparation"
              />
            ))}
        </section>
      )}
    </>
  );
}
export async function PreparationPages({
  path = [],
  filter = '',
  categoryQuery = '',
}: {
  path?: string[];
  filter?: string;
  categoryQuery?: string;
}) {
  const ctx = await productContext();
  if (!ctx.can('preparation.view')) return <PrivatePage />;
  const items = (await records('preparation_items', 'preparation.view')) as Item[],
    edit = ctx.can('preparation.edit');
  const [section, key, mode] = path;
  if (section === 'item') {
    if (key === 'new') {
      if (!edit) return <PrivatePage />;
      return (
        <ProductPage title="إضافة عنصر" active="preparation" back="/preparation">
          <ItemForm category={categoryQuery in categories ? categoryQuery : 'other'} />
        </ProductPage>
      );
    }
    const item = items.find((i) => i.id === key);
    if (!item) notFound();
    if (mode === 'edit') {
      if (!edit) return <PrivatePage />;
      return (
        <ProductPage title="تعديل العنصر" active="preparation" back={'/preparation/item/' + key}>
          <ItemForm item={item} />
          <DeleteForm action="item-delete" id={item.id} title="حذف العنصر" />
        </ProductPage>
      );
    }
    if (mode) notFound();
    let goalId: string | undefined;
    if (ctx.can('finance.view')) {
      const r = await ctx.client
        .from('finance_goals')
        .select('id')
        .eq('household_id', ctx.householdId)
        .eq('item_id', item.id)
        .limit(1);
      if (r.error) throw Error('تعذر تحميل الهدف');
      goalId = r.data?.[0]?.id;
    }
    const fin = ctx.can('finance.edit')
      ? await ctx.client
          .from('finance_settings')
          .select('enabled')
          .eq('household_id', ctx.householdId)
          .maybeSingle()
      : null;
    return (
      <ProductPage
        title={item.title}
        description={categories[item.category]}
        active="preparation"
        back={'/preparation/' + item.category}
      >
        <div className="product-art">
          <Icon name="preparation" />
          <small>صورة الغرض قيد الإعداد</small>
        </div>
        <div className="filter-chips">
          {item.hospital_bag && <Badge>ضمن حقيبة المستشفى</Badge>}
          {goalId && <Badge>مرتبط بهدف تمويل</Badge>}
        </div>
        <section className="card">
          <h2>الحالة</h2>
          <ActionForm action={productAction} label="تحديث الحالة" disabled={!edit}>
            <input type="hidden" name="action" value="item-status" />
            <input type="hidden" name="id" value={item.id} />
            <Select name="status" label="حالة العنصر" options={statuses} value={item.status} />
          </ActionForm>
        </section>
        {item.notes && (
          <section className="card">
            <h2>ملاحظات</h2>
            <p>{item.notes}</p>
          </section>
        )}
        {edit && (
          <Link className="button secondary" href={`/preparation/item/${key}/edit`}>
            تعديل
          </Link>
        )}
        {goalId ? (
          <RowLink href={'/finance/goals/' + goalId} title="عرض هدف التمويل" icon="lock" />
        ) : fin?.data?.enabled && item.status === 'needed' ? (
          <section className="card">
            <h2>هل تضيفه للخطة المالية؟</h2>
            <p>
              ستبقى حالة التجهيز مشتركة مع العائلة، ولن تظهر الأسعار إلا لمن لديه صلاحية المالية.
            </p>
            <Link className="button" href={'/finance/goals/new?item=' + item.id}>
              نعم، أضفه
            </Link>
          </section>
        ) : null}
      </ProductPage>
    );
  }
  if (section && section !== 'hospital-bag' && !(section in categories)) notFound();
  if (path.length > 1) notFound();
  const bag = section === 'hospital-bag',
    base = items.filter((i) => !section || (bag ? i.hospital_bag : i.category === section)),
    counted = base.filter((i) => i.status !== 'not_required'),
    ready = counted.filter((i) => i.status === 'ready').length;
  const visible = base.filter((i) => !filter || i.status === filter);
  const title = bag
    ? 'حقيبة المستشفى'
    : section
      ? categories[section as keyof typeof categories]
      : 'التجهيز';
  return (
    <ProductPage
      title={title}
      description={
        bag ? 'ما تحملونه معكم يوم الوصول — للأم، وللصغير، وللمرافق.' : 'كل شيء بهدوء، خطوة خطوة'
      }
      active="preparation"
      back={section ? '/preparation' : '/today'}
    >
      {edit && (
        <Link
          className="button"
          href={'/preparation/item/new' + (section && !bag ? '?category=' + section : '')}
        >
          + إضافة عنصر
        </Link>
      )}
      <Progress
        value={counted.length ? (ready / counted.length) * 100 : 0}
        label={`${ready} من ${counted.length} جاهز · نحتاجه: ${base.filter((i) => i.status === 'needed').length}`}
      />
      {!bag && (
        <div className="filter-chips">
          {Object.entries({ '': 'الكل', ready: 'متوفر', needed: 'نحتاجه', later: 'لاحقاً' }).map(
            ([k, v]) => (
              <Link
                key={k}
                href={'/preparation' + (section ? '/' + section : '') + (k ? '?status=' + k : '')}
                aria-current={filter === k ? 'page' : undefined}
              >
                {v}
              </Link>
            ),
          )}
        </div>
      )}
      {!base.length ? (
        <Empty title={bag ? 'لا عناصر في الحقيبة بعد' : 'لنبدأ التجهيز'}>
          {bag
            ? 'علّموا أي عنصر بـ «ضمن حقيبة المستشفى» ليظهر هنا.'
            : 'أضيفوا أول عنصر، أو ابدؤوا بالفئات المقترحة.'}
          {edit && !items.length && (
            <ActionForm action={productAction} label="ابدؤوا بالمقترحات">
              <input type="hidden" name="action" value="seed" />
            </ActionForm>
          )}
        </Empty>
      ) : bag ? (
        <>
          {[
            ['للأم', ['mother']],
            ['للصغير', ['clothes', 'care', 'feeding', 'sleep']],
            ['للمرافق', ['hospital', 'travel', 'transport', 'other']],
          ].map(([label, cats]) => (
            <section key={String(label)} className="section-space">
              <h2>{label}</h2>
              <ItemList items={base.filter((i) => cats.includes(i.category))} />
            </section>
          ))}
        </>
      ) : (
        <>
          <ItemList items={visible} />
          {!visible.length && (
            <Empty title="لا عناصر في هذه الفئة بعد">غيّروا المرشّح لعرض بقية القائمة.</Empty>
          )}
        </>
      )}
      {!section && (
        <section className="section-space">
          <h2>حسب الفئة</h2>
          {Object.entries(categories)
            .filter(([k]) => items.some((i) => i.category === k))
            .map(([k, v]) => (
              <RowLink
                href={'/preparation/' + k}
                key={k}
                title={v}
                sub={`${items.filter((i) => i.category === k && i.status === 'ready').length} من ${items.filter((i) => i.category === k && i.status !== 'not_required').length} جاهز`}
              />
            ))}
          <RowLink href="/preparation/hospital-bag" title="حقيبة المستشفى" icon="preparation" />
        </section>
      )}
    </ProductPage>
  );
}
export function DeleteForm({ action, id, title }: { action: string; id: string; title: string }) {
  return (
    <Sheet title={title} trigger={title}>
      <p>هل أنتم متأكدون؟ لا يمكن التراجع عن الحذف.</p>
      <ActionForm action={productAction} label="تأكيد الحذف">
        <input type="hidden" name="action" value={action} />
        <input type="hidden" name="id" value={id} />
        <Toggle name="confirm" label="نعم، نؤكد الحذف" />
      </ActionForm>
    </Sheet>
  );
}
