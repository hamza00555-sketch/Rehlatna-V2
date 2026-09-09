export const roleNames = {
  mother: 'الأم',
  partner: 'الشريك',
  finance: 'مسؤول التخطيط المالي',
  supporter: 'داعم من العائلة',
};
export type Role = keyof typeof roleNames;
export const permissionNames = {
  'journey.view': 'عرض الرحلة',
  'journey.edit': 'تعديل الرحلة',
  'appointments.view': 'عرض المواعيد',
  'appointments.edit': 'تعديل المواعيد',
  'preparation.view': 'عرض التجهيز',
  'preparation.edit': 'تعديل التجهيز',
  'care.view': 'عرض الرعاية الصحية',
  'care.edit': 'تعديل الرعاية الصحية',
  'finance.view': 'عرض الخطة المالية',
  'finance.edit': 'تعديل الخطة المالية',
  'family.manage': 'إدارة العائلة والصلاحيات',
};
export type Permission = keyof typeof permissionNames;
export function memberRoles(m: { roles?: string[]; role: string }): Role[] {
  return (m.roles?.length ? m.roles : [m.role === 'viewer' ? 'supporter' : 'partner']) as Role[];
}
export function permissions(m: {
  roles?: string[];
  role: string;
  permission_overrides?: Record<string, boolean>;
}): Set<Permission> {
  const result = new Set<Permission>();
  for (const role of memberRoles(m)) {
    const keys =
      role === 'finance'
        ? ['preparation.view', 'finance.view', 'finance.edit']
        : role === 'supporter'
          ? ['journey.view', 'appointments.view', 'preparation.view']
          : Object.keys(permissionNames).filter((k) => !k.startsWith('finance.'));
    for (const k of keys) result.add(k as Permission);
  }
  for (const [k, v] of Object.entries(m.permission_overrides ?? {}))
    if (v) result.add(k as Permission);
    else result.delete(k as Permission);
  return result;
}
export const categories = {
  sleep: 'النوم',
  transport: 'التنقل',
  feeding: 'التغذية',
  clothes: 'الملابس',
  care: 'العناية',
  hospital: 'المستشفى',
  travel: 'السفر',
  mother: 'احتياجات الأم بعد الولادة',
  other: 'أخرى',
};
export const statuses = {
  needed: 'نحتاج شراءه',
  later: 'لم نقرر',
  ready: 'متوفر',
  not_required: 'غير مطلوب',
};
export const appointmentKinds = {
  follow: 'متابعة',
  ultrasound: 'سونار',
  lab: 'تحاليل',
  consultation: 'استشاري',
  birth_plan: 'تخطيط الولادة',
  postpartum: 'متابعة بعد الولادة',
  baby: 'فحص الصغير',
  other: 'أخرى',
};
export const doctorRoles = {
  follow: 'طبيب المتابعة',
  birth: 'طبيب الولادة',
  consultant: 'استشاري',
  backup: 'بديل',
};
export const coverageNames = {
  unknown: 'غير مؤكد',
  believed_included: 'يُعتقد أنه مشمول',
  believed_excluded: 'يُعتقد أنه غير مشمول',
};
export const stages = { before: 'قبل الولادة', birth: 'عند الولادة', after: 'بعد الولادة' };
export const priorities = { essential: 'أساسي', important: 'مهم', optional: 'اختياري' };
export const taskKinds = {
  feeding: 'تغذية',
  medical: 'طبي',
  mother: 'رعاية الأم',
  home: 'المنزل',
  other: 'أخرى',
};
export const feedingNames = {
  breast: 'رضاعة طبيعية',
  expressed: 'حليب مشفوط ومخزّن',
  formula: 'حليب صناعي',
};
export const isoToday = () => new Date().toISOString().slice(0, 10);
export function dateLabel(value: string | null | undefined, long = false) {
  if (!value) return 'غير محدد';
  const d = new Date(value.length === 10 ? value + 'T12:00:00Z' : value);
  return Number.isFinite(+d)
    ? new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
        dateStyle: long ? 'full' : 'medium',
        timeZone: 'Asia/Riyadh',
      }).format(d)
    : 'غير محدد';
}
export function daysBetween(a: string, b = isoToday()) {
  return Math.round(
    (Date.parse(a.slice(0, 10) + 'T12:00:00Z') - Date.parse(b.slice(0, 10) + 'T12:00:00Z')) /
      86400000,
  );
}
export function shiftDate(date: string, days: number) {
  return new Date(Date.parse(date + 'T12:00:00Z') + days * 86400000).toISOString().slice(0, 10);
}
export function money(cents: number, currency = 'SAR') {
  return new Intl.NumberFormat('ar-SA-u-nu-latn', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
export type Goal = {
  id: string;
  title: string;
  owner_id: string;
  expected_cents: number;
  actual_cents: number | null;
  initial_cents: number;
  funding_date: string;
  spending_date: string | null;
  priority: keyof typeof priorities;
  stage: keyof typeof stages;
  visibility: string;
  notes: string;
  item_id: string | null;
};
export function goalNumbers(
  g: Pick<Goal, 'expected_cents' | 'actual_cents' | 'initial_cents' | 'funding_date'>,
  contributions: number = 0,
  today = isoToday(),
) {
  const target = Number(g.actual_cents ?? g.expected_cents),
    saved = Number(g.initial_cents) + contributions,
    remaining = Math.max(0, target - saved);
  const [y, m] = today.split('-').map(Number),
    [fy, fm] = g.funding_date.split('-').map(Number);
  const months = Math.max(1, (fy - y) * 12 + fm - m + 1);
  const status =
    remaining === 0
      ? 'مكتمل'
      : g.funding_date.slice(0, 7) < today.slice(0, 7)
        ? 'تجاوز تاريخ التمويل'
        : g.funding_date.slice(0, 7) === today.slice(0, 7)
          ? 'يحتاج انتباهاً هذا الشهر'
          : saved > 0
            ? 'على المسار'
            : 'لم يبدأ التمويل بعد';
  return {
    target,
    saved,
    remaining,
    months,
    monthly: Math.ceil(remaining / months),
    percent: target ? Math.min(100, Math.round((saved / target) * 100)) : 100,
    status,
  };
}
export type Item = {
  id: string;
  title: string;
  status: keyof typeof statuses;
  category: keyof typeof categories;
  item_type: string;
  hospital_bag: boolean;
  notes: string;
};
export type Provider = {
  id: string;
  kind: string;
  name: string;
  city: string;
  phone: string;
  website: string;
  doctor_role: keyof typeof doctorRoles;
  specialty: string;
  purposes: string[];
  coverage: keyof typeof coverageNames;
  last_verified: string | null;
  program: string;
  notes: string;
};
export const medicalDisclaimer =
  'رحلتنا يساعدك على تنظيم متابعة الحمل، لكنه لا يستبدل نصيحة الطبيب أو مقدم الرعاية الصحية.';
export const insuranceDisclaimer =
  'قد تختلف تفاصيل التغطية حسب نوع الوثيقة والشروط؛ التواصل مع شركة التأمين هو الطريقة الوحيدة للتأكد.';
