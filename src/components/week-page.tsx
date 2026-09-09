import Link from 'next/link';
import Image from 'next/image';
import { Shell, PageTitle } from '@/components/ui';
import { DangerSigns } from '@/components/sheet';
import { weeklyMedia, medicalNotice } from '@/lib/pregnancy-display';
export function WeekPage({
  week,
  current,
  demo = false,
}: {
  week: number;
  current: number;
  demo?: boolean;
}) {
  const media = weeklyMedia(week, demo),
    base = demo ? '/demo/week' : '/today/week',
    home = demo ? '/demo' : '/today';
  return (
    <Shell active="today" demo={demo}>
      <Link className="text-link" href={home}>
        رجوع إلى اليوم
      </Link>
      <PageTitle
        title={`الأسبوع ${week}`}
        description={week === current ? 'أسبوعكم الحالي' : undefined}
      />
      <div className="week-media-frame">
        {media.poster ? (
          <Image
            src={media.poster}
            alt={`تصور تطويري للأسبوع ${week}، غير مراجع طبياً`}
            fill
            sizes="(max-width:700px) 100vw, 900px"
            priority
          />
        ) : (
          <p>
            {week < 5
              ? 'بداية الرحلة — خامة محايدة دون صورة أو قياس.'
              : 'الفيديو الأسبوعي قيد الإعداد ويحتاج مراجعة طبية قبل النشر.'}
          </p>
        )}
        {media.poster && !media.medicallyReviewed && (
          <span className="media-review-badge">غير مُراجَع طبياً — للتطوير فقط</span>
        )}
      </div>
      <nav className="week-browse" aria-label="تصفح أسابيع الحمل">
        {week > 0 ? (
          <Link href={`${base}?week=${week - 1}`}>الأسبوع السابق</Link>
        ) : (
          <span aria-disabled="true">الأسبوع السابق</span>
        )}
        {week !== current && <Link href={base}>أسبوعكم الحالي</Link>}
        {week < 40 ? (
          <Link href={`${base}?week=${week + 1}`}>الأسبوع التالي</Link>
        ) : (
          <span aria-disabled="true">الأسبوع التالي</span>
        )}
      </nav>
      <section className="card">
        <h2>ما الذي يتطور الآن</h2>
        <p>{media.summary || 'تفاصيل هذا الأسبوع قيد المراجعة قبل إضافتها إلى التطبيق.'}</p>
        {media.points.length > 0 && (
          <ul>
            {media.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        {media.source && (
          <a className="text-link" href={media.source} target="_blank" rel="noreferrer">
            المصدر: دليل الحمل الأسبوعي — NHS
          </a>
        )}
        <small>{medicalNotice}</small>
      </section>
      {week < 5 ? (
        <p className="notice">
          نحسب أسابيع الحمل من موعد الوصول المتوقع. في الأسابيع 0 إلى 4 لا نعرض صورة للجنين أو
          قياسات حجم.
        </p>
      ) : (
        <div className="bento">
          <section className="card">
            <h2>الطول</h2>
            <p>{media.length || '—'}</p>
            <small>{week < 20 ? 'من الرأس إلى المقعد' : 'من الرأس إلى الكعب'}</small>
          </section>
          <section className="card">
            <h2>الوزن</h2>
            <p>{media.weight || '—'}</p>
            <small>قيمة تقريبية عند توفرها</small>
          </section>
        </div>
      )}
      <DangerSigns />
      {week === current && (
        <div className="bento">
          <Link className="card medical" href={demo ? '/demo?tab=journey' : '/journey'}>
            المواعيد والخطوات القادمة
          </Link>
          <Link className="card ready" href={demo ? '/demo?tab=preparation' : '/preparation'}>
            جاهزية التجهيز
          </Link>
        </div>
      )}
      <small>{medicalNotice}</small>
    </Shell>
  );
}
