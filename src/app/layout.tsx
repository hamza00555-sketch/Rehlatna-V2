import type { Metadata, Viewport } from 'next';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@/design/tokens.css';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'رحلتنا — كل يوم أقرب', template: '%s · رحلتنا' },
  description: 'مساحة مشتركة لمتابعة الحمل، تجهيز الطفل، والاعتناء بتفاصيل العائلة.',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FCF2EA' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <a className="skip-link" href="#content">
          تجاوز إلى المحتوى
        </a>
        <div id="content">{children}</div>
      </body>
    </html>
  );
}
