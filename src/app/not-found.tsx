import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="auth-layout">
      <h1>لم نجد هذه الصفحة</h1>
      <p>ربما حُذف العنصر أو تغيّر الرابط.</p>
      <Link className="button" href="/today">
        اليوم
      </Link>
    </main>
  );
}
