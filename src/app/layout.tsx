import { cookies } from 'next/headers';
import type { Metadata, Viewport } from 'next';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@/design/tokens.css';
import './globals.css';
import '@/design/experience.css';
import '@/design/baby-hero.css';
import '@/design/product.css';
import '@/design/today-scene.css';
export const metadata: Metadata = {
  title: { default: 'رحلتنا — كل يوم أقرب', template: '%s · رحلتنا' },
  description: 'مساحة مشتركة لمتابعة الحمل، تجهيز الطفل، والاعتناء بتفاصيل العائلة.',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FCF2EA' };
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const theme = jar.get('rehlatna-theme')?.value;
  const motion = jar.get('rehlatna-motion')?.value === 'reduce';
  return (
    <html
      lang="ar"
      dir="rtl"
      className={
        (theme === 'dark' ? 'theme-dark' : theme === 'light' ? 'theme-light' : 'theme-system') +
        (motion ? ' reduce-motion' : '')
      }
    >
      <body>
        <a className="skip-link" href="#content">
          تجاوز إلى المحتوى
        </a>
        <div id="content">{children}</div>
      </body>
    </html>
  );
}
