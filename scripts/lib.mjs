// Shared look for every generated SVG: colours, fonts, icons and small drawing helpers.
// Style references: dark.design (near-black pages, dot-grid texture, soft grey cards,
// monospace eyebrows, pill tags) and ui.live (gradient-ring buttons, bento cards).
import { readFileSync } from 'node:fs';

export const THEMES = {
  dark: {
    bg: '#0d1117', card: '#10161d', card2: '#151c24', line: '#232c36', lineHi: '#34404d',
    text: '#e6edf3', muted: '#8b949e', faint: '#5b6673', dot: '#1f2832',
    accent: '#2dd4bf', violet: '#a78bfa', pink: '#e879f9', amber: '#f59e0b', green: '#4ade80',
    mono: '#e6edf3', // colour used for black brand logos (Next.js, Vercel…)
  },
  light: {
    bg: '#ffffff', card: '#f8fafb', card2: '#f1f4f7', line: '#dfe5eb', lineHi: '#c5ced8',
    text: '#1f2328', muted: '#59636e', faint: '#8c959f', dot: '#e3e8ee',
    accent: '#0f766e', violet: '#6d28d9', pink: '#a21caf', amber: '#b45309', green: '#15803d',
    mono: '#1f2328',
  },
};

export const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
export const MONO = "ui-monospace, SFMono-Regular, 'Cascadia Code', Consolas, 'Liberation Mono', monospace";
export const EASE = 'cubic-bezier(.22,1,.36,1)';

export const ICONS = JSON.parse(readFileSync(new URL('./icons.json', import.meta.url)));

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Approximate text width for system sans/mono fonts.
export const textW = (s, size, mono = false) => s.length * size * (mono ? 0.6 : 0.53);

// Wrap text into lines that fit `width` px.
export function wrap(text, size, width) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (textW(next, size) > width && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

// A brand logo (Simple Icons, 24x24 viewBox) at (x, y) with the given size.
export function brand(slug, x, y, size, T) {
  const b = ICONS.brands[slug];
  const dark = ['000000', '181717'].includes(b.hex);
  const fill = dark ? T.mono : `#${b.hex}`;
  return `<path transform="translate(${x} ${y}) scale(${size / 24})" d="${b.path}" fill="${fill}"/>`;
}

// A Lucide outline icon (24x24, stroke based).
export function lucide(name, x, y, size, color, width = 2) {
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${ICONS.lucide[name]}</g>`;
}

// Dot-grid texture used as a card background.
export function dotGrid(id, T, gap = 22) {
  return `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.3" fill="${T.dot}"/></pattern>`;
}

// A light beam that travels around a rounded rectangle's border (ui.live-style ring).
// Drawn as a short gradient-coloured dash moving along the outline.
export function beam(x, y, w, h, r, colors, dur, delay = 0, width = 2) {
  const id = `b${Math.round(x)}${Math.round(y)}${Math.round(w)}`;
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${colors.map((c, i) => `<stop offset="${i / (colors.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient></defs>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="url(#${id})" stroke-width="${width}" pathLength="100"
    stroke-dasharray="18 82" stroke-linecap="round" class="beam" style="animation-duration:${dur}s;animation-delay:${delay}s"/>`;
}
export const beamCss = `.beam{animation:beam linear infinite}@keyframes beam{to{stroke-dashoffset:-100}}`;

export const reducedMotion = (extra = '') => `@media (prefers-reduced-motion: reduce){*{animation:none!important}${extra}}`;
