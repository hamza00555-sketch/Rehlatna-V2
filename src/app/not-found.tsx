import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="auth-layout">
      <h1>الصفحة غير موجودة</h1>
      <p>قد يكون الرابط تغيّر. نرجع لبداية الرحلة؟</p>
      <Link className="button" href="/">
        العودة للبداية
      </Link>
    </main>
  );
}
