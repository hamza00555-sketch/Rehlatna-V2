# Rehlatna visual refinement — 2026-09-09

The product should feel like a thoughtfully prepared home during the wait for a baby: warm, considered, intimate and calm. Large Arabic headlines breathe, a pale canvas leaves room around content, and dark ink gives the hierarchy confidence. Photography is editorial and tactile: timber, linen and natural light. It is used for anticipation and preparation, not as evidence about fetal anatomy. Peach belongs to the pregnancy story, sage to preparation, powder blue to appointments, and dusty rose to family and personal space. Colour groups information; it does not cover every control.

Cards have different jobs and proportions: an immersive split hero, an appointment card with a clear next step, smaller paired cards, a timeline and a preparation list with a photographic anchor. Rounded rectangles do most of the work; a restrained arch on the welcome photograph and family emblem provides identity. Avoid shiny gradients, generic dashboard charts, ornamental gold, emoji as icons, gratuitous animations and walls of identical cards. Motion is limited to a short hover/press response and is removed for reduced-motion preferences. Desktop gets a right-hand Arabic navigation rail; mobile gets a floating navigation bar above the safe area.

## Implementation

- Shared palette and typography: `src/design/tokens.css` (existing extracted source).
- Product compositions: `src/design/experience.css`.
- Shared real/demo components: `PregnancyHero`, `PreparationSummary`, `NurseryImage`, `SectionHeading`, `Shell`.
- Public preview uses fictional, read-only content. Real routes continue to load caller-scoped records and check roles.
- Native buttons, labelled form controls, visible keyboard focus and reduced motion are retained. Progress values include text and do not rely on colour alone.
- Photo asset: `public/images/nursery.webp`, 1440 × 960, approximately 139 KB. Generated with the built-in image generation tool; converted to WebP for delivery. Decorative alt text is empty because the adjacent copy carries the meaning. Next Image provides responsive delivery.
- The image is a mood asset, not a capture or clinical illustration. Previously rejected fetal week images were not reused.

## Image prompt

Editorial photograph for a premium Arabic pregnancy and family preparation app: a serene nursery in warm morning light; an empty sculptural oval pale oak bassinet with only a fitted cream mattress; ivory textured plaster, sheer linen, subtle olive branch shadows and a terracotta vase on a side console. Tactile timber and linen, dusty peach, cream and sage; soft natural film texture. Landscape 3:2, centered bassinet with airy wall above, suitable for tall or wide cropping. No baby, person, pillows, blankets or toys in the bassinet; no writing, interface or logos. Sophisticated and quiet, without cartoon styling or digital gradients.
