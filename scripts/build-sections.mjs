// Builds the animated section SVGs: About bento, tech-stack marquee, project cards and contact buttons.
// Run: node scripts/build-sections.mjs   (no dependencies). Writes to assets/.
//
// Motion rules (from the Claude motion videos on prompt-motion.com):
// one idea per element, ease-out with no bounce, seamless loops, varied pace,
// and a still, readable frame for visitors who prefer reduced motion.

import { mkdirSync, writeFileSync } from 'node:fs';
import { THEMES, SANS, MONO, EASE, ICONS, esc, wrap, textW, brand, lucide, dotGrid, beam, beamCss, reducedMotion } from './lib.mjs';

const svgOpen = (w, h, title, desc) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d"><title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>`;

// ------------------------------------------------------------------ ABOUT (bento)
const ABOUT = [
  { key: 'build', eyebrow: 'BUILDING NOW', title: 'Kamayo', body: 'An interactive Filipino Sign Language learning system: a 100-level path, server-checked progress and row-level security.', color: 'green', icon: 'hand' },
  { key: 'explore', eyebrow: 'EXPLORING', title: 'Private, local AI', body: 'Local LLMs with Ollama, retrieval (RAG) and AI features that respect user data.', color: 'violet', icon: 'bot' },
  { key: 'care', eyebrow: 'I CARE ABOUT', title: 'Secure by default', body: 'Row-level security, server-side checks, accessibility and tests.', color: 'accent', icon: 'key-round' },
  { key: 'open', eyebrow: 'OPEN TO', title: 'Roles & collabs', body: 'Full-stack and AI engineering roles, and collaborations.', color: 'amber', icon: 'sparkles' },
];

function about(T) {
  const W = 1200, H = 430, G = 16;
  // Layout: one tall tile on the left, a wide tile and two small tiles on the right.
  const tiles = [
    { x: 0, y: 0, w: 440, h: H },
    { x: 440 + G, y: 0, w: W - 440 - G, h: 196 },
    { x: 440 + G, y: 196 + G, w: (W - 440 - G - G) / 2, h: H - 196 - G },
    { x: 440 + G + (W - 440 - G - G) / 2 + G, y: 196 + G, w: (W - 440 - G - G) / 2, h: H - 196 - G },
  ];
  const body = ABOUT.map((a, i) => {
    const t = tiles[i];
    const c = i === 0 ? T.accent : T.muted;
    const pad = 28;
    const lines = wrap(a.body, i === 0 ? 20 : 17, t.w - pad * 2 - (i === 1 ? 150 : 0));
    const big = i === 0;
    const delay = 0.15 + i * 0.12;
    return `<g class="tile" style="animation-delay:${delay}s">
      <rect x="${t.x + 0.5}" y="${t.y + 0.5}" width="${t.w - 1}" height="${t.h - 1}" rx="22" fill="${T.card}" stroke="${T.line}"/>
      <rect x="${t.x + 0.5}" y="${t.y + 0.5}" width="${t.w - 1}" height="${t.h - 1}" rx="22" fill="url(#dots)"/>
      ${i === 0 ? beam(t.x + 0.5, t.y + 0.5, t.w - 1, t.h - 1, 22, [T.accent, 'transparent'], 9, 0, 1.6) : ''}
      <g transform="translate(${big ? t.x + pad : t.x + t.w - pad - 44} ${t.y + pad})">
        <rect width="44" height="44" rx="12" fill="${i === 0 ? T.accent : T.card2}" fill-opacity="${i === 0 ? 0.14 : 1}" stroke="${i === 0 ? T.accent : T.line}" stroke-opacity="${i === 0 ? 0.4 : 1}"/>
        ${lucide(a.icon, 10, 10, 24, i === 0 ? T.accent : T.text)}
      </g>
      <g transform="translate(${t.x + pad} ${t.y + pad})">
        <text x="0" y="${big ? 92 : 14}" class="eyebrow" fill="${c}">${a.eyebrow}</text>
        <text x="0" y="${big ? 138 : 52}" class="${big ? 'h1' : 'h2'}">${esc(a.title)}</text>
        ${lines.map((l, j) => `<text x="0" y="${(big ? 182 : 88) + j * (big ? 31 : 26)}" class="${big ? 'p1' : 'p2'}">${esc(l)}</text>`).join('')}
      </g>
      ${i === 0 ? kamayoPath(t, T, c) : ''}
      ${i === 1 ? chatPulse(t, T, T.muted) : ''}
      ${i === 3 ? `<g transform="translate(${t.x + pad} ${t.y + t.h - 58})"><rect width="124" height="30" rx="15" fill="${T.ok}" fill-opacity=".1" stroke="${T.ok}" stroke-opacity=".4"/><circle cx="18" cy="15" r="4.5" fill="${T.ok}" class="pulse"/><text x="30" y="20" class="pill" fill="${T.ok}">available</text></g>` : ''}
    </g>`;
  }).join('');

  return `${svgOpen(W, H, 'About me', ABOUT.map((a) => `${a.eyebrow}: ${a.title}. ${a.body}`).join(' '))}
<defs>${dotGrid('dots', T)}</defs>
<style>
  ${beamCss}
  .tile{opacity:0;animation:in .9s ${EASE} forwards}
  @keyframes in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  .eyebrow{font:600 13px ${MONO};letter-spacing:2.2px}
  .h1{font:700 40px ${SANS};fill:${T.text};letter-spacing:-1px}
  .h2{font:700 26px ${SANS};fill:${T.text};letter-spacing:-.4px}
  .p1{font:400 20px ${SANS};fill:${T.muted}}
  .p2{font:400 17px ${SANS};fill:${T.muted}}
  .pill{font:600 13px ${MONO}}
  .pulse{animation:pulse 2s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
  .walk{animation:walk 6s ${EASE} infinite}
  @keyframes walk{0%,15%{stroke-dashoffset:1}55%,100%{stroke-dashoffset:0}}
  .unlock{animation:unlock 6s ${EASE} infinite}
  @keyframes unlock{0%,45%{fill-opacity:0}60%,100%{fill-opacity:1}}
  .dotty{animation:dotty 1.3s ease-in-out infinite}
  @keyframes dotty{0%,100%{opacity:.25}50%{opacity:1}}
  ${reducedMotion('.tile{opacity:1}.beam{opacity:0}.walk{stroke-dashoffset:0}.unlock{fill-opacity:1}')}
</style>
<rect width="${W}" height="${H}" fill="${T.bg}"/>
${body}
</svg>`;
}

// Mini learning path inside the Kamayo tile.
function kamayoPath(t, T, c) {
  const y = t.y + t.h - 62;
  const xs = [0, 1, 2, 3, 4].map((i) => t.x + 48 + i * 86);
  const d = `M${xs[0]} ${y} L${xs[1]} ${y}`;
  return `<line x1="${xs[0]}" y1="${y}" x2="${xs[4]}" y2="${y}" stroke="${T.lineHi}" stroke-width="3" stroke-dasharray="6 7"/>
    <path d="${d}" stroke="${c}" stroke-width="3" pathLength="1" stroke-dasharray="1" class="walk"/>
    ${xs.map((x, i) => `<circle cx="${x}" cy="${y}" r="15" fill="${i === 0 ? c : T.card2}" stroke="${i < 2 ? c : T.lineHi}" stroke-width="2"/>${i === 1 ? `<circle cx="${x}" cy="${y}" r="15" fill="${c}" class="unlock"/>` : ''}`).join('')}
    <path d="M${xs[0] - 6} ${y}l4 4 8-8" stroke="${T.bg}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="${xs[0] - 14}" y="${y + 38}" class="pill" fill="${T.faint}">LEVEL 1</text><text x="${xs[4] - 40}" y="${y + 38}" class="pill" fill="${T.faint}">LEVEL 100</text>`;
}

// "Thinking" chat bubble inside the Exploring tile.
function chatPulse(t, T, c) {
  const x = t.x + t.w - 128 - 70, y = t.y + 28;
  return `<rect x="${x}" y="${y}" width="96" height="40" rx="16" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-opacity=".4"/>
    ${[0, 1, 2].map((i) => `<circle cx="${x + 30 + i * 18}" cy="${y + 20}" r="4.5" fill="${c}" class="dotty" style="animation-delay:${i * 0.18}s"/>`).join('')}
    <text x="${x + 2}" y="${y + 62}" class="pill" fill="${T.faint}">runs locally</text>`;
}

// ------------------------------------------------------------------ TECH STACK (marquee)
const STACK = [
  { label: 'Frontend', items: ['typescript', 'javascript', 'react', 'nextdotjs', 'vite', 'tailwindcss', 'threedotjs', 'framer', 'html5', 'css'] },
  { label: 'Backend & data', items: ['nodedotjs', 'supabase', 'postgresql', 'zod', { name: 'WebAuthn', icon: 'key-round' }, { name: 'Row-level security', icon: 'database' }] },
  { label: 'Mobile & ship', items: ['capacitor', 'vercel', 'netlify', 'githubactions', 'git', 'github'] },
  { label: 'AI & quality', items: ['ollama', 'googlegemini', { name: 'RAG / embeddings', icon: 'sparkles' }, 'vitest', 'figma'] },
];
const NICE = { nextdotjs: 'Next.js', threedotjs: 'Three.js', nodedotjs: 'Node.js', googlegemini: 'Gemini API', framer: 'Framer Motion', css: 'CSS', githubactions: 'GitHub Actions', html5: 'HTML5', postgresql: 'PostgreSQL', tailwindcss: 'Tailwind CSS' };

function stack(T) {
  const W = 1200, ROW = 74, H = STACK.length * ROW + 24, LABEL = 190, VIEW = W - LABEL;
  const pill = (it, x, y) => {
    const isBrand = typeof it === 'string';
    const name = isBrand ? NICE[it] || ICONS_TITLE(it) : it.name;
    const w = 54 + textW(name, 16);
    const icon = isBrand ? brand(it, x + 16, y + 13, 22, T) : lucide(it.icon, x + 16, y + 13, 22, T.mono);
    return { w, svg: `<rect x="${x}" y="${y}" width="${w}" height="48" rx="24" fill="${T.card}" stroke="${T.line}"/>${icon}<text x="${x + 46}" y="${y + 30}" class="name">${esc(name)}</text>` };
  };
  const rows = STACK.map((r, i) => {
    const y = 12 + i * ROW;
    // Build one set, repeated until it is wider than the view, then doubled for a seamless loop.
    let set = [], x = 0;
    while (x < VIEW + 40) for (const it of r.items) { const p = pill(it, x, 0); set.push(p.svg); x += p.w + 12; }
    const setW = x;
    const twice = `<g>${set.join('')}</g><g transform="translate(${setW} 0)">${set.join('')}</g>`;
    const dur = (setW / 38).toFixed(1); // ~38 px per second: calm, readable
    const dir = i % 2 ? 'right' : 'left';
    return `<text x="0" y="${y + 30}" class="cat">${esc(r.label.toUpperCase())}</text>
      <style>@keyframes r${i}{from{transform:translateX(${dir === 'left' ? 0 : -setW}px)}to{transform:translateX(${dir === 'left' ? -setW : 0}px)}}.r${i}{animation:r${i} ${dur}s linear infinite}</style>
      <g clip-path="url(#view)" mask="url(#fade)"><g transform="translate(${LABEL} ${y})"><g class="r${i}">${twice}</g></g></g>`;
  }).join('');
  const allNames = STACK.map((r) => `${r.label}: ${r.items.map((it) => (typeof it === 'string' ? NICE[it] || ICONS_TITLE(it) : it.name)).join(', ')}`).join('. ');

  return `${svgOpen(W, H, 'Tech stack', allNames)}
<defs>
  <clipPath id="view"><rect x="${LABEL}" y="0" width="${VIEW}" height="${H}"/></clipPath>
  <linearGradient id="fg" x1="0" x2="1"><stop offset="0" stop-color="#000"/><stop offset=".07" stop-color="#fff"/><stop offset=".93" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
  <mask id="fade" maskUnits="userSpaceOnUse" x="${LABEL}" y="0" width="${VIEW}" height="${H}"><rect x="${LABEL}" y="0" width="${VIEW}" height="${H}" fill="url(#fg)"/></mask>
</defs>
<style>
  .cat{font:600 13px ${MONO};letter-spacing:2px;fill:${T.muted}}
  .name{font:500 16px ${SANS};fill:${T.text}}
  ${reducedMotion()}
</style>
<rect width="${W}" height="${H}" fill="${T.bg}"/>
${rows}
</svg>`;
}
const ICONS_TITLE = (slug) => ICONS.brands[slug].title;

// ------------------------------------------------------------------ PROJECT CARDS
export const PROJECTS = [
  { id: 'tindero', n: '01', kind: 'MARKETPLACE', title: 'Tindero', color: 'amber', icon: 'shopping-bag',
    body: 'Pre-loved and community marketplace for the Philippines. Role-based access, passkey sign-in, ID scanning with OCR, and Android/iOS apps from one codebase.',
    stack: ['TypeScript', 'React', 'Supabase', 'Capacitor', 'WebAuthn'], status: 'Web + mobile', live: true, cta: 'View repo', href: 'https://github.com/SchneizelCodes/Tindero' },
  { id: 'kamayo', n: '02', kind: 'EDTECH · ACCESSIBILITY', title: 'Kamayo', color: 'green', icon: 'hand',
    body: 'Interactive Filipino Sign Language learning system with a 100-level path. Server-checked progress, row-level security on every record, and tested database rules.',
    stack: ['React 19', 'TypeScript', 'Vite', 'Supabase', 'Vitest'], status: 'In development', cta: null, href: null },
  { id: 'pandeloot', n: '03', kind: 'E-COMMERCE · AI', title: 'PandeLoot', color: 'pink', icon: 'croissant',
    body: 'A daily “loot drop” storefront for Filipino bakery treats, with Gemini-powered features, Google sign-in and live drops.',
    stack: ['Next.js', 'TypeScript', 'Supabase', 'Gemini API'], status: 'Deployed on Vercel', live: true, cta: 'View repo', href: 'https://github.com/SchneizelCodes/PandeLoot' },
  { id: 'anna', n: '04', kind: 'LOCAL AI · PRIVACY', title: 'Anna', color: 'violet', icon: 'bot',
    body: 'A private AI companion that runs entirely on your PC through Ollama. Indexes only approved folders, remembers only what you allow, and suggests instead of editing.',
    stack: ['Node.js', 'Ollama', 'RAG', 'Tailscale'], status: 'Runs 100% locally', cta: null, href: null },
  { id: 'viewer', n: '05', kind: 'DEVELOPER TOOL', title: 'GitHub Profile Viewer', color: 'accent', icon: 'search',
    body: 'Search any GitHub user for live stats, a contribution heatmap with snake animation, top repositories and a language breakdown.',
    stack: ['React', 'Vite', 'Tailwind CSS', 'GitHub API'], status: 'Live', live: true, cta: 'Open live demo', href: 'https://playful-pudding-f9a7df.netlify.app' },
  { id: 'portfolio', n: '06', kind: '3D · CREATIVE', title: 'SCHNEIZEL.DEV', color: 'violet', icon: 'orbit',
    body: 'My portfolio as a 3D solar system: each project is a planet you can fly to, built with React Three Fiber.',
    stack: ['Next.js', 'React Three Fiber', 'Three.js', 'Zustand'], status: 'Portfolio', cta: 'View repo', href: 'https://github.com/SchneizelCodes/SCHNEIZEL.DEV' },
];

function card(p, T, i) {
  const W = 540, H = 350, c = T.accent, pad = 30;
  const lines = wrap(p.body, 18.5, W - pad * 2 - 6).slice(0, 4);
  let cx = pad;
  const chips = p.stack.map((s) => {
    const w = textW(s, 14, true) + 22;
    const out = `<rect x="${cx}" y="0" width="${w}" height="30" rx="15" fill="${T.card2}" stroke="${T.line}"/><text x="${cx + w / 2}" y="20" text-anchor="middle" class="chip">${esc(s)}</text>`;
    cx += w + 7;
    return out;
  }).join('');
  const statusW = textW(p.status, 14, true) + 42;
  return `${svgOpen(W, H, `${p.title} — ${p.kind.toLowerCase()}`, `${p.body} Built with ${p.stack.join(', ')}. Status: ${p.status}.`)}
<defs>${dotGrid('dots', T, 20)}
  <radialGradient id="glow" cx="1" cy="0" r="1"><stop offset="0" stop-color="${c}" stop-opacity=".16"/><stop offset=".6" stop-color="${c}" stop-opacity="0"/></radialGradient>
</defs>
<style>
  ${beamCss}
  .k{font:600 13px ${MONO};letter-spacing:2px;fill:${T.muted}}
  .n{font:600 13px ${MONO};letter-spacing:2px;fill:${c}}
  .title{font:700 34px ${SANS};fill:${T.text};letter-spacing:-.7px}
  .body{font:400 18.5px ${SANS};fill:${T.muted}}
  .chip{font:500 14px ${MONO};fill:${T.text}}
  .st{font:600 14px ${MONO};fill:${T.text}}
  .cta{font:600 16px ${SANS};fill:${T.text}}
  .wm{animation:float 9s ease-in-out infinite;transform-origin:${W - 85}px 83px}
  @keyframes float{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-8px) rotate(4deg)}}
  .pulse{animation:pulse 2s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
  .ring{animation:ring 2s ease-out infinite;transform-origin:${pad + 16}px ${H - 38}px}
  @keyframes ring{0%{transform:scale(.6);opacity:.7}100%{transform:scale(2.2);opacity:0}}
  .arrow{animation:nudge 2.4s ${EASE} infinite}
  @keyframes nudge{0%,60%,100%{transform:none}75%{transform:translate(3px,-3px)}}
  .sheen{animation:sheen 7s ease-in-out infinite;animation-delay:${i * 0.9}s}
  @keyframes sheen{0%,70%{transform:translateX(-260px)}100%{transform:translateX(${W + 60}px)}}
  ${reducedMotion('.beam,.sheen,.ring{opacity:0}')}
</style>
<clipPath id="clip"><rect width="${W}" height="${H}" rx="24"/></clipPath>
<g clip-path="url(#clip)">
  <rect width="${W}" height="${H}" fill="${T.card}"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <rect class="sheen" x="0" y="-40" width="70" height="${H + 80}" fill="#ffffff" fill-opacity="${T.bg === '#ffffff' ? 0.7 : 0.03}" transform="skewX(-18)"/>
  <g class="wm" opacity=".5">${lucide(p.icon, W - 140, 28, 110, T.lineHi, 1.3)}</g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="24" fill="none" stroke="${T.line}"/>
<text x="${pad}" y="${pad + 14}" class="n">${p.n}</text>
<text x="${pad + 34}" y="${pad + 14}" class="k">${esc(p.kind)}</text>
<text x="${pad}" y="${pad + 56}" class="title">${esc(p.title)}</text>
${lines.map((l, j) => `<text x="${pad}" y="${pad + 96 + j * 27}" class="body">${esc(l)}</text>`).join('')}
<g transform="translate(0 ${H - 108})">${chips}</g>
<g>
  <rect x="${pad}" y="${H - 54}" width="${statusW}" height="32" rx="16" fill="${T.card2}" stroke="${T.line}"/>
  <circle cx="${pad + 16}" cy="${H - 38}" r="4.5" fill="${p.live ? T.ok : c}" class="ring"/>
  <circle cx="${pad + 16}" cy="${H - 38}" r="4.5" fill="${p.live ? T.ok : c}" class="pulse"/>
  <text x="${pad + 28}" y="${H - 32}" class="st">${esc(p.status)}</text>
</g>
${p.cta ? `<text x="${W - pad - 22}" y="${H - 32}" text-anchor="end" class="cta">${esc(p.cta)}</text><g class="arrow">${lucide('arrow-up-right', W - pad - 18, H - 49, 20, c, 2.2)}</g>` : ''}
</svg>`;
}

// ------------------------------------------------------------------ CONTACT
const BUTTONS = [
  { id: 'github', label: 'GitHub', icon: 'github' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { id: 'email', label: 'Email me', icon: 'mail' },
  { id: 'portfolio', label: 'Portfolio', icon: 'globe' },
];

// Buttons: the first is the one solid accent element on the page; the rest are quiet outlines.
// A slow sheen crosses the primary button so the call to action has a little life.
function button(b, T, i) {
  const W = 200, H = 54, primary = i === 0;
  const fg = primary ? T.onAccent : T.text;
  return `${svgOpen(W, H, b.label, `${b.label} button`)}
<defs><clipPath id="c"><rect width="${W}" height="${H}" rx="${H / 2}"/></clipPath>
  <linearGradient id="sh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<style>.sheen{animation:sh 5s ease-in-out infinite}@keyframes sh{0%,65%{transform:translateX(-120px)}100%{transform:translateX(${W + 40}px)}}${reducedMotion('.sheen{opacity:0}')}</style>
<g clip-path="url(#c)">
  <rect width="${W}" height="${H}" fill="${primary ? T.accent : T.card}"/>
  ${primary ? `<rect class="sheen" x="0" y="0" width="80" height="${H}" fill="url(#sh)"/>` : ''}
</g>
${primary ? '' : `<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="${H / 2}" fill="none" stroke="${T.lineHi}" stroke-width="1.5"/>`}
${lucide(b.icon, 26, H / 2 - 11, 22, fg)}
<text x="${W / 2 + 14}" y="${H / 2 + 6}" text-anchor="middle" font-family="${SANS}" font-size="17" font-weight="650" fill="${fg}">${esc(b.label)}</text>
</svg>`;
}

// Section navigation pills under the header: "01 Projects" style, number in the accent.
// Numbered in page order, matching the section headers.
export const SECTIONS = [
  { id: 'about', n: '01', label: 'About', title: 'About me', note: 'What I build and how I work' },
  { id: 'stack', n: '02', label: 'Stack', title: 'Tech stack', note: 'Tools I ship with' },
  { id: 'projects', n: '03', label: 'Projects', title: 'Featured projects', note: 'Selected work · click a card' },
  { id: 'activity', n: '04', label: 'Activity', title: 'GitHub activity', note: 'Rebuilt from live data every 12 hours' },
  { id: 'contact', n: '05', label: 'Contact', title: 'Let’s work together', note: 'Open to roles and collaborations' },
];
const NAV = SECTIONS;
function nav(item, T) {
  const W = 150, H = 46;
  return `${svgOpen(W, H, item.label, `Jump to ${item.label}`)}
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="${H / 2}" fill="${T.card}" stroke="${T.line}" stroke-width="1.5"/>
<text x="20" y="${H / 2 + 5}" font-family="${MONO}" font-size="13" font-weight="600" letter-spacing="1" fill="${T.accent}">${item.n}</text>
<text x="50" y="${H / 2 + 6}" font-family="${SANS}" font-size="16" font-weight="600" fill="${T.text}">${esc(item.label)}</text>
<path d="M${W - 26} ${H / 2 - 4}l4 4 4-4" stroke="${T.faint}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// Section header in the same style as the cards: amber number, title, quiet note, and a
// hairline whose amber segment slides in. Replaces GitHub's own "## heading" rule.
function header(sec, T) {
  const W = 1200, H = 92;
  return `${svgOpen(W, H, `${sec.n} ${sec.title}`, sec.note)}
<style>
  .seg{animation:seg 1.2s ${EASE} .2s backwards}@keyframes seg{from{transform:scaleX(0)}}
  .t{opacity:0;animation:in .8s ${EASE} forwards}@keyframes in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  ${reducedMotion('.t{opacity:1}')}
</style>
<g class="t">
  <text x="0" y="52" font-family="${MONO}" font-size="16" font-weight="600" letter-spacing="2" fill="${T.accent}">${sec.n}</text>
  <text x="44" y="54" font-family="${SANS}" font-size="34" font-weight="700" letter-spacing="-.7" fill="${T.text}">${esc(sec.title)}</text>
  <text x="${W}" y="52" text-anchor="end" font-family="${MONO}" font-size="14" fill="${T.muted}">${esc(sec.note)}</text>
</g>
<rect x="0" y="${H - 14}" width="${W}" height="1.5" fill="${T.line}"/>
<rect x="0" y="${H - 14.5}" width="72" height="2.5" rx="1.25" fill="${T.accent}" class="seg" style="transform-origin:0 0"/>
</svg>`;
}

// Contact card: text on the left, the call-to-action button drawn on the right, so the
// whole block is one tight, clickable card instead of a banner plus a separate button.
function cta(T) {
  const W = 1200, H = 176, pad = 44, bw = 300, bh = 60, bx = W - pad - bw, by = (H - bh) / 2;
  return `${svgOpen(W, H, 'Let’s build something people use', 'Available for work. Full-stack and AI engineering roles and collaborations. Philippines, remote-friendly. Say hello on GitHub.')}
<defs>${dotGrid('dots', T)}
  <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${bx + bw / 2} ${H / 2}) scale(320 160)"><stop offset="0" stop-color="${T.accent}" stop-opacity=".12"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/></radialGradient>
  <clipPath id="bc"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${bh / 2}"/></clipPath>
  <linearGradient id="sh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<style>
  .h{font:700 38px ${SANS};fill:${T.text};letter-spacing:-1px}
  .s{font:400 18px ${SANS};fill:${T.muted}}
  .pill{font:600 13px ${MONO};fill:${T.ok};letter-spacing:1px}
  .pulse{animation:pulse 2s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
  .word{opacity:0;animation:in .9s ${EASE} forwards}
  @keyframes in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  .sheen{animation:sh 5s ease-in-out infinite}@keyframes sh{0%,65%{transform:translateX(-120px)}100%{transform:translateX(${bw + 60}px)}}
  .arrow{animation:nudge 2.4s ${EASE} infinite}@keyframes nudge{0%,60%,100%{transform:none}75%{transform:translate(3px,-3px)}}
  ${reducedMotion('.word{opacity:1}.sheen{opacity:0}')}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="24" fill="${T.card}" stroke="${T.line}"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="24" fill="url(#dots)"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="24" fill="url(#glow)"/>
<g transform="translate(${pad} 34)"><rect width="196" height="28" rx="14" fill="${T.ok}" fill-opacity=".1" stroke="${T.ok}" stroke-opacity=".4"/>
  <circle cx="18" cy="14" r="4.5" fill="${T.ok}" class="pulse"/><text x="32" y="19" class="pill">AVAILABLE FOR WORK</text></g>
<text x="${pad}" y="106" class="h">${['Let’s', 'build', 'something', 'people', 'use.'].map((w, i) => `<tspan class="word" style="animation-delay:${0.15 + i * 0.09}s"${i === 4 ? ` fill="${T.accent}"` : ''}>${w} </tspan>`).join('')}</text>
<text x="${pad}" y="140" class="s">Full-stack and AI engineering roles · Philippines · remote-friendly</text>
<g clip-path="url(#bc)"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${T.accent}"/><rect class="sheen" x="${bx}" y="${by}" width="80" height="${bh}" fill="url(#sh)"/></g>
${lucide('github', bx + 30, by + bh / 2 - 12, 24, T.onAccent)}
<text x="${bx + 66}" y="${by + bh / 2 + 6}" font-family="${SANS}" font-size="18" font-weight="650" fill="${T.onAccent}">Say hello on GitHub</text>
<g class="arrow">${lucide('arrow-up-right', bx + bw - 44, by + bh / 2 - 10, 20, T.onAccent, 2.4)}</g>
</svg>`;
}

// ------------------------------------------------------------------ WRITE
mkdirSync('assets', { recursive: true });
for (const [name, T] of Object.entries(THEMES)) {
  writeFileSync(`assets/about-${name}.svg`, about(T));
  writeFileSync(`assets/stack-${name}.svg`, stack(T));
  PROJECTS.forEach((p, i) => writeFileSync(`assets/card-${p.id}-${name}.svg`, card(p, T, i)));
  BUTTONS.forEach((b, i) => writeFileSync(`assets/btn-${b.id}-${name}.svg`, button(b, T, i)));
  writeFileSync(`assets/cta-${name}.svg`, cta(T));
  NAV.forEach((n) => writeFileSync(`assets/nav-${n.id}-${name}.svg`, nav(n, T)));
  SECTIONS.forEach((sec) => writeFileSync(`assets/h-${sec.id}-${name}.svg`, header(sec, T)));
}
console.log('Section SVGs written to assets/');
