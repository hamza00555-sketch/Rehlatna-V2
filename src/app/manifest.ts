import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'رحلتنا',
    short_name: 'رحلتنا',
    description: 'مساحة مشتركة للحمل والعائلة',
    start_url: '/',
    display: 'standalone',
    background_color: '#FCF2EA',
    theme_color: '#FCF2EA',
    lang: 'ar',
    dir: 'rtl',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
