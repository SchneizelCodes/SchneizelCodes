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

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { THEMES, SANS, MONO, EASE, ICONS, esc, wrap, textW, brand, lucide, dotGrid, reducedMotion, themed, gradDef, media, PORTFOLIO_URL } from './lib.mjs';

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
const C = { intro: 'night', portfolio: 'night', about: 'batanes', stack: 'boracay', projects: 'tindero', activity: 'cordillera', certificates: 'mayon', contact: 'night' };

// ===================================================================== HERO (portfolio style)
// Mirrors joshua-camacho.dev: a particle portrait (sampled from the real photo by
// scripts/sample-portrait.py) gathering inside a turning dial, a giant uppercase headline,
// and the same three stats as the site. Particles are the text colour: white on dark, black on light.
const PORTRAIT = JSON.parse(readFileSync(new URL('./media/portrait-points.json', import.meta.url)));
const PHRASES = ['full-stack products', 'AI-powered tools', 'accessible learning apps', 'apps for Filipino users'];
const STATS = [['11', 'Repositories'], ['5', 'Projects'], ['3', 'Certificates']];
function particles(cx, cy, ph, rad, T, id) {
  const pw = ph / PORTRAIT.aspect, x0 = cx - pw / 2, y0 = cy - ph / 2;
  const groups = Array.from({ length: 6 }, () => []);
  // Same dots on both themes, only the colour flips (white on dark, black on light), like the site.
  PORTRAIT.points.forEach(([u, v, b], i) => { groups[i % 6].push(`<circle cx="${(x0 + u * pw).toFixed(1)}" cy="${(y0 + v * ph).toFixed(1)}" r="${(rad * (0.18 + Math.sqrt(b) * 0.95)).toFixed(2)}" opacity="${(0.45 + b * 0.55).toFixed(2)}"/>`); });
  // Each group flies in from its own direction, then twinkles on its own beat.
  const from = [[-90, -40], [80, -70], [110, 40], [-70, 90], [20, -110], [-120, 10]];
  return groups.map((g, k) => `<g class="gather" style="--fx:${from[k][0]}px;--fy:${from[k][1]}px;animation-delay:${0.25 + k * 0.12}s,${2.2 + k * 0.5}s"><g fill="${T.text}">${g.join('')}</g></g>`).join('');
}
function dial(cx, cy, r, T, id) {
  const ticks = Array.from({ length: 90 }, (_, i) => {
    const a = (i * 4 * Math.PI) / 180, long = i % 10 === 0, r2 = r + (long ? 16 : 8);
    return `<line x1="${(cx + r * Math.cos(a)).toFixed(1)}" y1="${(cy + r * Math.sin(a)).toFixed(1)}" x2="${(cx + r2 * Math.cos(a)).toFixed(1)}" y2="${(cy + r2 * Math.sin(a)).toFixed(1)}" stroke="${long ? T.muted : T.lineHi}" stroke-width="${long ? 1.4 : 1}"/>`;
  }).join('');
  return `<path id="${id}" d="M ${cx + r - 22} ${cy} a ${r - 22} ${r - 22} 0 1 0 ${-(r - 22) * 2} 0 a ${r - 22} ${r - 22} 0 1 0 ${(r - 22) * 2} 0" fill="none"/>
<g class="spin" style="animation-duration:120s;transform-origin:${cx}px ${cy}px">${ticks}</g>
<g class="spin" style="animation-duration:160s;animation-direction:reverse;transform-origin:${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${r + 34}" fill="none" stroke="${T.line}" stroke-dasharray="40 14 4 14"/></g>
<circle cx="${cx}" cy="${cy}" r="${r - 22}" fill="none" stroke="${T.accent}" stroke-opacity=".55" stroke-width="1.2" pathLength="1" class="draw"/>
<circle r="4.5" fill="${T.accent}"><animateMotion dur="14s" repeatCount="indefinite"><mpath href="#${id}"/></animateMotion></circle>`;
}
function hero(B, m) {
  const T = themed(B, C.intro);
  const W = m ? 480 : 1200, H = m ? 770 : 540, x = m ? 40 : 64;
  const cx = m ? 240 : 905, cy = m ? 205 : 270, r = m ? 150 : 205;
  const fs = m ? 47 : 70, l1 = m ? 470 : 186, l2 = l1 + fs * 0.98;
  const yName = l2 + (m ? 46 : 50), yPh = yName + (m ? 44 : 50), yStats = yPh + (m ? 92 : 72);
  const PH = 3, cycle = PHRASES.length * PH, pct = (s) => ((s / cycle) * 100).toFixed(2);
  const phrases = PHRASES.map((p, i) => `<text x="0" y="0" class="ph" fill="${T.accent}" style="animation-delay:${1.4 + i * PH}s">${esc(p)}</text>`).join('');
  const colW = m ? 136 : 168;
  const stats = STATS.map(([n, l], i) => `<g class="rise" style="animation-delay:${1 + i * 0.12}s">${i ? `<line x1="${x + i * colW - 18}" y1="${yStats - 44}" x2="${x + i * colW - 18}" y2="${yStats + 26}" stroke="${T.line}"/>` : ''}
<text x="${x + i * colW}" y="${yStats}" font-family="${SANS}" font-size="${m ? 46 : 52}" font-weight="700" letter-spacing="-2" fill="${T.text}">${n}</text>
<text x="${x + i * colW}" y="${yStats + 24}" font-family="${MONO}" font-size="${m ? 12 : 13}" font-weight="600" letter-spacing="1.6" fill="${T.muted}">${l.toUpperCase()}</text></g>`).join('');
  return `${open(W, H, 'Joshua Manuel Camacho — Full-Stack & AI Engineer', 'A particle portrait of Joshua inside a turning dial. Hey, I’m Joshua: full-stack and AI engineer from the Philippines. I build full-stack products, AI-powered tools, accessible learning apps and apps for Filipino users. 11 repositories, 5 projects, 3 certificates.', B)}
<style>
  .spin{animation:spin linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
  .gather{animation:gather 1.8s ${EASE} backwards,twinkle 5s ease-in-out infinite alternate}
  @keyframes gather{from{opacity:0;transform:translate(var(--fx),var(--fy)) scale(1.06)}to{opacity:1;transform:none}}
  @keyframes twinkle{from{opacity:1}to{opacity:.55}}
  .draw{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 2.4s ${EASE} .3s forwards}@keyframes draw{to{stroke-dashoffset:0}}
  .line{opacity:0;animation:line 1s ${EASE} forwards}@keyframes line{from{opacity:0;transform:translateY(${fs * 0.7}px)}to{opacity:1;transform:none}}
  .ph{font:600 ${m ? 24 : 26}px ${SANS};opacity:0;animation:swap ${cycle}s ${EASE} infinite backwards}
  @keyframes swap{0%{opacity:0;transform:translateY(14px)}${pct(0.5)}%{opacity:1;transform:none}${pct(PH - 0.4)}%{opacity:1;transform:none}${pct(PH)}%{opacity:0;transform:translateY(-14px)}100%{opacity:0}}
  ${BASE_CSS}
  @media (prefers-reduced-motion: reduce){.gather,.line,.ph:first-child{opacity:1;animation:none}.draw{stroke-dashoffset:0}}
</style>
${cardBox('hero', 0, 0, W, H, 20, T)}
<defs><clipPath id="l1c"><rect x="0" y="${l1 - fs}" width="${W}" height="${fs * 1.08}"/></clipPath><clipPath id="l2c"><rect x="0" y="${l2 - fs}" width="${W}" height="${fs * 1.08}"/></clipPath></defs>
${dial(cx, cy, r, T, 'orb')}
${particles(cx, cy, m ? 300 : 410, ((m ? 300 : 410) / PORTRAIT.aspect / PORTRAIT.cols) * 0.5, T)}
<g class="rise" style="animation-delay:.1s"><circle cx="${x + 5}" cy="${l1 - fs - (m ? 26 : 32)}" r="5" fill="${T.ok}" class="pulse"/><text x="${x + 20}" y="${l1 - fs - (m ? 21 : 27)}" font-family="${MONO}" font-size="${m ? 14 : 15}" font-weight="600" letter-spacing="3" fill="${T.text}">HEY, I’M JOSHUA</text></g>
<g clip-path="url(#l1c)"><text x="${x - 3}" y="${l1}" class="line" style="animation-delay:.35s" font-family="${SANS}" font-size="${fs}" font-weight="800" letter-spacing="${-fs * 0.045}" fill="${T.text}">FULL-STACK &amp;</text></g>
<g clip-path="url(#l2c)"><text x="${x - 3}" y="${l2}" class="line" style="animation-delay:.47s" font-family="${SANS}" font-size="${fs}" font-weight="800" letter-spacing="${-fs * 0.045}" fill="${T.accent}">AI ENGINEER.</text></g>
<text x="${x}" y="${yName}" font-family="${SANS}" font-size="${m ? 19 : 21}" font-weight="600" fill="${T.text}" class="rise" style="animation-delay:.7s">Joshua Manuel Camacho <tspan fill="${T.muted}" font-weight="400">· Philippines</tspan></text>
<g transform="translate(${x} ${yPh})"><text x="0" y="0" font-family="${SANS}" font-size="${m ? 24 : 26}" fill="${T.muted}" class="rise" style="animation-delay:.85s">I build</text><g transform="translate(${m ? 92 : 98} 0)">${phrases}</g></g>
${stats}
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
// Section titles match the portfolio's section headers word for word.
export const SECTIONS = [
  { id: 'about', combo: C.about, n: '01', label: 'About', title: 'I build things people actually use.', accent: 'use', note: 'What I build and how I work' },
  { id: 'stack', combo: C.stack, n: '02', label: 'Stack', title: 'Tools I ship with', accent: 'ship', note: 'TypeScript end to end' },
  { id: 'projects', combo: C.projects, n: '03', label: 'Work', title: 'Selected work', accent: 'work', note: 'Tap a card to open it' },
  { id: 'activity', combo: C.activity, n: '04', label: 'GitHub', title: 'Every square is work', accent: 'work', note: 'Rebuilt from live data every 12 hours' },
  { id: 'certificates', combo: C.certificates, n: '05', label: 'Certs', title: 'Always learning.', accent: 'learning', note: 'Certificates and badges' },
  { id: 'contact', combo: C.contact, n: '06', label: 'Contact', title: 'Say hello.', accent: 'hello', note: 'Open to roles and collaborations' },
];
function nav(s, B, m) {
  const T = themed(B, C.intro);
  const W = m ? 46 : 144, H = 46;
  return `${open(W, H, s.label, `Jump to ${s.label}`, B)}
<defs>${gradDef('g', T, 0, 0, 1, 1)}</defs>
${m ? `<circle cx="23" cy="23" r="22.25" fill="url(#g)"/><text x="23" y="28" text-anchor="middle" font-family="${MONO}" font-size="14" font-weight="700" fill="${T.onAccent}">${s.n}</text>`
    : `<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="${H / 2}" fill="${T.card}" stroke="${T.lineHi}" stroke-width="1.5"/>
${badge(8, 9, 32, 28, s.n, T, 'g', 12.5)}
<text x="50" y="${H / 2 + 6}" font-family="${SANS}" font-size="16" font-weight="600" fill="${T.text}">${esc(s.label)}</text>
<path d="M${W - 22} ${H / 2 - 4}l4 4 4-4" stroke="${T.accent}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`}
</svg>`;
}
// The portfolio's section header: mono index + label over a hairline with a one-hue segment,
// then a giant uppercase statement whose lines rise out of masks; the accent word is coloured.
function header(s, B, m) {
  const T = themed(B, s.combo);
  const W = m ? 480 : 1200, fs = m ? 50 : 84, lh = fs * 0.94, maxW = W - 4;
  const lines = [];
  for (const w of s.title.toUpperCase().split(' ')) {
    const cur = lines[lines.length - 1];
    if (cur && textW(`${cur} ${w}`, fs) * 1.2 <= maxW) lines[lines.length - 1] = `${cur} ${w}`; else lines.push(w);
  }
  const top = m ? 64 : 76, H = Math.round(top + fs * 0.8 + (lines.length - 1) * lh + (m ? 26 : 34));
  const acc = s.accent.toUpperCase();
  const words = (l) => l.split(' ').map((w) => `<tspan fill="${w.replace(/[.,]/g, '') === acc ? T.accent : T.text}">${esc(w)}</tspan>`).join(' ');
  return `${open(W, H, `${s.n} ${s.label}: ${s.title}`, s.note, B)}
<defs>${gradDef('g', T)}${lines.map((_, i) => `<clipPath id="lc${i}"><rect x="0" y="${top + i * lh - fs * 0.05}" width="${W}" height="${fs * 0.95}"/></clipPath>`).join('')}</defs>
<style>.seg{animation:seg 1.2s ${EASE} .2s backwards;transform-origin:0 0}@keyframes seg{from{transform:scaleX(0)}}
.line{animation:line 1s ${EASE} backwards}@keyframes line{from{opacity:0;transform:translateY(${fs * 0.8}px)}}${BASE_CSS}${reducedMotion('.line,.seg{animation:none}')}</style>
<g class="rise"><text x="0" y="22" font-family="${MONO}" font-size="${m ? 13 : 14}" font-weight="700" letter-spacing="2.4"><tspan fill="${T.accent}">${s.n}</tspan><tspan dx="12" fill="${T.text}">${esc(s.label.toUpperCase())}</tspan></text>
${m ? '' : `<text x="${W}" y="22" text-anchor="end" font-family="${MONO}" font-size="14" fill="${T.muted}">${esc(s.note)}</text>`}</g>
<rect x="0" y="36" width="${W}" height="1" fill="${T.line}"/>
<rect x="0" y="35.5" width="${m ? 64 : 88}" height="2" rx="1" fill="url(#g)" class="seg"/>
${lines.map((l, i) => `<g clip-path="url(#lc${i})"><text x="-2" y="${top + i * lh + fs * 0.8}" class="line" style="animation-delay:${0.15 + i * 0.1}s" font-family="${SANS}" font-size="${fs}" font-weight="800" letter-spacing="${-fs * 0.042}">${words(l)}</text></g>`).join('\n')}
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
function linkSlice(o, i, B, m, list = LINKS, combo = C.projects) {
  const T = themed(B, combo), K = T, n = list.length;
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

// ===================================================================== PORTFOLIO FEATURE
// The live portfolio, shown in a browser frame with a real screenshot (dark or light to match).
const PORTFOLIO = {
  host: PORTFOLIO_URL.replace(/^https?:\/\//, ''),
  body: 'A particle portrait built in three.js follows you through black and white bands: real project media, a GitHub wall, a downloadable résumé and certificates.',
  stack: ['Next.js', 'React', 'TypeScript', 'three.js', 'Tailwind CSS'],
};
function portfolio(B, m, dark) {
  const T = themed(B, C.portfolio);
  const W = m ? 480 : 1200, pad = m ? 28 : 44;
  const lines = wrap(PORTFOLIO.body, 19, m ? W - pad * 2 : 520).slice(0, m ? 6 : 4);
  const yBody = pad + (m ? 150 : 150), yChips = yBody + lines.length * 28 + (m ? 6 : 14);
  const yBtn = yChips + (m ? 2 : 1) * 40 + 16, bw = m ? W - pad * 2 : 260, bh = 56;
  const fw = m ? W - pad * 2 : 540, fh = fw * 0.625, fx = m ? pad : W - pad - fw, fy = m ? yBtn + bh + 40 : 72;
  const H = m ? fy + fh + 44 + pad : 470;
  const chipSvg = m ? chips(PORTFOLIO.stack.slice(0, 3), pad, yChips, W - pad, T, 15) + chips(PORTFOLIO.stack.slice(3), pad, yChips + 40, W - pad, T, 15) : chips(PORTFOLIO.stack, pad, yChips, 600, T, 14);
  return `${open(W, H, 'My portfolio — joshua-camacho.dev', `${PORTFOLIO.body} Built with ${PORTFOLIO.stack.join(', ')}. Visit ${PORTFOLIO.host}.`, B)}
<defs><clipPath id="shot"><rect x="${fx}" y="${fy + 34}" width="${fw}" height="${fh}" rx="0"/></clipPath><clipPath id="bc"><rect x="${pad}" y="${yBtn}" width="${bw}" height="${bh}" rx="${bh / 2}"/></clipPath>
<linearGradient id="sh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<style>${BASE_CSS}.sheen{animation:sh 5s ease-in-out infinite}@keyframes sh{0%,65%{transform:translateX(-120px)}100%{transform:translateX(${bw + 60}px)}}
.pan{animation:pan 14s ease-in-out infinite}@keyframes pan{0%,30%{transform:none}50%,80%{transform:translateY(-${Math.round(fh * 0.06)}px) scale(1.04)}100%{transform:none}}${reducedMotion('.sheen{opacity:0}.pan{animation:none}')}</style>
${cardBox('pf', 0, 0, W, H, 26, T)}
<text x="${pad}" y="${pad + 14}" font-family="${MONO}" font-size="13" font-weight="600" letter-spacing="2" fill="${T.accent}">FEATURED · MY PORTFOLIO</text>
<text x="${pad}" y="${pad + 70}" font-family="${SANS}" font-size="${m ? 38 : 46}" font-weight="800" letter-spacing="-1.4" fill="${T.text}">${esc(PORTFOLIO.host)}</text>
<text x="${pad}" y="${pad + 106}" font-family="${SANS}" font-size="${m ? 20 : 21}" font-weight="600" fill="${T.text}">The site behind this README.</text>
${lines.map((l, j) => `<text x="${pad}" y="${yBody + j * 28}" font-family="${SANS}" font-size="19" fill="${T.muted}">${esc(l)}</text>`).join('')}
${chipSvg}
<g clip-path="url(#bc)"><rect x="${pad}" y="${yBtn}" width="${bw}" height="${bh}" fill="url(#g-pf)"/><rect class="sheen" x="${pad}" y="${yBtn}" width="80" height="${bh}" fill="url(#sh)"/></g>
${lucide('globe', pad + (m ? bw / 2 - 98 : 26), yBtn + bh / 2 - 11, 22, T.onAccent)}
<text x="${pad + (m ? bw / 2 - 64 : 60)}" y="${yBtn + bh / 2 + 6}" font-family="${SANS}" font-size="18" font-weight="650" fill="${T.onAccent}">Visit portfolio</text>
<g class="nudge">${lucide('arrow-up-right', pad + (m ? bw / 2 + 74 : bw - 44), yBtn + bh / 2 - 10, 20, T.onAccent, 2.4)}</g>
<g class="float"><rect x="${fx - 0.5}" y="${fy - 0.5}" width="${fw + 1}" height="${fh + 35}" rx="14" fill="${T.card2}" stroke="${T.lineHi}"/>
${[18, 34, 50].map((o) => `<circle cx="${fx + o}" cy="${fy + 17}" r="4.5" fill="${T.lineHi}"/>`).join('')}
<rect x="${fx + fw / 2 - 110}" y="${fy + 8}" width="220" height="18" rx="9" fill="${T.bg}"/><text x="${fx + fw / 2}" y="${fy + 21}" text-anchor="middle" font-family="${MONO}" font-size="12" fill="${T.muted}">${esc(PORTFOLIO.host)}</text>
<g clip-path="url(#shot)"><g class="pan" style="transform-origin:${fx + fw / 2}px ${fy + 34}px"><image href="${media(dark ? 'portfolio-dark.jpg' : 'portfolio-light.jpg')}" x="${fx}" y="${fy + 34}" width="${fw}" height="${fh}" preserveAspectRatio="xMidYMin slice"/></g></g></g>
</svg>`;
}

// ===================================================================== CERTIFICATES
// The same three entries as the portfolio's Certificates section, with the real images.
const CERTS = [
  { kind: 'Certificate', img: 'cert-udemy.jpg', issuer: 'UDEMY', name: 'Java Masterclass 2025: 130+ Hours of Expert Lessons', note: 'Certificate of completion, 135.5 total hours.', date: 'Oct 2026' },
  { kind: 'Certificate', img: 'cert-cisco.jpg', issuer: 'CISCO NETWORKING ACADEMY', name: 'Introduction to Modern AI', note: 'Chatbot prompts, computer vision and machine translation.', date: 'Oct 2026' },
  { kind: 'Badge', img: 'cert-badge.webp', badge: true, issuer: 'THE GLOBAL AI COMMUNITY', name: 'Global AI Manila AgentCamp 2026 — Attendee', note: 'AI and Azure AI Foundry, 20 February 2026.', date: 'Feb 2026' },
];
export const CERT_LINKS = [
  { id: 'cert-udemy', label: 'Verify on Udemy', short: 'Udemy', icon: 'badge-check', primary: true },
  { id: 'cert-cisco', label: 'Cisco certificate', short: 'Cisco PDF', icon: 'file-text' },
  { id: 'cert-badge', label: 'AgentCamp badge', short: 'Badge', icon: 'award' },
];
function certificates(B, m) {
  const T = themed(B, C.certificates);
  const W = m ? 480 : 1200, colW = m ? 480 : 400, ip = m ? 28 : 24;
  const pw = colW - ip * 2, ph = Math.round(pw / 1.414);
  const blockH = ph + 175, H = m ? blockH * 3 + 16 : blockH + 24;
  const body = CERTS.map((c, i) => {
    const ox = m ? 0 : i * colW, oy = m ? i * blockH : 0, x = ox + ip, y = oy + 28;
    const name = wrap(c.name, 19, pw - 24).slice(0, 2), note = wrap(c.note, 15, pw - 24).slice(0, 2);
    const ty = y + ph + 40;
    const imgEl = c.badge
      ? `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" fill="url(#pd)"/><image href="${media(c.img)}" x="${x + pw / 2 - ph * 0.36}" y="${y + ph * 0.07}" width="${ph * 0.72}" height="${ph * 0.86}" preserveAspectRatio="xMidYMid meet"/>`
      : `<image href="${media(c.img)}" x="${x}" y="${y}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMin slice"/>`;
    const kw = textW(c.kind.toUpperCase(), 11, true) + 22;
    return `<g class="rise" style="animation-delay:${0.15 + i * 0.15}s">
${m && i ? `<line x1="${ip}" y1="${oy + 4}" x2="${W - ip}" y2="${oy + 4}" stroke="${T.line}"/>` : ''}
<clipPath id="ci${i}"><rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="10"/></clipPath>
<g clip-path="url(#ci${i})"><rect x="${x}" y="${y}" width="${pw}" height="${ph}" fill="${T.card2}"/>${imgEl}<rect class="sheen" style="animation-delay:${i * 1.6}s" x="${x - 120}" y="${y}" width="100" height="${ph}" fill="url(#sh)"/></g>
<rect x="${x + 0.5}" y="${y + 0.5}" width="${pw - 1}" height="${ph - 1}" rx="10" fill="none" stroke="${T.line}"/>
<rect x="${x + 12}" y="${y + 12}" width="${kw}" height="24" rx="12" fill="url(#gt)"/><text x="${x + 12 + kw / 2}" y="${y + 28}" text-anchor="middle" font-family="${MONO}" font-size="11" font-weight="700" letter-spacing="1" fill="${T.onAccent}">${c.kind.toUpperCase()}</text>
<text x="${x}" y="${ty - 8}" font-family="${MONO}" font-size="12" font-weight="600" letter-spacing="1.4" fill="${T.accent}">${esc(c.issuer)}</text>
<text x="${x + pw}" y="${ty - 8}" text-anchor="end" font-family="${MONO}" font-size="12" fill="${T.muted}">${c.date}</text>
${name.map((l, j) => `<text x="${x}" y="${ty + 22 + j * 25}" font-family="${SANS}" font-size="19" font-weight="650" fill="${T.text}">${esc(l)}</text>`).join('')}
${note.map((l, j) => `<text x="${x}" y="${ty + 22 + name.length * 25 + 8 + j * 21}" font-family="${SANS}" font-size="15" fill="${T.muted}">${esc(l)}</text>`).join('')}
</g>${!m && i < 2 ? `<line x1="${ox + colW - 0.5}" y1="24" x2="${ox + colW - 0.5}" y2="${H - 24}" stroke="${T.line}"/>` : ''}`;
  }).join('\n');
  return `${open(W, H, 'Certificates and badges', CERTS.map((c) => `${c.kind}: ${c.name}, ${c.issuer.toLowerCase()}, ${c.date}.`).join(' '), B)}
<defs>${dotGrid('pd', T, 14)}<linearGradient id="sh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<style>${BASE_CSS}.sheen{animation:sh 6s ease-in-out infinite backwards}@keyframes sh{0%,70%{transform:translateX(0)}100%{transform:translateX(${pw + 240}px)}}${reducedMotion('.sheen{opacity:0}')}</style>
${topCard(W, H, 26, T)}
${body}
</svg>`;
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
    put(`portfolio${sfx}`, portfolio(B, m, theme === 'dark'));
    put(`feature-tindero${sfx}`, feature(B, m));
    put(`certificates${sfx}`, certificates(B, m));
    CERT_LINKS.forEach((o, i) => put(`link-${o.id}${sfx}`, linkSlice(o, i, B, m, CERT_LINKS, C.certificates)));
    LINKS.forEach((o, i) => put(`link-${o.id}${sfx}`, linkSlice(o, i, B, m)));
    PROJECTS.forEach((p) => put(`card-${p.id}${sfx}`, card(p, B, m)));
    put(`cta${sfx}`, cta(B, m));
    SOCIALS.forEach((o, i) => put(`social-${o.id}${sfx}`, socialSlice(o, i, B, m)));
  }
}
console.log(`${count} SVGs written to assets/`);
