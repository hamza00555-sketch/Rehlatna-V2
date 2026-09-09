'use client';
import { useState, useActionState } from 'react';
import { emailLogin, verifyEmailCode, googleLogin, type FormState } from '@/app/actions';
export function LoginForm({
  next,
  ready,
  google,
}: {
  next: string;
  ready: boolean;
  google: boolean;
}) {
  const [email, setEmail] = useState(''),
    [sent, setSent] = useState(false),
    [token, setToken] = useState('');
  const [state, submit, pending] = useActionState(async (_: FormState, f: FormData) => {
    const verify = f.get('mode') === 'verify';
    const result = await (verify ? verifyEmailCode : emailLogin)({}, f);
    if (result.success && !verify) setSent(true);
    return result;
  }, {});
  return (
    <>
      {!sent && (
        <>
          <form action={googleLogin}>
            <input type="hidden" name="next" value={next} />
            <button className="button secondary full" disabled={!ready || !google}>
              <span aria-hidden="true">G · </span>المتابعة بحساب Google
            </button>
          </form>
          {!google && <small>الدخول بحساب Google غير مفعّل بعد. استخدموا البريد مؤقتاً.</small>}
          <p className="auth-divider">أو بالبريد الإلكتروني</p>
        </>
      )}
      <form action={submit} className="form card">
        <fieldset disabled={pending || !ready}>
          <input type="hidden" name="next" value={next} />
          {sent ? (
            <>
              <input type="hidden" name="email" value={email} />
              <p>
                أرسلنا رابط الدخول إلى <bdi>{email}</bdi>. افتحوه من هذا الجهاز نفسه، وسيكمل الدخول
                تلقائياً.
              </p>
              <label>
                رمز التحقق
                <input
                  name="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  dir="ltr"
                  maxLength={8}
                />
              </label>
              <small>وصلكم رمز بدل الرابط؟ أدخلوه هنا.</small>
              <button className="button" name="mode" value="verify" disabled={token.length < 6}>
                متابعة
              </button>
              <button className="button secondary" name="mode" value="send">
                إعادة الإرسال
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setSent(false);
                  setToken('');
                }}
              >
                تغيير البريد
              </button>
            </>
          ) : (
            <>
              <label>
                البريد الإلكتروني
                <input
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  required
                  maxLength={254}
                />
              </label>
              <button className="button" name="mode" value="send" disabled={!email.includes('@')}>
                {pending ? 'لحظة…' : 'أرسلوا رابط الدخول'}
              </button>
              <small>البريد يُستخدم للدخول فقط، ولا يُشارك مع أحد.</small>
            </>
          )}
        </fieldset>
        {state.error && (
          <p className="notice error" role="alert">
            {state.error}
          </p>
        )}
      </form>
    </>
  );
}
