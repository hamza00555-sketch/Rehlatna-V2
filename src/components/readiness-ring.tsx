import type { CSSProperties } from 'react';

export function ReadinessRing({ ready, total }: { ready: number; total: number }) {
  const percent = total ? Math.min(100, Math.round((ready / total) * 100)) : 0;
  return (
    <div
      className="readiness-orbit"
      style={{ '--readiness': `${percent}%` } as CSSProperties}
      role="img"
      aria-label={total ? `${ready} من ${total} متوفر` : 'لم تبدأ قائمة التجهيز'}
    >
      <span className="readiness-orbit-core">
        <strong className="numeric">
          {percent}
          <small>%</small>
        </strong>
        <span>جاهزية التجهيز</span>
      </span>
    </div>
  );
}
