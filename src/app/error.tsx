'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="auth-layout">
      <h1>ما قدرنا نكمل هذه الخطوة</h1>
      <p>قد يكون الاتصال انقطع أو تغيّرت صلاحية الوصول. لم نعرض تفاصيل بياناتك هنا.</p>
      <button className="button" onClick={reset}>
        حاول مرة أخرى
      </button>
      <Link href="/today" className="text-link">
        العودة لليوم
      </Link>
    </main>
  );
}
