import Link from 'next/link';
import { notFound } from 'next/navigation';
import { productContext, records } from '@/lib/product-server';
import {
  type Goal,
  goalNumbers,
  money,
  stages,
  priorities,
  dateLabel,
  isoToday,
  shiftDate,
  statuses,
} from '@/lib/product';
import { ProductPage, PrivatePage, Field, Progress, RowLink, Badge, Notes } from './product-ui';
import { ActionForm } from './form';
import { productAction } from '@/app/product-actions';
import { DeleteForm } from './preparation-pages';
import { GoalForm } from './goal-form';
import { Empty } from './ui';
import { Sheet } from './sheet';
export async function FinancePages({ path = [], itemId }: { path?: string[]; itemId?: string }) {
  const ctx = await productContext();
  if (!ctx.can('finance.view')) return <PrivatePage />;
  const settings = await ctx.client
    .from('finance_settings')
    .select('enabled,shared')
    .eq('household_id', ctx.householdId)
    .maybeSingle();
  if (settings.error) throw Error('تعذر تحميل الخطة');
  if (!settings.data?.enabled)
    return (
      <ProductPage title="الخطة المالية غير مفعّلة">
        <p>يمكن تفعيلها من الإعدادات لمن يدير الخطة.</p>
        <Link href="/more/settings">الإعدادات</Link>
      </ProductPage>
    );
  const goals = (await records('finance_goals', 'finance.view')) as Goal[],
    contributions = await records('finance_contributions', 'finance.view'),
    currency = ctx.household?.currency ?? 'SAR',
    edit = ctx.can('finance.edit'),
    sum = (id: string) =>
      contributions.filter((c) => c.goal_id === id).reduce((s, c) => s + Number(c.amount_cents), 0);
  const [section, id, mode] = path;
  if (section === 'goals') {
    const goal = goals.find((g) => g.id === id);
    if (id === 'new' || mode === 'edit') {
      if (!edit) return <PrivatePage />;
      if (id !== 'new' && !goal) notFound();
      let item = null;
      if (itemId) {
        const r = await ctx.client
          .from('preparation_items')
          .select('id,title')
          .eq('household_id', ctx.householdId)
          .eq('id', itemId)
          .maybeSingle();
        if (r.error || !r.data) notFound();
        item = r.data;
      }
      return (
        <ProductPage
          title={goal ? 'تعديل الهدف' : 'إضافة هدف'}
          description="الخطة المالية · خاصة"
          back={goal ? '/finance/goals/' + goal.id : '/finance'}
        >
          <section className="card">
            <GoalForm
              goal={goal}
              itemId={item?.id}
              title={item?.title}
              fundingDate={ctx.pregnancy ? shiftDate(ctx.pregnancy.due_date, -30) : isoToday()}
              contributions={goal ? sum(goal.id) : 0}
              currency={currency}
            />
          </section>
        </ProductPage>
      );
    }
    if (!goal || mode) notFound();
    const n = goalNumbers(goal, sum(goal.id)),
      changes = (await records('finance_changes', 'finance.view'))
        .filter((c) => c.goal_id === goal.id)
        .sort((a, b) => b.changed_at.localeCompare(a.changed_at))
        .slice(0, 3);
    let item = null;
    if (goal.item_id) {
      const r = await ctx.client
        .from('preparation_items')
        .select('title,status')
        .eq('household_id', ctx.householdId)
        .eq('id', goal.item_id)
        .maybeSingle();
      item = r.data;
    }
    return (
      <ProductPage
        title={goal.title}
        description={stages[goal.stage] + ' · ' + priorities[goal.priority]}
        back="/finance"
      >
        {edit && (
          <Link className="button secondary" href={'/finance/goals/' + goal.id + '/edit'}>
            تعديل
          </Link>
        )}
        <section className="finance-hero">
          <small>الهدف</small>
          <h2 className="fact-number">{money(n.target, currency)}</h2>
          <div className="form-grid">
            <div>
              تم تجهيز<h3>{money(n.saved, currency)}</h3>
            </div>
            <div>
              المتبقي<h3>{money(n.remaining, currency)}</h3>
            </div>
          </div>
          <Progress value={n.percent} label={`${n.percent}%`} />
          <Badge tone={n.remaining ? 'future' : 'ready'}>{n.status}</Badge>
        </section>
        <div className="product-grid section-space">
          <section className="card">
            <h3>تاريخ التمويل</h3>
            <p>{dateLabel(goal.funding_date)}</p>
            <small>على {n.months} أشهر</small>
          </section>
          <section className="card">
            <h3>تاريخ الصرف المتوقع</h3>
            <p>{dateLabel(goal.spending_date)}</p>
            <small>وصفي فقط — لا يدخل في الحسابات.</small>
          </section>
        </div>
        <section className="card warm">
          <h2>المطلوب شهرياً</h2>
          <h3>{n.remaining ? money(n.monthly, currency) : 'اكتمل التمويل'}</h3>
          <p>يُحسب المبلغ الشهري من المتبقي وعدد الأشهر حتى تاريخ التمويل — لا تاريخ الصرف.</p>
        </section>
        {item && (
          <RowLink
            href={'/preparation/item/' + goal.item_id}
            title={'مرتبط بعنصر تجهيز: ' + item.title}
            sub={statuses[item.status as keyof typeof statuses]}
          />
        )}
        <section className="section-space">
          <h2>المساهمات</h2>
          {contributions
            .filter((c) => c.goal_id === goal.id)
            .sort((a, b) => b.contributed_on.localeCompare(a.contributed_on))
            .map((c) => (
              <article className="detail-row" key={c.id}>
                <span>
                  {dateLabel(c.contributed_on)}
                  <small>{c.note}</small>
                </span>
                <strong>+{money(Number(c.amount_cents), currency)}</strong>
              </article>
            ))}
          {!contributions.some((c) => c.goal_id === goal.id) && <p>لا مساهمات مسجّلة بعد.</p>}
        </section>
        {changes.length > 0 && (
          <section className="card">
            <h2>توضيح إعادة الحساب</h2>
            {changes.map((c) => (
              <article key={c.id}>
                <small>{dateLabel(c.changed_at)}</small>
                {c.after_value._reason && <p>{c.after_value._reason}</p>}
                {c.before_value._monthly !== undefined && (
                  <p>
                    المطلوب شهرياً سابقاً: {money(Number(c.before_value._monthly), currency)} ←
                    المطلوب شهرياً الآن: {money(Number(c.after_value._monthly), currency)}
                  </p>
                )}
                <p>
                  التكلفة المستهدفة:{' '}
                  {money(
                    Number(c.before_value.actual_cents ?? c.before_value.expected_cents),
                    currency,
                  )}{' '}
                  ←{' '}
                  {money(
                    Number(c.after_value.actual_cents ?? c.after_value.expected_cents),
                    currency,
                  )}
                </p>
                <p>
                  تاريخ التمويل: {dateLabel(c.before_value.funding_date)} ←{' '}
                  {dateLabel(c.after_value.funding_date)}
                </p>
              </article>
            ))}
          </section>
        )}
        {goal.notes && <p className="card">{goal.notes}</p>}
        {edit && (
          <>
            {n.remaining > 0 ? (
              <Sheet title="إضافة مساهمة" trigger="إضافة مبلغ">
                <p>
                  المطلوب شهرياً سابقاً: {money(n.monthly, currency)} · المتبقي:{' '}
                  {money(n.remaining, currency)}
                </p>
                <ActionForm action={productAction} label="تأكيد">
                  <input type="hidden" name="action" value="contribution" />
                  <input type="hidden" name="id" value={goal.id} />
                  <label>
                    المبلغ
                    <input name="amount" type="number" step="0.01" min="0.01" required dir="ltr" />
                  </label>
                  <Field
                    name="contributed_on"
                    label="التاريخ"
                    type="date"
                    value={isoToday()}
                    max={isoToday()}
                    required
                  />
                  <Notes name="note" label="ملاحظة · اختياري" />
                </ActionForm>
              </Sheet>
            ) : (
              <button className="button" disabled>
                اكتمل التمويل
              </button>
            )}
            <DeleteForm action="goal-delete" id={goal.id} title="حذف الهدف" />
          </>
        )}
      </ProductPage>
    );
  }
  if (path.length) notFound();
  const nums = goals.map((g) => ({ ...goalNumbers(g, sum(g.id)), goal: g })),
    total = nums.reduce((s, n) => s + n.target, 0),
    saved = nums.reduce((s, n) => s + Math.min(n.saved, n.target), 0),
    monthly = nums.reduce((s, n) => s + n.monthly, 0);
  return (
    <ProductPage title="الخطة المالية" description="خاصة · نحو وصول هادئ ومرتّب">
      {edit && (
        <Link className="button" href="/finance/goals/new">
          + إضافة هدف
        </Link>
      )}
      {!goals.length ? (
        <Empty title="لا أهداف بعد">أضيفوا أول هدف تمويل، أو ابدؤوا من عنصر تحتاجون شراءه.</Empty>
      ) : (
        <>
          <section className="finance-hero">
            <small>المطلوب إجمالاً</small>
            <h2 className="fact-number">{money(total, currency)}</h2>
            <Progress
              value={total ? (saved / total) * 100 : 100}
              label={`تم تجهيز ${money(saved, currency)} من ${money(total, currency)}`}
            />
          </section>
          <section className="card warm">
            <h2>هدف هذا الشهر</h2>
            <h3>{money(monthly, currency)}</h3>
            <small>مطلوب قبل نهاية الشهر</small>
          </section>
          <section className="card">
            <h2>لماذا هذا المبلغ؟</h2>
            {nums
              .filter((n) => n.monthly > 0)
              .map((n) => (
                <RowLink
                  key={n.goal.id}
                  href={'/finance/goals/' + n.goal.id}
                  title={n.goal.title}
                  sub={stages[n.goal.stage]}
                  badge={money(n.monthly, currency)}
                  icon="lock"
                />
              ))}
          </section>
          <h2>التوزيع حسب المرحلة</h2>
          <div className="month-cards">
            {Object.entries(stages).map(([k, v]) => {
              const ns = nums.filter((n) => n.goal.stage === k),
                t = ns.reduce((s, n) => s + n.target, 0),
                a = ns.reduce((s, n) => s + Math.min(n.saved, n.target), 0);
              return (
                <section className="card" key={k}>
                  <h3>{v}</h3>
                  <Progress
                    value={t ? (a / t) * 100 : 0}
                    label={`${t ? Math.round((a / t) * 100) : 0}%`}
                  />
                </section>
              );
            })}
          </div>
          <section className="section-space">
            <h2>الأهداف</h2>
            {nums.map((n) => (
              <RowLink
                key={n.goal.id}
                href={'/finance/goals/' + n.goal.id}
                title={n.goal.title}
                sub={`${money(n.saved, currency)} من ${money(n.target, currency)} · ${stages[n.goal.stage]}`}
                badge={n.status}
                icon="lock"
              />
            ))}
          </section>
        </>
      )}
      <p className="notice">
        الأسعار والمدّخرات لا تُرسل لبقية الأعضاء بلا صلاحية مالية. الأهداف الخاصة تخضع لاختيار
        مالكها وإعداد المشاركة.
      </p>
    </ProductPage>
  );
}
