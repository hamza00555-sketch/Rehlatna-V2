export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Brand, PageTitle } from '@/components/ui';
import { ActionForm } from '@/components/form';
import { acceptInvite } from '@/app/actions';
import { user } from '@/lib/supabase';
export default async function Join({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const current = await user();
  const valid = Boolean(token && /^[0-9a-f]{64}$/.test(token));
  return (
    <main className="auth-layout">
      <Brand />
      <PageTitle
        title="لك مكان في الرحلة"
        description="الدعوة مرتبطة بالبريد الذي حدده صاحب العائلة، وتُستخدم مرة واحدة."
      />
      {!valid ? (
        <p className="notice error">رابط الدعوة غير مكتمل. اطلب رابطًا جديدًا.</p>
      ) : !current ? (
        <Link className="button" href={'/auth?next=' + encodeURIComponent('/join?token=' + token)}>
          الدخول لقبول الدعوة
        </Link>
      ) : (
        <div className="card">
          <p>
            أنت داخل بحساب: <bdi>{current.email}</bdi>
          </p>
          <ActionForm action={acceptInvite} label="الانضمام إلى العائلة">
            <input type="hidden" name="token" value={token} />
            <label>
              اسمك
              <input name="memberName" maxLength={80} required />
            </label>
          </ActionForm>
          <small>
            إذا كان الحساب مختلفًا عن البريد المدعو، اخرج وادخل بالبريد الصحيح من صفحة العائلة.
          </small>
        </div>
      )}
    </main>
  );
}
