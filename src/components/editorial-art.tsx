import Image from 'next/image';

export const editorialAssets = {
  nursery: { src: '/images/editorial/nursery.webp', alt: 'ركن نوم دافئ بسرير خشبي وضوء طبيعي' },
  essentials: {
    src: '/images/editorial/essentials.webp',
    alt: 'ملابس وقطع قطنية صغيرة بألوان هادئة',
  },
  bag: { src: '/images/editorial/arrival-bag.webp', alt: 'حقيبة قماشية وتجهيزات ليوم الوصول' },
  journey: {
    src: '/images/editorial/journey.webp',
    alt: 'شريط متصل يعبر أقواساً مضاءة، تعبيراً عن الرحلة',
  },
} as const;
export type EditorialKind = keyof typeof editorialAssets;

export function categoryArt(category: string): EditorialKind {
  if (category === 'sleep') return 'nursery';
  if (['hospital', 'travel'].includes(category)) return 'bag';
  if (category === 'transport') return 'journey';
  return 'essentials';
}

export function EditorialArt({
  kind,
  title,
  caption = 'صورة توضيحية',
  compact = false,
  priority = false,
}: {
  kind: EditorialKind;
  title?: string;
  caption?: string;
  compact?: boolean;
  priority?: boolean;
}) {
  const asset = editorialAssets[kind];
  return (
    <figure className={'editorial-art editorial-' + kind + (compact ? ' editorial-compact' : '')}>
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        sizes={compact ? '(max-width: 700px) 50vw, 440px' : '(max-width: 700px) 100vw, 1000px'}
        priority={priority}
      />
      <figcaption>
        {title && <strong>{title}</strong>}
        {caption && <span>{caption}</span>}
      </figcaption>
    </figure>
  );
}
