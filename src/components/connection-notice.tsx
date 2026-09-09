'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export function ConnectionNotice() {
  const [offline, setOffline] = useState(false),
    router = useRouter();
  useEffect(() => {
    const off = () => setOffline(true),
      on = () => {
        setOffline(false);
        router.refresh();
      };
    setOffline(!navigator.onLine);
    window.addEventListener('offline', off);
    window.addEventListener('online', on);
    return () => {
      window.removeEventListener('offline', off);
      window.removeEventListener('online', on);
    };
  }, [router]);
  return offline ? (
    <aside className="notice" role="status">
      <strong>لا اتصال حالياً</strong>
      <p>قد لا تُحفظ التغييرات. سنحدّث الصفحة تلقائياً عند عودة الاتصال.</p>
    </aside>
  ) : null;
}
