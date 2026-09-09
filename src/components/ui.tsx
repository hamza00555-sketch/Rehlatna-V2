import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="رحلتنا — البداية">
      <svg viewBox="0 0 36 36" width="36" height="36" fill="none" aria-hidden="true">
        <path d="M9 28V15c0-6 4-10 9-10s9 4 9 10v13" stroke="currentColor" strokeWidth="1.5" />
        <path d="M15 28V17a3 3 0 0 1 6 0v11M6 28h24" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18" cy="9" r="1.5" fill="currentColor" />
      </svg>
      <span>رحلتنا</span>
    </Link>
  );
}
export function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    arrow: <path d="m14 6-6 6 6 6M8 12h13" />,
    heart: <path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-5 5 3 12 8 15 5-3 13-10 8-15Z" />,
    leaf: (
      <>
        <path d="M5 19C0 7 12 4 20 4c0 9-3 17-12 14M5 21 16 9" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="4" />
        <path d="M7 3v5M17 3v5M3 11h18M8 15h2M14 15h2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    moon: <path d="M20 14a9 9 0 0 1-10-11 9 9 0 1 0 10 11Z" />,
    clothes: <path d="m8 3-5 3 3 5 2-1v11h8V10l2 1 3-5-5-3a4 4 0 0 1-8 0Z" />,
    today: (
      <>
        <path d="M4 11 12 4l8 7v9H4Z" />
        <path d="M9 20v-7h6v7" />
      </>
    ),
    journey: (
      <>
        <path d="M6 4v16M18 4v16M6 8h12M6 16h12" />
        <circle cx="6" cy="8" r="2" />
        <circle cx="18" cy="16" r="2" />
      </>
    ),
    preparation: (
      <>
        <path d="M5 8h14v12H5ZM9 8V6a3 3 0 0 1 6 0v2" />
        <path d="m9 14 2 2 4-4" />
      </>
    ),
    family: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="10" r="2" />
        <path d="M2 21v-3a6 6 0 0 1 12 0v3M14 15a5 5 0 0 1 8 4v2" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
  };
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.today}
    </svg>
  );
}
export function Shell({
  children,
  active,
  demo = false,
}: {
  children: ReactNode;
  active: string;
  demo?: boolean;
}) {
  return (
    <>
      <div className="app-frame">
        <header className="top app-top">
          <Brand />
          <span className="brand-caption">كل يوم أقرب إلى اللقاء</span>
          <Link className="text-link" href={demo ? '/auth' : '/family'}>
            {demo ? 'ابدأ رحلتك' : 'عائلتنا'}
          </Link>
        </header>
        {demo && (
          <aside className="demo-banner">معاينة ببيانات افتراضية — لا تُحفظ تغييرات هنا</aside>
        )}
        <main className={'app-main page-' + active}>{children}</main>
        <nav className="bottom-nav" aria-label="التنقل الرئيسي">
          {[
            ['today', 'اليوم'],
            ['journey', 'الرحلة'],
            ['preparation', 'التجهيز'],
            ['family', 'العائلة'],
          ].map(([id, label]) => (
            <Link
              key={id}
              aria-current={active === id ? 'page' : undefined}
              href={demo ? '/demo?tab=' + id : '/' + id}
            >
              <Icon name={id} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <Icon name="heart" />
          <p>
            تفاصيل صغيرة،
            <br />
            وحب يكبر كل يوم.
          </p>
          <span>رحلتنا · معًا من البداية</span>
        </div>
      </div>
    </>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="page-title">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  );
}
export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card empty">
      <span className="icon-tile empty-mark">
        <Icon name="journey" />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}

export function NurseryImage({ priority = false }: { priority?: boolean }) {
  return (
    <Image
      src="/images/nursery.webp"
      alt=""
      fill
      sizes="(max-width: 700px) 100vw, 600px"
      priority={priority}
      className="nursery-image"
    />
  );
}

export function PregnancyHero({
  weeks,
  days = 0,
  babyName,
  dueDate,
  demo = false,
}: {
  weeks: number;
  days?: number;
  babyName?: string | null;
  dueDate?: string;
  demo?: boolean;
}) {
  const percent = Math.max(0, Math.min(100, (weeks / 40) * 100));
  return (
    <section className="pregnancy-hero">
      <div className="pregnancy-copy">
        <span className="badge pregnancy-badge">
          <Icon name="heart" />
          {demo ? 'رحلة توضيحية' : 'رحلة ' + (babyName || 'صغيركم')}
        </span>
        <h2>
          حبّ يكبر،
          <br />
          ولقاء يقترب.
        </h2>
        <div className="week-stat">
          <span className="week-number numeric">{weeks}</span>
          <div>
            <strong>أسبوعًا مكتملًا</strong>
            <p>{days > 0 ? `و${days} أيام` : 'من رحلة الحمل'}</p>
          </div>
        </div>
        <div className="hero-progress">
          <div
            className="progress"
            role="progressbar"
            aria-label="المدة التقريبية للحمل"
            aria-valuemin={0}
            aria-valuemax={40}
            aria-valuenow={Math.max(0, Math.min(40, weeks))}
          >
            <span style={{ width: percent + '%' }} />
          </div>
          <small>
            {demo ? (
              'كل خطوة صغيرة تستحق أن نحتفي بها.'
            ) : (
              <>
                الموعد المتوقع: <bdi>{dueDate}</bdi>
                <br />
                حساب تقريبي من موعد الولادة، وقد يعدّله الطبيب.
              </>
            )}
          </small>
        </div>
      </div>
      <div className="pregnancy-scene">
        <NurseryImage priority />
        <span className="scene-caption">نُهيّئ مكانًا لصغيركم</span>
      </div>
    </section>
  );
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {subtitle && <span>{subtitle}</span>}
    </div>
  );
}

export function PreparationSummary({ ready, total }: { ready: number; total: number }) {
  const percent = total ? Math.round((ready / total) * 100) : 0;
  return (
    <section className="preparation-summary">
      <div>
        <span className="eyebrow">نجهّز بحب، وعلى مهل</span>
        <h2>{total ? 'كل شيء يأخذ مكانه' : 'مكان صغير، لفرحة كبيرة'}</h2>
        <p>
          {total
            ? `${ready} من ${total} أغراض جاهزة للقاء`
            : 'نبدأ بالموجود عندكم، ونكمّل ما يحتاجه صغيركم.'}
        </p>
      </div>
      <div
        className="completion-ring"
        style={{
          background: `conic-gradient(var(--color-readiness) ${percent}%, var(--color-surface-raised) 0)`,
        }}
      >
        <span>
          <b className="numeric">{percent}%</b>
          <small>من التجهيز</small>
        </span>
      </div>
    </section>
  );
}
