'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { pregnancyDisplay, weeklyMedia, medicalNotice } from '@/lib/pregnancy-display';

type Props = {
  weeks: number;
  days?: number;
  babyName?: string | null;
  memberName?: string;
  mother?: boolean;
  demo?: boolean;
  dateIso: string;
};
export function BabyHero({
  weeks,
  days = 0,
  babyName,
  memberName = 'عائلتنا',
  mother = false,
  demo = false,
  dateIso,
}: Props) {
  const p = pregnancyDisplay(weeks, days),
    media = weeklyMedia(weeks, demo);
  const [expanded, setExpanded] = useState(false),
    [motionBlocked, setMotionBlocked] = useState(true);
  const [videoReady, setVideoReady] = useState(false),
    [failed, setFailed] = useState(false),
    [paused, setPaused] = useState(false);
  const [imageFailed, setImageFailed] = useState(false),
    [shareStatus, setShareStatus] = useState('');
  const [clip, setClip] = useState('inset(0 round 28px)');
  const [greeting, setGreeting] = useState('أهلاً بعائلتكم');
  const hero = useRef<HTMLElement>(null),
    video = useRef<HTMLVideoElement>(null),
    close = useRef<HTMLButtonElement>(null),
    opener = useRef<HTMLButtonElement>(null);
  const videoPermitted = Boolean(media.video && !motionBlocked);
  const weekHref =
    (demo ? '/demo/week' : '/today/week') + '?week=' + Math.min(40, Math.max(0, weeks));
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (
      navigator as Navigator & {
        connection?: {
          saveData?: boolean;
          addEventListener?: (type: string, fn: () => void) => void;
          removeEventListener?: (type: string, fn: () => void) => void;
        };
      }
    ).connection;
    const update = () => {
      let manual = false;
      try {
        manual = localStorage.getItem('rehlatna-reduce-motion') === 'true';
      } catch {}
      setMotionBlocked(
        query.matches ||
          Boolean(connection?.saveData) ||
          manual ||
          document.documentElement.classList.contains('reduce-motion'),
      );
    };
    update();
    setGreeting(new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير');
    query.addEventListener('change', update);
    window.addEventListener('rehlatna-preferences', update);
    connection?.addEventListener?.('change', update);
    return () => {
      query.removeEventListener('change', update);
      window.removeEventListener('rehlatna-preferences', update);
      connection?.removeEventListener?.('change', update);
    };
  }, []);
  useEffect(() => {
    if (!expanded || !hero.current) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const siblings: Array<{ element: HTMLElement; inert: boolean }> = [];
    let current: HTMLElement | null = hero.current;
    while (current && current !== document.body) {
      for (const el of Array.from(current.parentElement?.children ?? []))
        if (el !== current && el instanceof HTMLElement) {
          siblings.push({ element: el, inert: el.inert });
          el.inert = true;
        }
      current = current.parentElement;
    }
    close.current?.focus();
    return () => {
      document.body.style.overflow = oldOverflow;
      siblings.forEach((x) => (x.element.inert = x.inert));
      opener.current?.focus();
    };
  }, [expanded]);
  function open() {
    const r = hero.current!.getBoundingClientRect();
    setClip(
      `inset(${Math.max(0, r.top)}px ${Math.max(0, innerWidth - r.right)}px ${Math.max(0, innerHeight - r.bottom)}px ${Math.max(0, r.left)}px round 28px)`,
    );
    setExpanded(true);
  }
  async function togglePlayback() {
    if (!video.current) return;
    if (video.current.paused) {
      try {
        await video.current.play();
        setPaused(false);
      } catch {
        setFailed(true);
      }
    } else {
      video.current.pause();
      setPaused(true);
    }
  }
  async function share() {
    const text = `الأسبوع ${weeks} — ${media.summary || 'رحلتكم مستمرة، كل يوم أقرب إلى اللقاء.'}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setShareStatus('تم نسخ ملخّص الأسبوع');
      }
    } catch {
      setShareStatus('لم تكتمل المشاركة. يمكنكم المحاولة مجدداً.');
    }
  }
  const dateLabel = new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
    day: 'numeric',
    month: 'long',
    calendar: 'gregory',
    timeZone: 'UTC',
  }).format(new Date(dateIso));
  return (
    <div className={'baby-hero-slot' + (expanded ? ' is-expanded' : '')}>
      <section
        ref={hero}
        className={'baby-hero' + (expanded ? ' expanded' : '') + (motionBlocked ? ' still' : '')}
        role={expanded ? 'dialog' : undefined}
        aria-modal={expanded ? true : undefined}
        aria-label={expanded ? `الأسبوع ${weeks} — ${babyName || 'صغيركم'}` : 'بطل الصغير'}
        style={{ '--hero-start-clip': clip } as CSSProperties}
        onKeyDown={(e) => {
          if (!expanded) return;
          if (e.key === 'Escape') {
            e.preventDefault();
            setExpanded(false);
          }
          if (e.key === 'Tab') {
            const focusable = Array.from(
              hero.current!.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]'),
            ).filter((el) => el.getClientRects().length);
            const first = focusable[0],
              last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div
          className={'baby-visual' + (!media.poster || imageFailed ? ' is-ambient' : '')}
          aria-hidden="true"
        >
          {(!media.poster || imageFailed) && (
            <span className="hero-ambient-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          )}
          {media.poster && !imageFailed && (
            <Image
              src={media.poster}
              alt=""
              fill
              sizes="(max-width: 700px) 100vw, 1000px"
              priority
              onError={() => setImageFailed(true)}
            />
          )}
          {media.video && (
            <video
              ref={video}
              src={videoPermitted ? media.video : undefined}
              muted
              loop
              playsInline
              autoPlay={videoPermitted}
              preload={videoPermitted ? 'metadata' : 'none'}
              onCanPlay={() => setVideoReady(true)}
              onError={() => setFailed(true)}
              onPlay={() => setPaused(false)}
              onPause={() => setPaused(true)}
              className={videoReady && !failed && videoPermitted ? 'ready' : ''}
            />
          )}
        </div>
        {!expanded && (
          <button
            ref={opener}
            className="hero-open-area"
            onClick={open}
            aria-label={`شاهد تطور الأسبوع ${weeks}`}
            aria-haspopup="dialog"
          />
        )}
        <header className="baby-hero-top">
          {expanded ? (
            <>
              <button
                className="hero-icon-button"
                onClick={share}
                aria-label="مشاركة ملخّص الأسبوع"
              >
                ↗
              </button>
              <div>
                <h2>
                  الأسبوع <bdi>{weeks}</bdi>
                </h2>
                <p>
                  {babyName || 'صغيركم'} · اليوم <bdi>{p.dayOfWeek}</bdi> من الأسبوع
                </p>
              </div>
              <button
                ref={close}
                className="hero-icon-button"
                onClick={() => setExpanded(false)}
                aria-label="إغلاق"
              >
                ×
              </button>
            </>
          ) : (
            <>
              <time dateTime={dateIso}>{dateLabel}</time>
              <Link
                className="hero-avatar"
                href={demo ? '/demo?tab=more' : '/more'}
                aria-label="ملف العائلة"
              >
                {Array.from(memberName)[0]}
              </Link>
            </>
          )}
        </header>
        {!expanded && (
          <div className="baby-hero-intro">
            <p className="hero-greeting">{greeting}</p>
            <h1>رحلتكم مستمرة</h1>
            <p>{mother ? 'مع كل يوم، تنمو الحياة بداخلك' : 'مع كل يوم، تنمو الحياة بينكم'}</p>
          </div>
        )}
        {!expanded && (
          <div className="baby-hero-copy">
            <div className="baby-week">
              <span className="numeric">{weeks}</span>
              <strong>الأسبوع</strong>
              <small>من 40 أسبوعاً</small>
            </div>
            <div
              className="progress"
              role="progressbar"
              aria-label="رحلة الحمل من 280 يوماً"
              aria-valuemin={0}
              aria-valuemax={280}
              aria-valuenow={Math.min(280, p.elapsed)}
            >
              <span style={{ width: p.progress + '%' }} />
            </div>
          </div>
        )}
        {!expanded && (
          <div className="hero-pregnancy-meta">
            <p className="trimester">
              {mother ? 'أنتِ' : 'نحن'} في الثلث {['الأول', 'الثاني', 'الثالث'][p.trimester - 1]} من
              الحمل
            </p>
            <small>
              اليوم {p.dayOfWeek} من الأسبوع · {p.remainingText}
            </small>
          </div>
        )}
        {expanded && (
          <div className="hero-media-controls">
            {media.video && videoPermitted ? (
              <button
                className="hero-play"
                onClick={
                  failed
                    ? () => {
                        setFailed(false);
                        setVideoReady(false);
                        video.current?.load();
                      }
                    : togglePlayback
                }
              >
                {failed ? 'إعادة المحاولة' : paused ? 'تشغيل' : 'إيقاف'}
              </button>
            ) : (
              <span>
                {motionBlocked && media.video ? 'عرض الصورة الثابتة' : 'الفيديو قيد الإعداد'}
              </span>
            )}
          </div>
        )}
        <div className="baby-hero-bottom">
          {media.poster && !imageFailed && !media.medicallyReviewed && (
            <span className="media-review-badge">غير مُراجَع طبياً — للتطوير فقط</span>
          )}
          {(!media.poster || imageFailed) && (
            <p className="media-pending">
              {weeks < 5
                ? 'بداية الرحلة — نتابع الأيام بهدوء، دون صورة أو قياس في هذه المرحلة.'
                : 'الفيديو الأسبوعي قيد الإعداد ويحتاج مراجعة طبية قبل النشر.'}
            </p>
          )}
          {!expanded ? (
            <div className="baby-size-row">
              <div>
                {media.comparison && <h2>بحجم {media.comparison} تقريباً</h2>}
                {media.length && <p>يبلغ الطول حوالي {media.length}</p>}
              </div>
              <button className="hero-watch" onClick={open}>
                <span aria-hidden="true">↗</span>شاهد التطور
              </button>
            </div>
          ) : (
            <div className="baby-detail-sheet">
              <span className="sheet-handle" />
              <h3>تطور الأسبوع</h3>
              <p>
                {media.summary ||
                  'تفاصيل هذا الأسبوع قيد المراجعة. يمكنكم متابعة موعد الوصول وتنظيم رحلتكم.'}
              </p>
              {media.points.length > 0 && (
                <ul>
                  {media.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
              <div className="baby-measurements">
                <span>
                  الطول: {media.length || '—'}
                  <small>{weeks < 20 ? 'من الرأس إلى المقعد' : 'من الرأس إلى الكعب'}</small>
                </span>
                <span>الوزن: {media.weight || '—'}</span>
              </div>
              <Link href={weekHref} className="button">
                تطور الأسبوع
              </Link>
              <small>{medicalNotice}</small>
              <p role="status">{shareStatus}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
