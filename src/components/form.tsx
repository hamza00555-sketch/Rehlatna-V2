'use client';
import { useActionState } from 'react';
import type { ReactNode } from 'react';
import type { FormState } from '@/app/actions';
type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  children: ReactNode;
  label: string;
  disabled?: boolean;
};
export function ActionForm({ action, children, label, disabled }: Props) {
  const [state, submit, pending] = useActionState(async (prev: FormState, form: FormData) => {
    if (form.has('startsAt')) {
      const raw = String(form.get('startsAt'));
      const date = new Date(raw);
      if (!Number.isFinite(date.valueOf())) return { error: 'اختر موعدًا صحيحًا.' };
      form.set('startsAt', date.toISOString());
    }
    return action(prev, form);
  }, {});
  return (
    <form action={submit} className="form">
      <fieldset disabled={pending || disabled}>
        {children}
        <button className="button" type="submit">
          {pending ? 'لحظة…' : label}
        </button>
      </fieldset>
      {state.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="notice success" role="status">
          {state.success}
        </p>
      )}
      {state.inviteUrl && (
        <label>
          رابط الدعوة
          <input
            value={state.inviteUrl}
            readOnly
            dir="ltr"
            onFocus={(e) => e.currentTarget.select()}
          />
          <small>انسخ الرابط وشاركه مع الشخص المدعو فقط.</small>
        </label>
      )}
    </form>
  );
}
