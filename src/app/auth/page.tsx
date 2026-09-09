export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Brand, PageTitle, Icon, NurseryImage } from '@/components/ui';
import { ActionForm } from '@/components/form';
import { configured, googleEnabled, user } from '@/lib/supabase';
import { safeNext } from '@/lib/validation';
import { emailLogin, googleLogin } from '@/app/actions';
export default async function Auth({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await user()) redirect(next);
  const ready = configured();
  return (
    <main className="auth-stage">
      <aside className="auth-art">
        <NurseryImage priority />
        <div>
          <span>رحلتنا · معًا من البداية</span>
          <h2>
            تفاصيل صغيرة،
            <br />
            وحبّ يملأ الحياة.
          </h2>
        </div>
      </aside>
      <div className="auth-layout">
        <Brand />
        <PageTitle
          eyebrow="حكاية جديدة تبدأ هنا"
          title="أهلًا بك في رحلتكم"
          description="ادخل بحسابك، ثم أنشئ عائلتك أو انضم بدعوة الشريك."
        />
        {!ready && (
          <p className="notice" role="status">
            تسجيل الدخول غير متاح بعد في هذه النسخة. يمكنك استكشاف المعاينة الآن.
          </p>
        )}
        {params.error && (
          <p role="alert" className="notice error">
            تعذر إكمال الدخول. جرّب رابطًا جديدًا أو طريقة أخرى.
          </p>
        )}
        {googleEnabled() && (
          <form action={googleLogin}>
            <input type="hidden" name="next" value={next} />
            <button className="button secondary full" disabled={!ready}>
              المتابعة بحساب Google
            </button>
          </form>
        )}
        <div className="card">
          <ActionForm action={emailLogin} label="أرسل رابط الدخول" disabled={!ready}>
            <input type="hidden" name="next" value={next} />
            <label>
              البريد الإلكتروني
              <input
                name="email"
                type="email"
                autoComplete="email"
                dir="ltr"
                required
                maxLength={254}
              />
            </label>
          </ActionForm>
        </div>
        <small>سنرسل رابطًا للدخول إلى بريدك. لا تحتاج إلى تذكر كلمة مرور.</small>
        <div className="privacy-line">
          <Icon name="lock" />
          <span>حسابك لك. مشاركة تفاصيلك تبقى باختيارك.</span>
        </div>
        <Link href="/demo" className="text-link">
          استكشف النسخة التجريبية
        </Link>
      </div>
    </main>
  );
}
