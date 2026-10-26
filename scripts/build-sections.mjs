// Builds every README block as animated SVG, in a desktop (1200 wide) and a phone (480 wide)
// layout, each in dark and light. Run: node scripts/build-sections.mjs  (no dependencies)
// Output: assets/<block>-<dark|light>.svg and assets/<block>-m-<dark|light>.svg
//
// Colour rules (vault: ui-ux/Harmonized 60-30-10 color combinations and OKLCH token architecture):
//  - Each SECTION uses exactly ONE combination (its 60 % canvas, 30 % surface, 10 % accent),
//    for every card, tile, badge and button inside it. Colours never mix inside a section.
//    Intro + Contact: Manila Night Market · About: Batanes Breeze · Stack: Boracay Sunset ·
//    Projects (Tindero included): Tindero Classic · Activity: Cordillera Forest.
//  - Brand logos and social tiles keep their official colours: that is identity, not decoration.
//  - Gradients stay in one hue (OKLCH lightness arc, stops 0/40/65/100 %) and only fill
//    buttons, badges, bars and hairlines. Text is always a solid colour. No glows.
//  - Accents and button labels pass 4.5:1 in both modes (themed() in lib.mjs).
// Motion rules (prompt-motion.com): one idea per element, ease-out, seamless loops, and a
// still readable frame for reduced motion.

import { mkdirSync, writeFileSync } from 'node:fs';
import { THEMES, SANS, MONO, EASE, ICONS, esc, wrap, textW, brand, lucide, dotGrid, reducedMotion, themed, gradDef } from './lib.mjs';

const open = (w, h, title, desc, T) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d"><title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc><rect width="${w}" height="${h}" fill="${T.bg}"/>`;

// Vertical canvas: top lifted toward the surface colour, settling into the 60 % canvas.
const canvasDef = (id, T) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.cardTop}"/><stop offset=".55" stop-color="${T.card}"/><stop offset="1" stop-color="${T.card}"/></linearGradient>`;
// A rounded card in its combination: canvas fill, faint dot grid, border, accent hairline on top.
function cardBox(id, x, y, w, h, r, T, { top = true } = {}) {
  return `<defs>${dotGrid(`dots-${id}`, T, 20)}${gradDef(`g-${id}`, T)}${canvasDef(`cv-${id}`, T)}<clipPath id="c-${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath></defs>
<g clip-path="url(#c-${id})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#cv-${id})"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#dots-${id})"/>${top ? `<rect x="${x}" y="${y}" width="${w}" height="3" fill="url(#g-${id})"/>` : ''}</g>
<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${r}" fill="none" stroke="${T.line}"/>`;
}
const pill = (x, y, label, T, { mono = true, size = 14, h = 30 } = {}) => {
  const w = textW(label, size, mono) + 24;
  return { w, svg: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${T.card2}" stroke="${T.line}"/><text x="${x + w / 2}" y="${y + h / 2 + size * 0.36}" text-anchor="middle" font-family="${mono ? MONO : SANS}" font-size="${size}" fill="${T.text}">${esc(label)}</text>` };
};
const chips = (list, x, y, maxX, T, size = 14) => {
  let cx = x, out = '';
  for (const s of list) { const p = pill(cx, y, s, T, { size }); if (cx + p.w > maxX) break; out += p.svg; cx += p.w + 8; }
  return out;
};
const statusPill = (x, y, label, live, T, size = 14) => {
  const w = textW(label, size, true) + 44, c = live ? T.ok : T.accent;
  return `<rect x="${x}" y="${y}" width="${w}" height="32" rx="16" fill="${T.card2}" stroke="${T.line}"/>
<circle cx="${x + 17}" cy="${y + 16}" r="4.5" fill="${c}" class="ring" style="transform-origin:${x + 17}px ${y + 16}px"/><circle cx="${x + 17}" cy="${y + 16}" r="4.5" fill="${c}" class="pulse"/>
<text x="${x + 30}" y="${y + 21}" font-family="${MONO}" font-size="${size}" font-weight="600" fill="${T.text}">${esc(label)}</text>`;
};
const badge = (x, y, w, h, label, T, id, size = 15) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(10, h / 2)}" fill="url(#${id})"/><text x="${x + w / 2}" y="${y + h / 2 + size * 0.36}" text-anchor="middle" font-family="${MONO}" font-size="${size}" font-weight="700" fill="${T.onAccent}">${esc(label)}</text>`;
const BASE_CSS = `.pulse{animation:pulse 2s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.ring{animation:ring 2.2s ease-out infinite}@keyframes ring{0%{transform:scale(.6);opacity:.7}100%{transform:scale(2.3);opacity:0}}
.rise{opacity:0;animation:rise .9s ${EASE} forwards}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.nudge{animation:nudge 2.6s ${EASE} infinite}@keyframes nudge{0%,60%,100%{transform:none}75%{transform:translate(3px,-3px)}}
.float{animation:float 8s ease-in-out infinite}@keyframes float{0%,100%{transform:none}50%{transform:translateY(-6px)}}
${reducedMotion('.rise{opacity:1}.ring{opacity:0}')}`;

// One combination per section (see the colour rules at the top).
const C = { intro: 'night', about: 'batanes', stack: 'boracay', projects: 'tindero', activity: 'cordillera', contact: 'night' };

// ===================================================================== HERO (Manila Night Market)
const PHRASES = ['full-stack products', 'AI-powered tools', 'accessible learning apps', 'apps for Filipino users'];
function hero(B, m) {
  const T = themed(B, C.intro);
  const W = m ? 480 : 1200, H = m ? 560 : 420;
  const cx = m ? 360 : 930, cy = m ? 120 : 210, k = m ? 0.55 : 1;
  let seed = 7; const r = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const stars = Array.from({ length: m ? 40 : 80 }, () => `<circle cx="${(r() * W).toFixed(1)}" cy="${(r() * H).toFixed(1)}" r="${(r() * 1.1 + 0.5).toFixed(2)}" fill="${T.lineHi}" class="tw" style="animation-duration:${(r() * 4 + 3).toFixed(1)}s;animation-delay:${(-r() * 6).toFixed(1)}s"/>`).join('');
  // Planets are shades of the one accent (its gradient stops), light inside to deep outside.
  const orbit = [[0, 62, 3.2, 14, -35], [1, 98, 4.2, 22, 130], [2, 134, 3.6, 32, 245], [3, 170, 4.6, 46, 50]]
    .map(([c, rad, s, t, a]) => `<circle cx="${cx}" cy="${cy}" r="${rad * k}" fill="none" stroke="${T.line}" stroke-dasharray="3 7"/><g transform="rotate(${a} ${cx} ${cy})"><g class="spin" style="animation-duration:${t}s;transform-origin:${cx}px ${cy}px"><circle cx="${cx + rad * k}" cy="${cy}" r="${s * 2 * Math.max(k, 0.7)}" fill="${T.grad[c].color}"/></g></g>`).join('');
  const PH = 3, cycle = PHRASES.length * PH, pct = (s) => ((s / cycle) * 100).toFixed(2);
  const phrases = PHRASES.map((p, i) => `<text x="0" y="0" class="ph" fill="${T.accent}" style="animation-delay:${1.4 + i * PH}s">${esc(p)}</text>`).join('');
  const name = m ? [['Joshua', 0, 250], ['Manuel', 0, 316], ['Camacho', 0, 382]] : [['Joshua', 64, 190], ['Manuel', 314, 190], ['Camacho', 64, 258]];
  return `${open(W, H, 'Joshua Manuel Camacho', 'Full-stack engineer and aspiring AI engineer from the Philippines. I build full-stack products, AI-powered tools, accessible learning apps and apps for Filipino users.', B)}
<style>
  .tw{animation:tw ease-in-out infinite alternate}@keyframes tw{from{opacity:.15}to{opacity:.8}}
  .spin{animation:spin linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
  .w{font:700 ${m ? 60 : 64}px ${SANS};letter-spacing:-1.5px;opacity:0;animation:rise .9s ${EASE} forwards}
  .ph{font:600 ${m ? 26 : 28}px ${SANS};opacity:0;animation:swap ${cycle}s ${EASE} infinite backwards}
  @keyframes swap{0%{opacity:0;transform:translateY(14px)}${pct(0.5)}%{opacity:1;transform:none}${pct(PH - 0.4)}%{opacity:1;transform:none}${pct(PH)}%{opacity:0;transform:translateY(-14px)}100%{opacity:0}}
  ${BASE_CSS}
  @media (prefers-reduced-motion: reduce){.w,.ph:first-child{opacity:1}}
</style>
${cardBox('hero', 0, 0, W, H, 20, T)}
${stars}
<g class="rise" style="animation-delay:.2s">${orbit}<circle cx="${cx}" cy="${cy}" r="${30 * k}" fill="none" stroke="${T.accent}" stroke-opacity=".5"/><circle cx="${cx}" cy="${cy}" r="${18 * k}" fill="url(#g-hero)"/></g>
<g class="rise" style="animation-delay:.1s"><circle cx="${m ? 40 : 72}" cy="${m ? 192 : 104}" r="5" fill="${T.ok}" class="pulse"/><text x="${m ? 56 : 88}" y="${m ? 198 : 110}" font-family="${MONO}" font-size="${m ? 18 : 17}" fill="${T.muted}">hello, I'm</text></g>
${name.map(([t, x, y], i) => `<text x="${m ? 40 : x}" y="${y}" class="w" fill="${T.text}" style="animation-delay:${0.25 + i * 0.12}s">${t}</text>`).join('')}
<g transform="translate(${m ? 40 : 64} ${m ? 448 : 330})"><text x="0" y="0" font-family="${SANS}" font-size="${m ? 26 : 28}" fill="${T.muted}" class="rise" style="animation-delay:.8s">I build</text><g transform="translate(${m ? 0 : 104} ${m ? 38 : 0})">${phrases}</g></g>
<text x="${m ? 40 : 64}" y="${m ? 528 : 380}" font-family="${MONO}" font-size="${m ? 15 : 16}" fill="${T.muted}" class="rise" style="animation-delay:1.1s">${m ? 'Full-Stack · AI Engineer · Philippines' : 'Full-Stack Engineer  ·  Aspiring AI Engineer  ·  Philippines'}</text>
</svg>`;
}

// ===================================================================== SWITCHER & NAV
const SWITCH = [
  { id: 'auto', label: 'Auto', icon: 'sun-moon', combo: C.intro },
  { id: 'dark', label: 'Dark', icon: 'moon', combo: C.intro },
  { id: 'split', label: 'Split', icon: 'contrast', combo: C.intro },
  { id: 'light', label: 'Light', icon: 'sun', combo: C.intro },
];
function switchPill(o, on, B, m) {
  const T = themed(B, o.combo);
  const W = m ? 44 : 132, H = m ? 44 : 42, fg = on ? T.onAccent : T.text;
  const shape = m ? `<circle cx="22" cy="22" r="21.25" fill="${on ? 'url(#g)' : T.card}" stroke="${on ? 'none' : T.lineHi}" stroke-width="1.5"/>`
    : `<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="${H / 2}" fill="${on ? 'url(#g)' : T.card}" stroke="${on ? 'none' : T.lineHi}" stroke-width="1.5"/>`;
  return `${open(W, H, `${o.label} theme`, on ? `${o.label} theme, currently shown` : `Switch to the ${o.label.toLowerCase()} theme`, B)}
<defs>${gradDef('g', T, 0, 0, 1, 1)}</defs>${shape}
${m ? lucide(o.icon, 13, 13, 18, on ? fg : T.accent, 2) : `${lucide(o.icon, 20, H / 2 - 9, 18, on ? fg : T.accent, 2)}<text x="48" y="${H / 2 + 5.5}" font-family="${SANS}" font-size="15" font-weight="650" fill="${fg}">${esc(o.label)}</text>${on ? `<circle cx="${W - 20}" cy="${H / 2}" r="4" fill="${fg}"/>` : ''}`}
</svg>`;
}
export const SECTIONS = [
  { id: 'about', combo: C.about, n: '01', label: 'About', title: 'About me', note: 'What I build and how I work' },
  { id: 'stack', combo: C.stack, n: '02', label: 'Stack', title: 'Tech stack', note: 'Tools I ship with' },
  { id: 'projects', combo: C.projects, n: '03', label: 'Projects', title: 'Featured projects', note: 'Selected work · tap a card' },
  { id: 'activity', combo: C.activity, n: '04', label: 'Activity', title: 'GitHub activity', note: 'Rebuilt from live data every 12 hours' },
  { id: 'contact', combo: C.contact, n: '05', label: 'Contact', title: 'Let’s work together', note: 'Open to roles and collaborations' },
];
function nav(s, B, m) {
  const T = themed(B, C.intro);
  const W = m ? 46 : 150, H = 46;
  return `${open(W, H, s.label, `Jump to ${s.label}`, B)}
<defs>${gradDef('g', T, 0, 0, 1, 1)}</defs>
${m ? `<circle cx="23" cy="23" r="22.25" fill="url(#g)"/><text x="23" y="28" text-anchor="middle" font-family="${MONO}" font-size="14" font-weight="700" fill="${T.onAccent}">${s.n}</text>`
    : `<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="${H / 2}" fill="${T.card}" stroke="${T.lineHi}" stroke-width="1.5"/>
${badge(8, 9, 32, 28, s.n, T, 'g', 12.5)}
<text x="50" y="${H / 2 + 6}" font-family="${SANS}" font-size="16" font-weight="600" fill="${T.text}">${esc(s.label)}</text>
<path d="M${W - 26} ${H / 2 - 4}l4 4 4-4" stroke="${T.accent}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`}
</svg>`;
}
function header(s, B, m) {
  const T = themed(B, s.combo);
  const W = m ? 480 : 1200, H = m ? 78 : 92;
  return `${open(W, H, `${s.n} ${s.title}`, s.note, B)}
<defs>${gradDef('g', T)}</defs>
<style>.seg{animation:seg 1.2s ${EASE} .2s backwards;transform-origin:0 0}@keyframes seg{from{transform:scaleX(0)}}${BASE_CSS}</style>
<g class="rise">${badge(0, m ? 18 : 26, m ? 40 : 42, m ? 32 : 34, s.n, T, 'g', 15)}
<text x="${m ? 54 : 58}" y="${m ? 45 : 54}" font-family="${SANS}" font-size="${m ? 28 : 34}" font-weight="700" letter-spacing="-.6" fill="${T.text}">${esc(s.title)}</text>
${m ? '' : `<text x="${W}" y="52" text-anchor="end" font-family="${MONO}" font-size="14" fill="${T.muted}">${esc(s.note)}</text>`}</g>
<rect x="0" y="${H - 13}" width="${W}" height="1.5" fill="${T.line}"/>
<rect x="0" y="${H - 14}" width="${m ? 120 : 160}" height="3" rx="1.5" fill="url(#g)" class="seg"/>
</svg>`;
}

// ===================================================================== ABOUT
const ABOUT = [
  { eyebrow: 'FLAGSHIP · LIVE', title: 'Tindero', body: 'Shop, eat, sell and send in one Filipino app, live on desktop and mobile.', icon: 'store' },
  { eyebrow: 'EXPLORING', title: 'Private, local AI', body: 'Local LLMs with Ollama, retrieval (RAG) and AI features that respect user data.', icon: 'bot' },
  { eyebrow: 'I CARE ABOUT', title: 'Secure by default', body: 'Row-level security, server-side checks, accessibility and tests.', icon: 'key-round' },
  { eyebrow: 'OPEN TO', title: 'Roles & collabs', body: 'Full-stack and AI engineering roles, and collaborations.', icon: 'sparkles' },
];
function aboutTile(a, i, t, B, m) {
  const T = themed(B, C.about), big = i === 0, pad = m ? 26 : 28;
  const titleSize = big ? 40 : m ? 28 : 26, bodySize = m ? 19 : big ? 20 : 17;
  const lines = wrap(a.body, bodySize, t.w - pad * 2 - (m ? 0 : i === 1 ? 150 : 0));
  const iconRight = !big || m;
  const yE = big && !m ? 92 : 22, yT = big && !m ? 138 : 22 + titleSize + 18, yB = yT + bodySize + 16;
  let extra = '';
  if (big) {
    const items = [['store', 'Shop'], ['utensils', 'Eat'], ['tag', 'Sell'], ['package', 'Send']];
    const cw = m ? (t.w - pad * 2 - 30) / 4 : 86, y = t.y + t.h - (m ? 96 : 108);
    extra = items.map(([ic, l], k) => { const x = t.x + pad + k * (cw + 10); return `<rect x="${x}" y="${y}" width="${cw}" height="40" rx="12" fill="${T.card2}" stroke="${T.line}"/><rect x="${x}" y="${y}" width="${cw}" height="40" rx="12" fill="url(#g-a${i})" fill-opacity=".3" class="svc" style="animation-delay:${k * 1.2}s"/>${lucide(ic, x + 12, y + 11, 18, T.text)}<text x="${x + 37}" y="${y + 25}" font-family="${MONO}" font-size="14" fill="${T.text}">${l}</text>`; }).join('')
      + `<circle cx="${t.x + pad + 6}" cy="${y + 66}" r="4.5" fill="${T.ok}" class="pulse"/><text x="${t.x + pad + 18}" y="${y + 71}" font-family="${MONO}" font-size="14" fill="${T.muted}">tinderoph.vercel.app</text>`;
  }
  if (i === 3) extra = `<g transform="translate(${t.x + pad} ${t.y + t.h - 56})"><rect width="124" height="30" rx="15" fill="${T.card2}" stroke="${T.line}"/><circle cx="18" cy="15" r="4.5" fill="${T.ok}" class="pulse"/><text x="30" y="20" font-family="${MONO}" font-size="13" fill="${T.text}">available</text></g>`;
  if (i === 1 && !m) { const x = t.x + t.w - 198, y = t.y + 28; extra = `<rect x="${x}" y="${y}" width="96" height="40" rx="16" fill="${T.card2}" stroke="${T.line}"/>${[0, 1, 2].map((k) => `<circle cx="${x + 30 + k * 18}" cy="${y + 20}" r="4.5" fill="${T.accent}" class="dotty" style="animation-delay:${k * 0.18}s"/>`).join('')}`; }
  return `<g class="rise" style="animation-delay:${0.15 + i * 0.1}s">${cardBox(`a${i}`, t.x, t.y, t.w, t.h, 22, T)}
<g transform="translate(${iconRight ? t.x + t.w - pad - 44 : t.x + pad} ${t.y + pad})"><rect width="44" height="44" rx="12" fill="url(#g-a${i})"/>${lucide(a.icon, 10, 10, 24, T.onAccent)}</g>
<g transform="translate(${t.x + pad} ${t.y + pad})"><text x="0" y="${yE}" font-family="${MONO}" font-size="13" font-weight="600" letter-spacing="2.2" fill="${T.accent}">${a.eyebrow}</text>
<text x="0" y="${yT}" font-family="${SANS}" font-size="${titleSize}" font-weight="700" letter-spacing="-.6" fill="${T.text}">${esc(a.title)}</text>
${lines.map((l, j) => `<text x="0" y="${yB + j * (bodySize + 10)}" font-family="${SANS}" font-size="${bodySize}" fill="${T.muted}">${esc(l)}</text>`).join('')}</g>${extra}</g>`;
}
function about(B, m) {
  const G = 14;
  let tiles, W, H;
  if (m) { W = 480; const hs = [330, 200, 190, 240]; let y = 0; tiles = hs.map((h) => { const t = { x: 0, y, w: W, h }; y += h + G; return t; }); H = y - G; }
  else { W = 1200; H = 430; tiles = [{ x: 0, y: 0, w: 440, h: H }, { x: 456, y: 0, w: 744, h: 196 }, { x: 456, y: 210, w: 365, h: 220 }, { x: 835, y: 210, w: 365, h: 220 }]; }
  return `${open(W, H, 'About me', ABOUT.map((a) => `${a.eyebrow}: ${a.title}. ${a.body}`).join(' '), B)}
<style>${BASE_CSS}.svc{opacity:0;animation:svc 4.8s ease-in-out infinite}@keyframes svc{0%,100%{opacity:0}8%,22%{opacity:1}32%{opacity:0}}
.dotty{animation:dotty 1.3s ease-in-out infinite}@keyframes dotty{0%,100%{opacity:.25}50%{opacity:1}}@media (prefers-reduced-motion: reduce){.svc{opacity:0}}</style>
${ABOUT.map((a, i) => aboutTile(a, i, tiles[i], B, m)).join('')}
</svg>`;
}

// ===================================================================== STACK
const STACK = [
  { label: 'Frontend', items: ['typescript', 'javascript', 'react', 'nextdotjs', 'vite', 'tailwindcss', 'threedotjs', 'framer', 'html5', 'css'] },
  { label: 'Backend & data', items: ['nodedotjs', 'supabase', 'postgresql', 'zod', { name: 'WebAuthn', icon: 'key-round' }, { name: 'Row-level security', icon: 'database' }] },
  { label: 'Mobile & ship', items: ['capacitor', 'vercel', 'netlify', 'githubactions', 'git', 'github'] },
  { label: 'AI & quality', items: ['ollama', 'googlegemini', { name: 'RAG / embeddings', icon: 'sparkles' }, 'vitest', 'figma'] },
];
const NICE = { nextdotjs: 'Next.js', threedotjs: 'Three.js', nodedotjs: 'Node.js', googlegemini: 'Gemini API', framer: 'Framer Motion', css: 'CSS', githubactions: 'GitHub Actions', html5: 'HTML5', postgresql: 'PostgreSQL', tailwindcss: 'Tailwind CSS' };
const nameOf = (it) => (typeof it === 'string' ? NICE[it] || ICONS.brands[it].title : it.name);
function stack(B, m) {
  const W = m ? 480 : 1200, fs = m ? 18 : 16, ph = m ? 50 : 48;
  const rowH = m ? 128 : 74, H = STACK.length * rowH + (m ? 0 : 10);
  const label = m ? 0 : 200, view = W - label - (m ? 0 : 20);
  let defs = '', css = '';
  const rows = STACK.map((r, i) => {
    const T = themed(B, C.stack), y = 12 + i * rowH;
    defs += gradDef(`sg${i}`, T);
    let set = [], x = 0;
    while (x < view + 60) for (const it of r.items) {
      const n = nameOf(it), w = 56 + textW(n, fs);
      const icon = typeof it === 'string' ? brand(it, x + 16, (ph - 22) / 2, 22, T) : lucide(it.icon, x + 16, (ph - 22) / 2, 22, T.accent);
      set.push(`<rect x="${x}" y="0" width="${w}" height="${ph}" rx="${ph / 2}" fill="${T.card2}" stroke="${T.line}"/>${icon}<text x="${x + 46}" y="${ph / 2 + fs * 0.36}" font-family="${SANS}" font-size="${fs}" fill="${T.text}">${esc(n)}</text>`);
      x += w + 12;
    }
    const setW = x, dur = (setW / (m ? 30 : 38)).toFixed(1), left = i % 2 === 0;
    css += `@keyframes r${i}{from{transform:translateX(${left ? 0 : -setW}px)}to{transform:translateX(${left ? -setW : 0}px)}}.r${i}{animation:r${i} ${dur}s linear infinite}`;
    const lw = textW(r.label.toUpperCase(), 13, true) + 34;
    const band = m ? `<rect x="0" y="${y - 6}" width="${W}" height="${rowH - 14}" rx="22" fill="${T.card}" stroke="${T.line}"/>` : `<rect x="0" y="${y - 6}" width="${W}" height="60" rx="30" fill="${T.card}" stroke="${T.line}"/>`;
    const lab = m ? badge(14, y + 6, lw, 28, r.label.toUpperCase(), T, `sg${i}`, 13) : badge(10, y + 9, lw, 30, r.label.toUpperCase(), T, `sg${i}`, 13);
    const ty = m ? y + 46 : y;
    return `${band}${lab}<g clip-path="url(#v${i})" mask="url(#f${i})"><g transform="translate(${m ? 10 : label} ${ty})"><g class="r${i}">${set.join('')}<g transform="translate(${setW} 0)">${set.join('')}</g></g></g></g>`;
  }).join('');
  const clips = STACK.map((_, i) => {
    const y = 12 + i * rowH, ty = m ? y + 46 : y, x0 = m ? 10 : label, vw = m ? W - 20 : view;
    return `<clipPath id="v${i}"><rect x="${x0}" y="${ty - 2}" width="${vw}" height="${ph + 4}"/></clipPath><mask id="f${i}" maskUnits="userSpaceOnUse" x="${x0}" y="${ty - 2}" width="${vw}" height="${ph + 4}"><rect x="${x0}" y="${ty - 2}" width="${vw}" height="${ph + 4}" fill="url(#fade)"/></mask>`;
  }).join('');
  return `${open(W, H, 'Tech stack', STACK.map((r) => `${r.label}: ${r.items.map(nameOf).join(', ')}`).join('. '), B)}
<defs>${defs}<linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="#000"/><stop offset=".07" stop-color="#fff"/><stop offset=".93" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>${clips}</defs>
<style>${css}${reducedMotion()}</style>
${rows}
</svg>`;
}

// ===================================================================== PROJECTS
export const PROJECTS = [
  { id: 'kamayo', n: '02', kind: 'EDTECH · ACCESSIBILITY', title: 'Kamayo', icon: 'hand',
    body: 'Interactive Filipino Sign Language learning system with a 100-level path. Server-checked progress, row-level security on every record, and tested database rules.',
    stack: ['React 19', 'TypeScript', 'Vite', 'Supabase', 'Vitest'], status: 'In development', live: false, cta: null },
  { id: 'pandeloot', n: '03', kind: 'E-COMMERCE · AI', title: 'PandeLoot', icon: 'croissant',
    body: 'A daily “loot drop” storefront for Filipino bakery treats, with Gemini-powered features, Google sign-in and live drops.',
    stack: ['Next.js', 'TypeScript', 'Supabase', 'Gemini API'], status: 'Deployed on Vercel', live: true, cta: 'View repo' },
  { id: 'anna', n: '04', kind: 'LOCAL AI · PRIVACY', title: 'Anna', icon: 'bot',
    body: 'A private AI companion that runs entirely on your PC through Ollama. Indexes only approved folders, remembers only what you allow, and suggests instead of editing.',
    stack: ['Node.js', 'Ollama', 'RAG', 'Tailscale'], status: 'Runs 100% locally', live: false, cta: null },
  { id: 'viewer', n: '05', kind: 'DEVELOPER TOOL', title: 'GitHub Profile Viewer', icon: 'search',
    body: 'Search any GitHub user for live stats, a contribution heatmap with snake animation, top repositories and a language breakdown.',
    stack: ['React', 'Vite', 'Tailwind CSS', 'GitHub API'], status: 'Live', live: true, cta: 'Open live demo' },
  { id: 'portfolio', n: '06', kind: '3D · CREATIVE', title: 'SCHNEIZEL.DEV', icon: 'orbit',
    body: 'My portfolio as a 3D solar system: each project is a planet you can fly to, built with React Three Fiber.',
    stack: ['Next.js', 'React Three Fiber', 'Three.js', 'Zustand'], status: 'Portfolio', live: false, cta: 'View repo' },
];
function card(p, B, m) {
  const T = themed(B, C.projects);
  const W = m ? 480 : 1200, pad = m ? 28 : 40;
  const lines = wrap(p.body, 19, m ? W - pad * 2 : 760).slice(0, m ? 5 : 3);
  const yTitle = pad + (m ? 66 : 62), yBody = yTitle + 40;
  const H = m ? yBody + lines.length * 29 + 120 : Math.max(300, yBody + lines.length * 29 + 116);
  const yChips = yBody + lines.length * 29 + (m ? 8 : 10), yStatus = H - (m ? 56 : 58);
  const wm = m ? lucide(p.icon, W - 104, 22, 76, T.lineHi, 1.4) : lucide(p.icon, W - 230, 44, 170, T.lineHi, 1.3);
  const ctaW = p.cta ? textW(p.cta, 16) + 64 : 0;
  return `${open(W, H, `${p.title} — ${p.kind.toLowerCase()}`, `${p.body} Built with ${p.stack.join(', ')}. Status: ${p.status}.`, B)}
<style>${BASE_CSS}</style>
${cardBox('k', 0, 0, W, H, 24, T)}
<g class="float">${wm}</g>
<text x="${pad}" y="${pad + 14}" font-family="${MONO}" font-size="13" font-weight="600" letter-spacing="2" fill="${T.muted}">${p.n}</text>
<text x="${pad + 34}" y="${pad + 14}" font-family="${MONO}" font-size="13" font-weight="600" letter-spacing="2" fill="${T.accent}">${esc(p.kind)}</text>
<text x="${pad}" y="${yTitle}" font-family="${SANS}" font-size="${m ? 34 : 38}" font-weight="700" letter-spacing="-.8" fill="${T.text}">${esc(p.title)}</text>
${lines.map((l, j) => `<text x="${pad}" y="${yBody + j * 29}" font-family="${SANS}" font-size="19" fill="${T.muted}">${esc(l)}</text>`).join('')}
${chips(p.stack, pad, yChips, W - pad, T, m ? 15 : 14)}
${statusPill(pad, yStatus, p.status, p.live, T, m ? 15 : 14)}
${p.cta ? `<rect x="${W - pad - ctaW}" y="${yStatus - 4}" width="${ctaW}" height="40" rx="20" fill="url(#g-k)"/><text x="${W - pad - ctaW + 20}" y="${yStatus + 21}" font-family="${SANS}" font-size="16" font-weight="650" fill="${T.onAccent}">${esc(p.cta)}</text><g class="nudge">${lucide('arrow-up-right', W - pad - 34, yStatus + 7, 18, T.onAccent, 2.4)}</g>` : ''}
</svg>`;
}

// ===================================================================== TINDERO FEATURE + FOOTER SLICES
const TINDERO = { body: 'Verified sellers, food ordering, a pre-loved marketplace and parcel sending in one app, with role-based access, passkey sign-in and ID checks.', stack: ['TypeScript', 'React', 'Next.js', 'Supabase', 'Capacitor', 'WebAuthn'], status: 'Live on desktop and mobile' };
function topShape(W, H, r) {
  return { fill: `M0 ${H}V${r}A${r} ${r} 0 0 1 ${r} 0H${W - r}A${r} ${r} 0 0 1 ${W} ${r}V${H}Z`, edge: `M.5 ${H}V${r}A${r - 0.5} ${r - 0.5} 0 0 1 ${r} .5H${W - r}A${r - 0.5} ${r - 0.5} 0 0 1 ${W - 0.5} ${r}V${H}` };
}
function footShape(W, H, r, first, last) {
  const rl = first ? r : 0, rr = last ? r : 0;
  return {
    fill: `M0 0H${W}V${H - rr}${rr ? `A${rr} ${rr} 0 0 1 ${W - rr} ${H}` : ''}H${rl}${rl ? `A${rl} ${rl} 0 0 1 0 ${H - rl}` : 'H0'}Z`,
    edge: `${last ? `M${W - 0.5} 0V${H - rr}${rr ? `A${rr - 0.5} ${rr - 0.5} 0 0 1 ${W - rr} ${H - 0.5}` : ''}` : `M${W} ${H - 0.5}`}H${rl}${first ? (rl ? `A${rl - 0.5} ${rl - 0.5} 0 0 1 .5 ${H - rl}V0` : 'V0') : ''}`,
  };
}
const topCard = (W, H, r, T) => { const t = topShape(W, H, r); return `<defs>${dotGrid('dt', T, 20)}${gradDef('gt', T)}${canvasDef('cvt', T)}<clipPath id="tc"><path d="${t.fill}"/></clipPath></defs><path d="${t.fill}" fill="url(#cvt)"/><path d="${t.fill}" fill="url(#dt)"/><rect width="${W}" height="3" fill="url(#gt)" clip-path="url(#tc)"/><path d="${t.edge}" fill="none" stroke="${T.line}"/>`; };
function screen(x, y, w, h, cols, s, T, cid) {
  const g = 10 * s, tw = (w - g * (cols + 1)) / cols, th = tw * 1.05;
  let tiles = '';
  for (let r = 0; r < 3; r++) for (let k = 0; k < cols; k++) {
    const tx = x + g + k * (tw + g), ty = y + 64 * s + r * (th + g);
    if (ty + th > y + h) continue;
    tiles += `<g class="tile" style="animation-delay:${(r * cols + k) * 0.25}s"><rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${6 * s}" fill="${T.card2}"/><rect x="${tx}" y="${ty}" width="${tw}" height="${th * 0.62}" rx="${6 * s}" fill="${(r + k) % 3 === 0 ? T.accent : T.lineHi}" fill-opacity="${(r + k) % 3 === 0 ? 0.35 : 0.6}"/><rect x="${tx + 6 * s}" y="${ty + th * 0.7}" width="${tw * 0.6}" height="${5 * s}" rx="${2.5 * s}" fill="${T.muted}" fill-opacity=".5"/><rect x="${tx + 6 * s}" y="${ty + th * 0.84}" width="${tw * 0.35}" height="${5 * s}" rx="${2.5 * s}" fill="${T.accent}"/></g>`;
  }
  return `<clipPath id="${cid}"><rect x="${x}" y="${y + 60 * s}" width="${w}" height="${h - 60 * s}"/></clipPath>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T.bg}"/><rect x="${x}" y="${y}" width="${w}" height="${26 * s}" fill="${T.card2}"/><rect x="${x + g}" y="${y + 8 * s}" width="${30 * s}" height="${10 * s}" rx="${3 * s}" fill="${T.accent}"/>
<rect x="${x + g}" y="${y + 34 * s}" width="${w - g * 2}" height="${20 * s}" rx="${10 * s}" fill="${T.card2}" stroke="${T.line}"/><g clip-path="url(#${cid})"><g class="scroll">${tiles}</g></g>`;
}
function feature(B, m) {
  const T = themed(B, C.projects);
  const W = m ? 480 : 1200, pad = m ? 28 : 44;
  const lines = wrap(TINDERO.body, 19, m ? W - pad * 2 : 580).slice(0, m ? 5 : 3);
  const yBody = pad + (m ? 160 : 140), yChips = yBody + lines.length * 28 + (m ? 4 : 18);
  const yStatus = yChips + (m ? 2 : 1) * 40 + 6;
  const H = m ? yStatus + 52 + 300 : 380;
  const dx = m ? 34 : 690, dy = m ? yStatus + 76 : 58, dw = m ? 300 : 420, dh = m ? 200 : 262;
  const px = m ? 330 : 1040, py = m ? yStatus + 98 : 110, pw = m ? 112 : 118, ph = m ? 200 : 236;
  const chipSvg = m ? chips(TINDERO.stack.slice(0, 3), pad, yChips, W - pad, T, 15) + chips(TINDERO.stack.slice(3), pad, yChips + 40, W - pad, T, 15) : chips(TINDERO.stack, pad, yChips, 660, T, 14);
  return `${open(W, H, 'Tindero — flagship project', `${TINDERO.body} ${TINDERO.status} at tinderoph.vercel.app.`, B)}
<style>${BASE_CSS}.tile{animation:tile 9s ${EASE} infinite backwards}@keyframes tile{0%{opacity:0;transform:translateY(8px)}6%,90%{opacity:1;transform:none}100%{opacity:0}}
.scroll{animation:scroll 9s ease-in-out infinite}@keyframes scroll{0%,40%{transform:none}55%,85%{transform:translateY(-40px)}100%{transform:none}}${reducedMotion('.tile{opacity:1}')}</style>
${topCard(W, H, 26, T)}
<text x="${pad}" y="${pad + 14}" font-family="${MONO}" font-size="13" font-weight="600" letter-spacing="2" fill="${T.accent}">01 · FLAGSHIP · MARKETPLACE</text>
<text x="${pad}" y="${pad + 66}" font-family="${SANS}" font-size="${m ? 44 : 46}" font-weight="700" letter-spacing="-1.2" fill="${T.text}">Tindero</text>
<text x="${pad}" y="${pad + 102}" font-family="${SANS}" font-size="${m ? 20 : 21}" font-weight="600" fill="${T.text}">${m ? 'Shop, eat, sell and send in' : 'Shop, eat, sell and send in one Filipino app.'}</text>
${m ? `<text x="${pad}" y="${pad + 128}" font-family="${SANS}" font-size="20" font-weight="600" fill="${T.text}">one Filipino app.</text>` : ''}
${lines.map((l, j) => `<text x="${pad}" y="${yBody + j * 28}" font-family="${SANS}" font-size="19" fill="${T.muted}">${esc(l)}</text>`).join('')}
${chipSvg}${statusPill(pad, yStatus, TINDERO.status, true, T)}
<g class="float"><rect x="${dx - 10}" y="${dy - 10}" width="${dw + 20}" height="${dh + 34}" rx="16" fill="${T.card2}" stroke="${T.lineHi}"/>
${[4, 16, 28].map((o) => `<circle cx="${dx + o}" cy="${dy + 2}" r="3.5" fill="${T.lineHi}"/>`).join('')}
<rect x="${dx + dw / 2 - 90}" y="${dy - 4}" width="180" height="14" rx="7" fill="${T.bg}"/><text x="${dx + dw / 2}" y="${dy + 7}" text-anchor="middle" font-family="${MONO}" font-size="12" fill="${T.muted}">tinderoph.vercel.app</text>
${screen(dx, dy + 16, dw, dh, m ? 3 : 4, m ? 0.8 : 1, T, 'sd')}</g>
<g class="float" style="animation-delay:-3s"><rect x="${px - 7}" y="${py - 7}" width="${pw + 14}" height="${ph + 14}" rx="22" fill="${T.card2}" stroke="${T.lineHi}"/>
<clipPath id="phone"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="16"/></clipPath><g clip-path="url(#phone)">${screen(px, py, pw, ph, 2, 0.62, T, 'sp')}</g></g>
</svg>`;
}
function footSlice({ W, H, r, i, n, T, B, title, desc, body, defs = '' }) {
  const f = footShape(W, H, r, i === 0, i === n - 1);
  return `${open(W, H, title, desc, B)}
<defs>${dotGrid('dots', T, 20)}${defs}</defs>
<path d="${f.fill}" fill="${T.card}"/><path d="${f.fill}" fill="url(#dots)"/><path d="${f.edge}" fill="none" stroke="${T.line}"/>
<line x1="${i === 0 ? 24 : 0}" y1=".5" x2="${i === n - 1 ? W - 24 : W}" y2=".5" stroke="${T.line}"/>
${i < n - 1 ? `<line x1="${W - 0.5}" y1="16" x2="${W - 0.5}" y2="${H - 16}" stroke="${T.line}"/>` : ''}
${body}
</svg>`;
}
const LINKS = [
  { id: 'tindero-site', label: 'Visit live site', short: 'Live site', icon: 'globe', primary: true },
  { id: 'tindero-fb', label: 'Tindero on Facebook', short: 'Facebook', brand: 'facebook' },
  { id: 'tindero-repo', label: 'View repo', short: 'Repo', icon: 'github' },
];
function linkSlice(o, i, B, m) {
  const T = themed(B, C.projects), K = T, n = LINKS.length;
  const W = m ? 160 : 400, H = m ? 132 : 96;
  const fg = o.primary ? K.onAccent : B.text;
  if (m) {
    const icon = o.brand ? brand(o.brand, W / 2 - 13, 24, 26, K) : lucide(o.icon, W / 2 - 13, 24, 26, o.primary ? K.onAccent : K.accent, 2);
    return footSlice({ W, H, r: 26, i, n, T, B, title: o.label, desc: o.label, defs: gradDef('b', K), body: `
<circle cx="${W / 2}" cy="37" r="27" fill="${o.primary ? 'url(#b)' : K.card2}" stroke="${o.primary ? 'none' : K.lineHi}" stroke-width="1.5"/>${icon}
<text x="${W / 2}" y="94" text-anchor="middle" font-family="${SANS}" font-size="20" font-weight="650" fill="${B.text}">${esc(o.short)}</text>
${lucide('arrow-up-right', W / 2 - 8, 104, 16, K.accent, 2.2)}` });
  }
  const bh = 52, bw = 300, bx = (W - bw) / 2, by = (H - bh) / 2 - 2;
  const icon = o.brand ? brand(o.brand, bx + 22, by + bh / 2 - 11, 22, K) : lucide(o.icon, bx + 22, by + bh / 2 - 11, 22, o.primary ? fg : K.accent);
  return footSlice({ W, H, r: 26, i, n, T, B, title: o.label, desc: o.label, defs: gradDef('b', K), body: `
<rect x="${bx + 0.75}" y="${by + 0.75}" width="${bw - 1.5}" height="${bh - 1.5}" rx="${bh / 2}" fill="${o.primary ? 'url(#b)' : K.card2}" stroke="${o.primary ? 'none' : K.lineHi}" stroke-width="1.5"/>
${icon}<text x="${bx + 58}" y="${by + bh / 2 + 6}" font-family="${SANS}" font-size="17" font-weight="650" fill="${fg}">${esc(o.label)}</text>
${lucide('arrow-up-right', bx + bw - 38, by + bh / 2 - 9, 18, o.primary ? fg : K.accent, 2.2)}` });
}

// ===================================================================== CONTACT
function cta(B, m) {
  const T = themed(B, C.contact);
  const W = m ? 480 : 1200, H = m ? 300 : 176, pad = m ? 28 : 44;
  const bw = m ? W - pad * 2 : 300, bh = 60, bx = m ? pad : W - pad - bw, by = m ? 212 : (H - bh) / 2;
  const words = ['Let’s', 'build', 'something', 'people', 'use.'];
  const line = (ws, off, y) => `<text x="${pad}" y="${y}" font-family="${SANS}" font-size="${m ? 36 : 38}" font-weight="700" letter-spacing="-1">${ws.map((w, k) => `<tspan class="rise" style="animation-delay:${0.15 + (off + k) * 0.09}s" fill="${w === 'use.' ? T.accent : T.text}">${w} </tspan>`).join('')}</text>`;
  return `${open(W, H, 'Let’s build something people use', 'Available for work. Full-stack and AI engineering roles and collaborations. Philippines, remote-friendly. Connect on LinkedIn.', B)}
<defs><clipPath id="bc"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${bh / 2}"/></clipPath>
<linearGradient id="sh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<style>${BASE_CSS}.sheen{animation:sh 5s ease-in-out infinite}@keyframes sh{0%,65%{transform:translateX(-120px)}100%{transform:translateX(${bw + 60}px)}}${reducedMotion('.sheen{opacity:0}')}</style>
${topCard(W, H, 24, T)}
<g transform="translate(${pad} ${m ? 30 : 34})"><rect width="196" height="28" rx="14" fill="${T.card2}" stroke="${T.line}"/><circle cx="18" cy="14" r="4.5" fill="${T.ok}" class="pulse"/><text x="32" y="19" font-family="${MONO}" font-size="13" font-weight="600" letter-spacing="1" fill="${T.text}">AVAILABLE FOR WORK</text></g>
${m ? line(words.slice(0, 2), 0, 104) + line(words.slice(2), 2, 148) : line(words, 0, 106)}
<text x="${pad}" y="${m ? 184 : 140}" font-family="${SANS}" font-size="18" fill="${T.muted}">${m ? 'Full-stack &amp; AI roles · Philippines · remote' : 'Full-stack and AI engineering roles · Philippines · remote-friendly'}</text>
<g clip-path="url(#bc)"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="url(#gt)"/><rect class="sheen" x="${bx}" y="${by}" width="80" height="${bh}" fill="url(#sh)"/></g>
${lucide('linkedin', bx + (m ? bw / 2 - 124 : 30), by + bh / 2 - 12, 24, T.onAccent)}
<text x="${bx + (m ? bw / 2 - 88 : 66)}" y="${by + bh / 2 + 6}" font-family="${SANS}" font-size="18" font-weight="650" fill="${T.onAccent}">Connect on LinkedIn</text>
<g class="nudge">${lucide('arrow-up-right', bx + (m ? bw / 2 + 102 : bw - 44), by + bh / 2 - 10, 20, T.onAccent, 2.4)}</g>
</svg>`;
}
const SOCIALS = [
  { id: 'linkedin', name: 'LinkedIn', handle: 'Joshua M. Camacho', tile: ['#0A66C2'] },
  { id: 'instagram', name: 'Instagram', handle: '@schneizel_jmnl', tile: ['#FEDA75', '#D62976', '#4F5BD5'], brand: 'instagram' },
  { id: 'tiktok', name: 'TikTok', handle: '@jmnl_inc', tile: ['#111111'], brand: 'tiktok' },
  { id: 'facebook', name: 'Facebook', handle: 'Joshua M. Camacho', tile: ['#0866FF'], brand: 'facebook' },
];
// Brand tiles use each network's own official colours; that is their identity, not decoration.
function socialSlice(o, i, B, m) {
  const T = themed(B, C.contact), n = SOCIALS.length;
  const W = m ? 120 : 300, H = m ? 132 : 104, s = m ? 52 : 48, x = m ? (W - s) / 2 : 26, y = m ? 20 : 26;
  const tile = `<linearGradient id="tile" x1="0" y1="1" x2="1" y2="0">${o.tile.map((c, k) => `<stop offset="${o.tile.length > 1 ? k / (o.tile.length - 1) : 0}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const g = (s - 24) / 2;
  const glyph = o.id === 'linkedin' ? lucide('linkedin', x + g, y + g, 24, '#ffffff', 2)
    : o.id === 'tiktok' ? `<path transform="translate(${x + g + 1.5} ${y + g})" d="${ICONS.brands.tiktok.path}" fill="#25F4EE"/><path transform="translate(${x + g - 1.5} ${y + g})" d="${ICONS.brands.tiktok.path}" fill="#FE2C55"/><path transform="translate(${x + g} ${y + g})" d="${ICONS.brands.tiktok.path}" fill="#ffffff"/>`
      : `<path transform="translate(${x + g} ${y + g})" d="${ICONS.brands[o.brand].path}" fill="#ffffff"/>`;
  const text = m ? `<text x="${W / 2}" y="${y + s + 32}" text-anchor="middle" font-family="${SANS}" font-size="17" font-weight="650" fill="${T.text}">${esc(o.name)}</text>`
    : `<text x="${x + 64}" y="${y + 20}" font-family="${SANS}" font-size="18" font-weight="650" fill="${T.text}">${esc(o.name)}</text><text x="${x + 64}" y="${y + 42}" font-family="${MONO}" font-size="13" fill="${T.muted}">${esc(o.handle)}</text>${lucide('arrow-up-right', W - 44, y + 15, 18, T.accent, 2.2)}`;
  return footSlice({ W, H, r: 24, i, n, T, B, title: `${o.name}: ${o.handle}`, desc: `${o.name} profile ${o.handle}`, defs: tile, body: `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="14" fill="url(#tile)"/>${glyph}${text}` });
}

// ===================================================================== WRITE
mkdirSync('assets', { recursive: true });
let count = 0;
const put = (name, svg) => { writeFileSync(`assets/${name}.svg`, svg); count++; };
for (const [theme, B] of Object.entries(THEMES)) {
  for (const m of [false, true]) {
    const sfx = `${m ? '-m' : ''}-${theme}`;
    put(`hero${sfx}`, hero(B, m));
    SWITCH.forEach((o) => ['on', 'off'].forEach((st) => put(`sw-${o.id}-${st}${sfx}`, switchPill(o, st === 'on', B, m))));
    SECTIONS.forEach((s) => { put(`nav-${s.id}${sfx}`, nav(s, B, m)); put(`h-${s.id}${sfx}`, header(s, B, m)); });
    put(`about${sfx}`, about(B, m));
    put(`stack${sfx}`, stack(B, m));
    put(`feature-tindero${sfx}`, feature(B, m));
    LINKS.forEach((o, i) => put(`link-${o.id}${sfx}`, linkSlice(o, i, B, m)));
    PROJECTS.forEach((p) => put(`card-${p.id}${sfx}`, card(p, B, m)));
    put(`cta${sfx}`, cta(B, m));
    SOCIALS.forEach((o, i) => put(`social-${o.id}${sfx}`, socialSlice(o, i, B, m)));
  }
}
console.log(`${count} SVGs written to assets/`);
