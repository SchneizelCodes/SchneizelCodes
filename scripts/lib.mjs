// Shared look for every generated SVG: colours, fonts, icons and small drawing helpers.
// Style references: dark.design (near-black pages, dot-grid texture, soft grey cards,
// monospace eyebrows, pill tags) and ui.live (gradient-ring buttons, bento cards).
import { readFileSync } from 'node:fs';

// Palette: "Manila Night Market" 60-30-10 combination from the vault
// (ui-ux/Harmonized 60-30-10 color combinations and OKLCH token architecture).
//   60% canvas  — midnight slate (dark) / white (light)
//   30% surface — elevated cards, chips and borders
//   10% accent  — amber gold, the only colour. Light mode uses a deeper amber for 5:1 contrast.
// `ok` is GitHub's green, used only to mean "live" or "available".
export const THEMES = {
  dark: {
    bg: '#0b0f17', card: '#0f1520', card2: '#151e2e', line: '#1f2a3c', lineHi: '#2c3a50',
    text: '#e6edf3', muted: '#8b949e', faint: '#5b6673', dot: '#172133',
    accent: '#f59e0b', accentSoft: '#f59e0b', ok: '#3fb950', onAccent: '#111827',
    mono: '#c9d1d9',
  },
  light: {
    bg: '#ffffff', card: '#fbfaf7', card2: '#f3f4f6', line: '#e2e6eb', lineHi: '#cfd5dd',
    text: '#111827', muted: '#59636e', faint: '#8c959f', dot: '#e7eaee',
    accent: '#b45309', accentSoft: '#d97706', ok: '#1a7f37', onAccent: '#ffffff',
    mono: '#374151',
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
  // Brand logos keep their real colours (owner preference, 2026-10-26). Black logos
  // (Next.js, Vercel, GitHub…) use the neutral text tone so they stay visible in dark mode.
  const b = ICONS.brands[slug];
  let fill = ['000000', '181717'].includes(b.hex) ? T.mono : `#${b.hex}`;
  // In dark mode, lift very dark brand colours (CSS purple, Framer blue…) toward white
  // until they reach 3:1 against the card, keeping their hue.
  if (T.bg !== '#ffffff') for (let k = 0; k < 10 && contrast(fill, T.card) < 3; k++) fill = mix(fill, '#ffffff', 0.15);
  return `<path transform="translate(${x} ${y}) scale(${size / 24})" d="${b.path}" fill="${fill}"/>`;
}

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => {
  const [r, g, b] = rgb(h).map((v) => v / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const mix = (a, b, t) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');

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
