export const dynamic = 'force-dynamic';
import { Brand, PageTitle } from '@/components/ui';
import { ActionForm } from '@/components/form';
import { createFamily } from '@/app/actions';
import { requireUser } from '@/lib/supabase';
export default async function Setup() {
  await requireUser();
  return (
    <main className="auth-layout">
      <Brand />
      <PageTitle
        eyebrow="أول خطوة معًا"
        title="مساحة لعائلتكم"
        description="اختر اسمًا لهذه المساحة. يمكنك دعوة الشريك بعد إنشائها."
      />
      <section className="card">
        <ActionForm action={createFamily} label="إنشاء العائلة">
          <label>
            اسم العائلة
            <input name="familyName" required maxLength={80} placeholder="رحلتنا الجميلة" />
          </label>
          <label>
            اسمك
            <input name="memberName" required maxLength={80} autoComplete="given-name" />
          </label>
        </ActionForm>
      </section>
      <small>إنشاء العائلة يمنحك إدارة العضوية. المعلومات الخاصة تبقى تحت تحكم صاحبها.</small>
    </main>
  );
}
