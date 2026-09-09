'use client';
import { useState } from 'react';
import { ActionForm } from './form';
import { productAction } from '@/app/product-actions';
export function NameForm({
  initial,
  week,
  editable,
}: {
  initial: string;
  week: number;
  editable: boolean;
}) {
  const [name, setName] = useState(initial);
  return (
    <ActionForm action={productAction} label="حفظ" disabled={!editable}>
      <input type="hidden" name="action" value="baby-name" />
      <label>
        الاسم · اختياري
        <input
          name="baby_name"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <section className="card warm">
        <small>الأسبوع {week}</small>
        <h2>{name.trim() || 'صغيركم'}</h2>
      </section>
      {initial && (
        <button className="button secondary" type="button" onClick={() => setName('')}>
          نبقيه «صغيركم» حالياً
        </button>
      )}
      <small>اتركوه فارغاً لنبقيه «صغيركم» حالياً.</small>
    </ActionForm>
  );
}
