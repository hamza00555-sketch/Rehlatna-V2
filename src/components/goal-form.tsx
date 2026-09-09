'use client';
import { useState } from 'react';
import { ActionForm } from './form';
import { productAction } from '@/app/product-actions';
import { Field, Select, Notes, Toggle } from './product-ui';
import { type Goal, goalNumbers, money, stages, priorities, isoToday } from '@/lib/product';
export function GoalForm({
  goal,
  itemId,
  title = '',
  fundingDate = isoToday(),
  contributions = 0,
  currency = 'SAR',
}: {
  goal?: Goal;
  itemId?: string;
  title?: string;
  fundingDate?: string;
  contributions?: number;
  currency?: string;
}) {
  const [expected, setExpected] = useState(String((goal?.expected_cents ?? 0) / 100)),
    [actual, setActual] = useState(
      goal?.actual_cents == null ? '' : String(goal.actual_cents / 100),
    ),
    [date, setDate] = useState(goal?.funding_date ?? fundingDate);
  const before = goal ? goalNumbers(goal, contributions) : null,
    after = goalNumbers(
      {
        expected_cents: Math.round(Number(expected) * 100) || 0,
        actual_cents: actual ? Math.round(Number(actual) * 100) : null,
        initial_cents: goal?.initial_cents ?? 0,
        funding_date: date || isoToday(),
      },
      contributions,
    );
  return (
    <ActionForm action={productAction} label={goal ? 'تطبيق التغيير' : 'إضافة هدف'}>
      <input type="hidden" name="action" value="goal" />
      {goal && <input type="hidden" name="id" value={goal.id} />}
      <input type="hidden" name="item_id" value={goal?.item_id ?? itemId ?? ''} />
      <Field name="title" label="اسم الهدف" required value={goal?.title ?? title} maxLength={160} />
      <label>
        التكلفة المتوقعة
        <input
          type="number"
          name="expected"
          min="0"
          step="0.01"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          required
          dir="ltr"
        />
      </label>
      {goal ? (
        <label>
          التكلفة الفعلية · اختياري
          <input
            type="number"
            name="actual"
            min="0"
            step="0.01"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            dir="ltr"
          />
        </label>
      ) : (
        <label>
          المدّخر حتى الآن
          <input
            type="number"
            name="initial"
            min="0"
            step="0.01"
            defaultValue="0"
            required
            dir="ltr"
          />
        </label>
      )}
      <label>
        تاريخ التمويل
        <input
          type="date"
          name="funding_date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>
      <small>التاريخ الذي تريدون اكتمال الادّخار فيه. الحسابات كلها تعتمد عليه.</small>
      <Field
        name="spending_date"
        label="تاريخ الصرف المتوقع · اختياري"
        type="date"
        value={goal?.spending_date ?? ''}
      />
      <small>وصفي فقط — متى يخرج المبلغ فعلياً. لا يدخل في الحسابات.</small>
      <Select
        name="priority"
        label="الأولوية"
        options={priorities}
        value={goal?.priority ?? 'important'}
      />
      <Select name="stage" label="المرحلة" options={stages} value={goal?.stage ?? 'before'} />
      <Select
        name="visibility"
        label="الظهور"
        options={{ private: 'خاص بي', shared: 'مشترك مع من لديهم صلاحية' }}
        value={goal?.visibility ?? 'private'}
      />
      <Notes value={goal?.notes} />
      {before && (
        <section className="notice">
          <h3>يؤثر هذا التعديل</h3>
          <p>
            {before.monthly === after.monthly
              ? 'لا يغيّر هذا التعديل المطلوب شهرياً.'
              : `المطلوب شهرياً سيتغيّر من ${money(before.monthly, currency)} إلى ${money(after.monthly, currency)}`}
          </p>
          <p>
            تاريخ التمويل المعتمد: <bdi>{date}</bdi>
          </p>
          <Toggle name="confirm" label="راجعت الأثر وأؤكد تطبيق التغيير" />
        </section>
      )}
    </ActionForm>
  );
}
