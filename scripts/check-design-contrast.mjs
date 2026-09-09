// Checks the real semantic foreground/background pairs in today-scene.css.
// This is a source-level contrast check; it does not claim screenshot or full-page AA validation.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/design/today-scene.css', import.meta.url), 'utf8');
function values(selector) {
  const start = css.indexOf(selector + ' {');
  if (start < 0) throw new Error(`Missing selector ${selector}`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...block.matchAll(/--day-([a-z-]+):\s*(#[a-f\d]{6});/gi)].map((m) => [m[1], m[2]]),
  );
}
function luminance(hex) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
const pairs = [
  ['Headings', 'ink', 'canvas'],
  ['Body text', 'muted', 'canvas'],
  ['Card text', 'ink', 'surface'],
  ['Secondary card text', 'muted', 'surface'],
  ['Next action / active navigation', 'on-accent', 'accent'],
  ['Week number', 'on-hero', 'hero'],
  ['Week secondary text', 'hero-secondary', 'hero'],
  ['Appointment', 'on-medical', 'medical'],
  ['Journey', 'ink', 'journey'],
  ['Readiness', 'ink', 'readiness'],
  ['Media review label', 'warning-ink', 'warning'],
  ['Text links', 'accent', 'canvas'],
  ['Ring label', '#2d4938', 'ring-center'],
];
const light = values('.app-frame');
let failed = false;
for (const [theme, tokens] of [
  ['light', light],
  ['dark', { ...light, ...values('.theme-dark .app-frame') }],
]) {
  const result = pairs.map(([name, fg, bg]) => {
    const text = fg.startsWith('#') ? fg : tokens[fg];
    const background = tokens[bg];
    if (!text || !background) throw new Error(`Missing colour: ${name}`);
    const a = luminance(text),
      b = luminance(background);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (ratio < 4.5) failed = true;
    return { name, text, background, ratio: Number(ratio.toFixed(2)), pass: ratio >= 4.5 };
  });
  console.log(JSON.stringify({ theme, pairs: result }, null, 2));
}
if (failed) process.exitCode = 1;
