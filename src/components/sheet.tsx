'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
export function Sheet({
  title,
  trigger,
  children,
}: {
  title: string;
  trigger: ReactNode;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = before;
    };
  }, [open]);
  return (
    <>
      <button
        className="sheet-trigger"
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        {trigger}
      </button>
      <dialog
        ref={dialog}
        className="bottom-sheet"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialog.current) {
            const r = dialog.current.getBoundingClientRect();
            if (
              e.clientX < r.left ||
              e.clientX > r.right ||
              e.clientY < r.top ||
              e.clientY > r.bottom
            )
              dialog.current.close();
          }
        }}
      >
        <span className="sheet-handle" />
        <div className="row">
          <h2>{title}</h2>
          <button
            className="sheet-close"
            aria-label="إغلاق اللوحة"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}
export function DangerSigns() {
  return (
    <Sheet
      title="أعراض لا تنتظر الموعد القادم"
      trigger={
        <>
          <span>
            متى نتواصل مع الطبيب دون انتظار الموعد؟<small>علامات تحتاج تقييماً طبياً</small>
          </span>
          <span aria-hidden="true">←</span>
        </>
      }
    >
      <p>هذه الأعراض تستدعي تقييماً طبياً دون انتظار الموعد القادم:</p>
      <ul className="danger-signs">
        {[
          'نزيف أو نزول سائل من المهبل',
          'صداع شديد ومستمر أو اضطراب في الرؤية',
          'تورّم شديد أو مفاجئ في اليدين أو الوجه',
          'ألم شديد في البطن',
          'حرارة أو رعشة',
          'قيء شديد ومستمر',
          'انخفاض ملحوظ في حركة الجنين بعد أن تصبح الحركة منتظمة',
          'ضيق التنفس أو ألم في الصدر',
        ].map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <p>
        رحلتنا لا يشخّص الحالة. اطلبوا تقييماً طبياً فوراً عند ظهور هذه العلامات؛ لا تنتظروا الموعد
        القادم.
      </p>
      <a
        className="text-link"
        href="https://www.cdc.gov/hearher/maternal-warning-signs/index.html"
        target="_blank"
        rel="noreferrer"
      >
        المصدر: علامات التحذير للأمهات — CDC
      </a>
    </Sheet>
  );
}
