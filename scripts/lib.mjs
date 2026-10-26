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

// =====================================================================================
// Colour system v3 (2026-10-26): every section, card and button gets its own curated
// 60-30-10 combination from the vault (ui-ux/Harmonized 60-30-10 color combinations and
// OKLCH token architecture), instead of one accent for the whole page.
//   - 60%: the combo's canvas tints the card, 30%: its surface tints chips and borders,
//     10%: its accent, plus an OKLCH gradient to a partner hue.
//   - Accents are adjusted per mode until text on the card passes 4.5:1, the same rule as
//     Tindero's resolveAccent (tindero-brains/admin/Tindero Theme colours).
// =====================================================================================
export const COMBOS = {
  tindero: { name: 'Tindero Classic', accent: '#2E7C83', partner: '#06B6D4', c60: '#0A1517', c30: '#12262A' },
  night: { name: 'Manila Night Market', accent: '#F59E0B', partner: '#F43F5E', c60: '#0B0F17', c30: '#151E2E' },
  batanes: { name: 'Batanes Breeze', accent: '#06B6D4', partner: '#6366F1', c60: '#0A161B', c30: '#14252D' },
  boracay: { name: 'Boracay Sunset', accent: '#F43F5E', partner: '#A855F7', c60: '#160F1A', c30: '#25182C' },
  cordillera: { name: 'Cordillera Forest', accent: '#10B981', partner: '#06B6D4', c60: '#0D1711', c30: '#18291F' },
  mayon: { name: 'Mayon Ember', accent: '#EF4444', partner: '#F59E0B', c60: '#121214', c30: '#202126' },
};

// --- OKLCH (Björn Ottosson's OKLab) for perceptual gradients without muddy midpoints.
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function hexToOklch(h) {
  const [r, g, b] = rgb(h).map((v) => toLin(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI];
}
function oklchToLin([L, C, H]) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
// Gamut-mapped: if a colour falls outside sRGB, chroma is lowered (hue and lightness kept)
// instead of clipping each channel, which is what shifts hues and makes gradients look muddy.
function oklchToHex([L, C, H]) {
  L = Math.min(0.99, Math.max(0.02, L));
  let c = C, out = oklchToLin([L, c, H]);
  for (let k = 0; k < 60 && out.some((v) => v < -0.0005 || v > 1.0005); k++) { c *= 0.95; out = oklchToLin([L, c, H]); }
  return '#' + out.map((v) => Math.round(Math.min(1, Math.max(0, toSrgb(v))) * 255).toString(16).padStart(2, '0')).join('');
}
// Gradient stops interpolated in OKLCH along the shorter hue arc, at the vault's eased
// positions (0, 40, 65, 100 %) so chroma stays high through the middle.
export function oklchStops(a, b, positions = [0, 0.4, 0.65, 1]) {
  const A = hexToOklch(a), B = hexToOklch(b);
  let dh = B[2] - A[2];
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return positions.map((t) => ({ offset: t, color: oklchToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + dh * t]) }));
}
export const mixHex = (a, b, t) => mix(a, b, t);

// Lighten (dark mode) or darken (light mode) a colour until it reaches `target` contrast.
// Steps lightness in OKLCH and keeps chroma, so a muted accent like Tindero teal stays teal
// instead of washing out to grey (mixing with white or black did that).
export function resolveAccent(c, bg, dark, target = 4.5) {
  const [L, C0, H] = hexToOklch(c);
  // On dark canvases a muted brand colour (Tindero teal) gets a small chroma floor so it reads alive.
  const C = dark ? Math.max(C0, 0.11) : C0;
  let out = dark && C !== C0 ? oklchToHex([L, C, H]) : c;
  for (let k = 1; k <= 40 && contrast(out, bg) < target; k++) out = oklchToHex([L + (dark ? 0.012 : -0.012) * k, C * (dark ? 1 + 0.01 * k : 1), H]);
  return out;
}

// Gradient rule (vault: OKLCH 60-30-10 note), v5:
//  - One hue family. The colour moves along the lightness arc, light -> deep, with eased stops
//    at 0/40/65/100 %. Lightness eases (fast at the start, slow at the end) instead of a
//    straight line, so the middle of the button holds its colour.
//  - Chroma peaks in the middle of the arc and is gamut-mapped, so no stop turns grey.
//  - A small natural hue drift (max 5 degrees): lighter stops lean warm, deeper stops lean cool,
//    the way real light falls on a surface. It never crosses into a second hue.
const EASE_STOPS = [0, 0.4, 0.65, 1];
const easeL = (t) => 1 - (1 - t) ** 1.6;
export function arcStops(hex, up = 0.09, down = 0.1) {
  const [L, C, H] = hexToOklch(hex);
  let toward = 85 - H; // lighter end leans toward warm yellow-orange
  if (toward > 180) toward -= 360;
  if (toward < -180) toward += 360;
  const drift = Math.sign(toward) * Math.min(5, Math.abs(toward) * 0.1);
  return EASE_STOPS.map((t) => ({
    offset: t,
    color: oklchToHex([L + up - (up + down) * easeL(t), C * (0.9 + 0.18 * Math.sin(Math.PI * t)), H + drift * (1 - 2 * t)]),
  }));
}

// A copy of the base theme T recoloured with one combination (60 canvas, 30 surface, 10 accent).
// Every drawing function reads T.card, T.accent and so on, so passing themed(T, key) recolours it.
export function themed(T, key) {
  const k = COMBOS[key];
  const dark = T.bg !== '#ffffff';
  const card = dark ? k.c60 : mix('#ffffff', k.accent, 0.035);
  const card2 = dark ? k.c30 : mix('#ffffff', k.accent, 0.085);
  const accent = resolveAccent(k.accent, card, dark);
  // Fills (buttons, badges) carry a label, so the arc is nudged lighter (dark mode, dark text) or
  // deeper (light mode, white text) until the label passes 4.5:1 at every stop.
  // The label colour on a filled button is whichever of near-black or white lets the gradient
  // stay closest to the real accent (amber takes dark text; deep red takes white), then the arc
  // is nudged until that label passes 4.5:1 at every stop.
  const fit = (onText) => {
    const base = dark ? accent : k.accent;
    let up = 0.07, down = 0.07, grad = arcStops(base, up, down), n = 0;
    const lighter = contrast(onText, '#ffffff') > 4.5; // dark label -> push lighter
    const worst = () => Math.min(...grad.map((st) => contrast(onText, st.color)));
    for (; n < 30 && worst() < 4.5; n++) {
      if (lighter) { up += 0.02; down -= 0.02; } else { up -= 0.02; down += 0.02; }
      grad = arcStops(base, up, down);
    }
    return { onText, grad, n: worst() < 4.5 ? 99 : n };
  };
  const pick = [fit('#111827'), fit('#ffffff')].sort((a, b) => a.n - b.n)[0];
  const { onText, grad } = pick;
  return {
    ...T, combo: key, card, card2,
    line: mix(card2, k.accent, dark ? 0.2 : 0.16), lineHi: mix(card2, k.accent, dark ? 0.34 : 0.28),
    dot: mix(card, k.accent, dark ? 0.1 : 0.08),
    // Quiet depth on big surfaces: the top of a card lifts toward its 30 % surface (dark) or the
    // faintest accent tint (light). Same hue as the card, so it reads as light, not as colour.
    cardTop: dark ? mix(card, k.c30, 0.75) : mix('#ffffff', k.accent, 0.075),
    accent, accent2: accent, accentSoft: accent,
    onAccent: onText,
    grad,
  };
}

// <linearGradient> from a themed T. Default direction: left → right.
// Default direction: top-left (light) to bottom-right (deep), one light source for the page.
export const gradDef = (id, T, x1 = 0, y1 = 0, x2 = 1, y2 = 0.6) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${T.grad.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('')}</linearGradient>`;
// A gradient for text/fills where the default palette (no combo) is passed: fall back to accent.
export const gradOf = (T) => T.grad || oklchStops(T.accent, T.accent);

// =====================================================================================
// Split mode: one image drawn twice — dark on the left of the page centre, light on the
// right — with each copy's CSS and ids scoped so they don't clash.
// =====================================================================================
function scopeCss(css, cls) {
  let out = '', i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) { out += css.slice(i); break; }
    const head = css.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    const body = css.slice(open + 1, j - 1);
    if (head.startsWith('@keyframes')) out += `${head}{${body}}`;
    else if (head.startsWith('@media')) out += `${head}{${scopeCss(body, cls)}}`;
    else out += head.split(',').map((s) => s.trim()).map((s) => (s === ':root' ? `.${cls}` : s.startsWith(':root') ? `.${cls}${s.slice(5)}` : `.${cls} ${s}`)).join(',') + `{${body}}`;
    i = j;
  }
  return out;
}
function scopeSvg(inner, p) {
  return inner
    .replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => `<style>${scopeCss(css, `th-${p}`)}</style>`)
    .replace(/\bid="([^"]+)"/g, `id="${p}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${p}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${p}-$1"`)
    .replace(/aria-labelledby="[^"]*"/g, '');
}
// frac: where the page centre falls across this image (0..1). <=0 → all light, >=1 → all dark.
export function splitSvg(darkSvg, lightSvg, frac = 0.5) {
  if (frac >= 1) return darkSvg;
  if (frac <= 0) return lightSvg;
  const root = darkSvg.match(/<svg[^>]*>/)[0];
  const [, , W, H] = root.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const inner = (s) => s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const head = inner(darkSvg).match(/^\s*<title[\s\S]*?<\/desc>/)?.[0] || '';
  const strip = (s) => inner(s).replace(/<title[\s\S]*?<\/title>/, '').replace(/<desc[\s\S]*?<\/desc>/, '');
  const x = W * frac;
  return `${root.replace(/aria-labelledby="[^"]*"/, 'aria-labelledby="t d"')}${head}
<defs><clipPath id="split-d"><rect x="0" y="0" width="${x}" height="${H}"/></clipPath><clipPath id="split-l"><rect x="${x}" y="0" width="${W - x}" height="${H}"/></clipPath>
<linearGradient id="seam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#94a3b8" stop-opacity="0"/><stop offset=".5" stop-color="#94a3b8" stop-opacity=".6"/><stop offset="1" stop-color="#94a3b8" stop-opacity="0"/></linearGradient></defs>
<g clip-path="url(#split-d)"><g class="th-d">${scopeSvg(strip(darkSvg), 'd')}</g></g>
<g clip-path="url(#split-l)"><g class="th-l">${scopeSvg(strip(lightSvg), 'l')}</g></g>
<rect x="${x - 0.75}" y="0" width="1.5" height="${H}" fill="url(#seam)"/>
</svg>`;
}
