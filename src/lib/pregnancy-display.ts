/** Gestational weeks are completed weeks. Days within a week are displayed 1–7. */
export function pregnancyDisplay(weeks: number, days = 0) {
  const elapsed = weeks * 7 + days;
  const remaining = 280 - elapsed;
  return {
    weeks,
    dayOfWeek: days + 1,
    elapsed,
    trimester: weeks < 14 ? 1 : weeks < 28 ? 2 : 3,
    progress: Math.max(0, Math.min(100, (elapsed / 280) * 100)),
    remainingText:
      remaining < 0
        ? 'تجاوزنا الموعد المتوقع — تابعوا مع طبيبكم'
        : remaining === 0
          ? 'موعد الوصول قريب جداً'
          : remaining >= 14
            ? `يتبقّى نحو ${Math.ceil(remaining / 7)} أسابيع`
            : `يتبقّى نحو ${remaining} أيام`,
  };
}
export type WeeklyMedia = {
  week: number;
  poster?: string;
  video?: string;
  medicallyReviewed: boolean;
  summary?: string;
  points: string[];
  length?: string;
  comparison?: string;
  weight?: string;
  source?: string;
};
/** Exact-week lookup only. Unreviewed assets may appear in the explicit demo only. */
export function weeklyMedia(week: number, demo = false): WeeklyMedia {
  const empty: WeeklyMedia = { week, medicallyReviewed: false, points: [] };
  if (!Number.isInteger(week) || week < 5 || week > 40) return empty;
  if (week === 24)
    return {
      ...empty,
      ...(demo ? { poster: '/media/weekly/week-24.luminous.preview.webp' } : {}),
      summary:
        'تبدو ملامح صغيركم أكثر وضوحاً، مع استمرار النمو داخل الرحم. يختلف النمو بين حمل وآخر، والقياسات هنا تقريبية.',
      points: [
        'تبدو أجزاء الجسم متناسبة بصورة أوضح',
        'يبلغ الطول التقريبي من الرأس إلى الكعب نحو 30 سم',
        'الحجم التقريبي يشبه كوز الذرة',
      ],
      length: '30 سم',
      comparison: 'كوز ذرة',
      source:
        'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-24/',
    };
  return empty;
}
export const medicalNotice = 'المعلومات هنا عامة وللتنظيم فقط، ولا تغني عن متابعة الطبيب.';
