import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageTitle, Shell, Icon } from './ui';
export function ProductPage({
  title,
  description,
  back = '/more',
  active = 'more',
  children,
  focused = false,
}: {
  title: string;
  description?: string;
  back?: string;
  active?: string;
  children: ReactNode;
  focused?: boolean;
}) {
  const content = (
    <>
      <Link href={back} className="back-link" aria-label="رجوع">
        ↪ رجوع
      </Link>
      <PageTitle title={title} description={description} />
      {children}
    </>
  );
  return focused ? (
    <main className="focused-page">{content}</main>
  ) : (
    <Shell active={active}>{content}</Shell>
  );
}
export function PrivatePage() {
  return (
    <ProductPage title="هذه الصفحة خاصة">
      <div className="card empty">
        <Icon name="lock" />
        <p>هذه الصفحة تظهر لمن مُنح صلاحيتها فقط. لا يتم تحميل أي بيانات هنا.</p>
      </div>
    </ProductPage>
  );
}
export function Field({
  name,
  label,
  type = 'text',
  value = '',
  required = false,
  maxLength,
  min,
  max,
}: {
  name: string;
  label: string;
  type?: string;
  value?: string | number;
  required?: boolean;
  maxLength?: number;
  min?: string | number;
  max?: string | number;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        maxLength={maxLength}
        min={min}
        max={max}
        dir={['date', 'time', 'number', 'email', 'url'].includes(type) ? 'ltr' : undefined}
      />
    </label>
  );
}
export function Select({
  name,
  label,
  options,
  value = '',
  empty = false,
}: {
  name: string;
  label: string;
  options: Record<string, string>;
  value?: string;
  empty?: boolean;
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={value}>
        {empty && <option value="">لم يُحدَّد بعد</option>}
        {Object.entries(options).map(([k, v]) => (
          <option value={k} key={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Notes({
  name = 'notes',
  label = 'ملاحظات · اختياري',
  value = '',
}: {
  name?: string;
  label?: string;
  value?: string;
}) {
  return (
    <label>
      {label}
      <textarea name={name} defaultValue={value} maxLength={5000} rows={4} />
    </label>
  );
}
export function Toggle({
  name,
  label,
  checked = false,
  disabled = false,
}: {
  name: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input name={name} type="checkbox" defaultChecked={checked} disabled={disabled} />
    </label>
  );
}
export function RowLink({
  href,
  title,
  sub,
  icon = 'arrow',
  badge,
}: {
  href: string;
  title: string;
  sub?: string;
  icon?: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="detail-row">
      <span className="icon-tile">
        <Icon name={icon} />
      </span>
      <span>
        <strong>{title}</strong>
        {sub && <small>{sub}</small>}
      </span>
      {badge && <span className="badge">{badge}</span>}
      <span aria-hidden="true">‹</span>
    </Link>
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div className="progress-block">
      <span>{label}</span>
      <progress value={value} max={100} aria-label={label} />
    </div>
  );
}
export function Badge({ children, tone = 'future' }: { children: ReactNode; tone?: string }) {
  return <span className={'badge status-' + tone}>{children}</span>;
}
