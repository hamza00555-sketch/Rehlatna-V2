// Product planning windows, not a universal clinical protocol. See inline source and review notes.
export type CareWindow = {
  key: string;
  title: string;
  start: number;
  end: number;
  kind: string;
  optional?: boolean;
  conditional?: boolean;
  source?: string;
  note: string;
};
const visitNote =
  'هذه محطة لتنظيم المتابعة ومناقشة ما يلزم مع الطبيب. عدد الزيارات وتوقيتها يختلفان بحسب الحالة وخطة مقدم الرعاية.';
export const careWindows: CareWindow[] = [
  { key: 'first', title: 'زيارة الحمل الأولى', start: 4, end: 12, kind: 'follow', note: visitNote },
  {
    key: 'nipt',
    title: 'فحص NIPT',
    start: 10,
    end: 22,
    kind: 'lab',
    optional: true,
    note: 'قرار اختياري يُناقش مع الطبيب. نهاية هذه النافذة حد تنظيمي في التطبيق، وليست آخر موعد طبي صالح للفحص.',
    source: 'https://www.acog.org/womens-health/infographics/cell-free-dna-prenatal-screening-test',
  },
  {
    key: 'early-scan',
    title: 'السونار المبكر',
    start: 11,
    end: 14,
    kind: 'ultrasound',
    note: 'ناقشوا توقيت السونار المبكر وأهدافه مع مقدم الرعاية.',
    source:
      'https://www.nhs.uk/pregnancy/your-pregnancy-care/your-antenatal-care-and-appointments/',
  },
  {
    key: 'visit-18',
    title: 'زيارة المتابعة حوالي الأسبوع 18',
    start: 17,
    end: 19,
    kind: 'follow',
    note: visitNote,
  },
  {
    key: 'anatomy',
    title: 'فحص التشريح التفصيلي للجنين',
    start: 18,
    end: 22,
    kind: 'ultrasound',
    note: 'يمكن مناقشة فحص تطور الجنين بالسونار في هذه المرحلة؛ يحدد فريقكم الموعد المناسب.',
    source: 'https://www.acog.org/womens-health/faqs/ultrasound-exams',
  },
  {
    key: 'visit-24',
    title: 'زيارة المتابعة حوالي الأسبوع 24',
    start: 23,
    end: 25,
    kind: 'follow',
    note: visitNote,
  },
  {
    key: 'diabetes',
    title: 'فحص سكري الحمل',
    start: 24,
    end: 28,
    kind: 'lab',
    note: 'قد يُعرض فحص سكري الحمل في هذه الفترة أو قبلها بحسب عوامل الخطورة وتقييم الطبيب.',
    source: 'https://www.nhs.uk/conditions/gestational-diabetes/',
  },
  {
    key: 'visit-28',
    title: 'زيارة المتابعة حوالي الأسبوع 28',
    start: 27,
    end: 29,
    kind: 'follow',
    note: visitNote,
  },
  {
    key: 'tdap',
    title: 'مناقشة لقاح Tdap',
    start: 27,
    end: 36,
    kind: 'consultation',
    note: 'ناقشوا مع الطبيب لقاح السعال الديكي أثناء الحمل والتوصيات المعمول بها في بلدكم.',
    source: 'https://www.cdc.gov/pertussis/vaccines/tdap-vaccination-during-pregnancy.html',
  },
  {
    key: 'anti-d',
    title: 'مناقشة حقنة Anti-D',
    start: 28,
    end: 30,
    kind: 'consultation',
    conditional: true,
    note: 'تظهر هذه المحطة عند تسجيل عامل Rh سالب فقط. الطبيب يحدد الاحتياج والتوقيت حسب نتائج الفحوصات والحالة.',
    source: 'https://www.nhs.uk/conditions/rhesus-disease/prevention/',
  },
  {
    key: 'visit-32',
    title: 'زيارة المتابعة حوالي الأسبوع 32',
    start: 31,
    end: 33,
    kind: 'follow',
    note: visitNote,
  },
  {
    key: 'visit-36',
    title: 'زيارة الأسبوع 36 والاستعداد للولادة',
    start: 35,
    end: 37,
    kind: 'follow',
    note: visitNote,
  },
  {
    key: 'gbs',
    title: 'فحص GBS',
    start: 36,
    end: 37,
    kind: 'lab',
    note: 'تختلف سياسة هذا الفحص بين البلدان. اسألوا مقدم الرعاية عن الخطة المناسبة لكم.',
    source: 'https://www.cdc.gov/group-b-strep/testing/index.html',
  },
  {
    key: 'visit-38',
    title: 'زيارة المتابعة حوالي الأسبوع 38',
    start: 37,
    end: 39,
    kind: 'follow',
    note: visitNote,
  },
  {
    key: 'arrival',
    title: 'موعد الوصول المتوقع',
    start: 39,
    end: 41,
    kind: 'follow',
    note: 'موعد الوصول تقديري. تابعوا مع مقدم الرعاية إذا تجاوزتموه، ولا تنتظروا تنبيه التطبيق.',
  },
];
export type WindowAppointment = {
  id: string;
  kind: string;
  starts_at: string;
  status: string;
  window_key: string | null;
};
export function windowState(
  w: CareWindow,
  week: number,
  registration: string | undefined,
  appointments: WindowAppointment[],
  dueDate: string,
) {
  const from = Date.parse(dueDate + 'T00:00:00Z') + (w.start * 7 - 280) * 86400000,
    to = Date.parse(dueDate + 'T00:00:00Z') + ((w.end + 1) * 7 - 280) * 86400000;
  const match = appointments
    .filter(
      (a) =>
        a.status !== 'cancelled' &&
        (a.window_key === w.key ||
          (!a.window_key &&
            a.kind === w.kind &&
            Date.parse(a.starts_at) >= from &&
            Date.parse(a.starts_at) < to)),
    )
    .sort(
      (a, b) =>
        (a.window_key === w.key ? -1 : 1) - (b.window_key === w.key ? -1 : 1) ||
        a.starts_at.localeCompare(b.starts_at),
    )[0];
  if (registration === 'not_applicable')
    return { label: 'لا يناسبنا', tone: 'future', hidden: true, match };
  if (registration === 'done') return { label: 'مسجَّل', tone: 'ready', hidden: false, match };
  if (registration === 'discussed')
    return { label: 'نوقش مع الطبيب', tone: 'medical', hidden: false, match };
  if (match?.status === 'completed' && (match.window_key === w.key || w.kind === 'follow'))
    return { label: 'مسجَّل', tone: 'ready', hidden: false, match };
  if (match?.status === 'upcoming')
    return { label: 'موعد مسجَّل', tone: 'medical', hidden: false, match };
  if (week < w.start)
    return { label: 'يبدأ عادةً في الأسبوع ' + w.start, tone: 'future', hidden: false, match };
  if (week <= w.end)
    return {
      label: w.optional ? 'اختياري' : w.conditional ? 'حسب حالتك' : 'الفترة المعتادة الآن',
      tone: w.optional || w.conditional ? 'medical' : 'needed',
      hidden: false,
      match,
    };
  return {
    label: 'لم يُسجَّل بعد',
    tone: 'unverified',
    hidden: !!w.optional || week > w.end + 4,
    match,
  };
}
