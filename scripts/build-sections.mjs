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
  { key: 'build', eyebrow: 'FLAGSHIP · LIVE', title: 'Tindero', body: 'Shop, eat, sell and send in one Filipino app, live on desktop and mobile.', color: 'accent', icon: 'store' },
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
      ${i === 0 ? tinderoServices(t, T, c) : ''}
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
  .svc{opacity:0;animation:svc 4.8s ease-in-out infinite}
  @keyframes svc{0%,100%{opacity:0}8%,22%{opacity:1}32%{opacity:0}}
  .unlock{animation:unlock 6s ${EASE} infinite}
  @keyframes unlock{0%,45%{fill-opacity:0}60%,100%{fill-opacity:1}}
  .dotty{animation:dotty 1.3s ease-in-out infinite}
  @keyframes dotty{0%,100%{opacity:.25}50%{opacity:1}}
  ${reducedMotion('.tile{opacity:1}.beam{opacity:0}.svc{opacity:0}')}
</style>
<rect width="${W}" height="${H}" fill="${T.bg}"/>
${body}
</svg>`;
}

// Mini learning path inside the Kamayo tile.
// Tindero's four services as chips, lighting up one after another, plus the live address.
function tinderoServices(t, T, c) {
  const items = [['store', 'Shop'], ['utensils', 'Eat'], ['tag', 'Sell'], ['package', 'Send']];
  const y = t.y + t.h - 108, w = 86, gap = 10;
  return items.map(([icon, label], i) => {
    const x = t.x + 28 + i * (w + gap);
    return `<g><rect x="${x}" y="${y}" width="${w}" height="40" rx="12" fill="${T.card2}" stroke="${T.line}"/>
      <rect x="${x}" y="${y}" width="${w}" height="40" rx="12" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-opacity=".55" class="svc" style="animation-delay:${i * 1.2}s"/>
      ${lucide(icon, x + 12, y + 11, 18, T.text)}<text x="${x + 38}" y="${y + 25}" class="pill" fill="${T.text}">${label}</text></g>`;
  }).join('') + `<circle cx="${t.x + 34}" cy="${y + 66}" r="4.5" fill="${T.ok}" class="pulse"/><text x="${t.x + 46}" y="${y + 71}" class="pill" fill="${T.muted}">tinderoph.vercel.app</text>`;
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
  { id: 'tindero', n: '01', kind: 'FLAGSHIP · MARKETPLACE', title: 'Tindero', color: 'amber', icon: 'shopping-bag',
    body: 'Verified sellers, food ordering, a pre-loved marketplace and parcel sending in one app, with role-based access, passkey sign-in and ID checks.',
    stack: ['TypeScript', 'React', 'Next.js', 'Supabase', 'Capacitor', 'WebAuthn'], status: 'Live on desktop and mobile', live: true, cta: 'Visit live site', href: 'https://tinderoph.vercel.app' },
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
  return `${svgOpen(W, H, 'Let’s build something people use', 'Available for work. Full-stack and AI engineering roles and collaborations. Philippines, remote-friendly. Connect on LinkedIn.')}
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
${(() => { const t = topShape(W, H, 24); return `<path d="${t.fill}" fill="${T.card}"/><path d="${t.fill}" fill="url(#dots)"/><path d="${t.fill}" fill="url(#glow)"/><path d="${t.edge}" fill="none" stroke="${T.line}"/>`; })()}
<g transform="translate(${pad} 34)"><rect width="196" height="28" rx="14" fill="${T.ok}" fill-opacity=".1" stroke="${T.ok}" stroke-opacity=".4"/>
  <circle cx="18" cy="14" r="4.5" fill="${T.ok}" class="pulse"/><text x="32" y="19" class="pill">AVAILABLE FOR WORK</text></g>
<text x="${pad}" y="106" class="h">${['Let’s', 'build', 'something', 'people', 'use.'].map((w, i) => `<tspan class="word" style="animation-delay:${0.15 + i * 0.09}s"${i === 4 ? ` fill="${T.accent}"` : ''}>${w} </tspan>`).join('')}</text>
<text x="${pad}" y="140" class="s">Full-stack and AI engineering roles · Philippines · remote-friendly</text>
<g clip-path="url(#bc)"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${T.accent}"/><rect class="sheen" x="${bx}" y="${by}" width="80" height="${bh}" fill="url(#sh)"/></g>
${lucide('linkedin', bx + 30, by + bh / 2 - 12, 24, T.onAccent)}
<text x="${bx + 66}" y="${by + bh / 2 + 6}" font-family="${SANS}" font-size="18" font-weight="650" fill="${T.onAccent}">Connect on LinkedIn</text>
<g class="arrow">${lucide('arrow-up-right', bx + bw - 44, by + bh / 2 - 10, 20, T.onAccent, 2.4)}</g>
</svg>`;
}

// ---- Sliced cards ---------------------------------------------------------------
// GitHub links a whole image, so a card with several buttons is built from slices:
// a top piece (rounded top corners, open at the bottom) and a footer row of one slice per
// button (rounded bottom corners on the outer slices), placed edge to edge in the README.
// A hairline divider is drawn at the top of the footer so any small gap GitHub leaves
// between the rows reads as the same divider.
function topShape(W, H, r) {
  const fill = `M0 ${H}V${r}A${r} ${r} 0 0 1 ${r} 0H${W - r}A${r} ${r} 0 0 1 ${W} ${r}V${H}Z`;
  const edge = `M.5 ${H}V${r}A${r - 0.5} ${r - 0.5} 0 0 1 ${r} .5H${W - r}A${r - 0.5} ${r - 0.5} 0 0 1 ${W - 0.5} ${r}V${H}`;
  return { fill, edge };
}
function footShape(W, H, r, first, last) {
  const rl = first ? r : 0, rr = last ? r : 0;
  const fill = `M0 0H${W}V${H - rr}${rr ? `A${rr} ${rr} 0 0 1 ${W - rr} ${H}` : ''}H${rl}${rl ? `A${rl} ${rl} 0 0 1 0 ${H - rl}` : `H0`}Z`;
  const edge = `${last ? `M${W - 0.5} 0V${H - rr}${rr ? `A${rr - 0.5} ${rr - 0.5} 0 0 1 ${W - rr} ${H - 0.5}` : ''}` : `M${W} ${H - 0.5}`}H${rl}${first ? (rl ? `A${rl - 0.5} ${rl - 0.5} 0 0 1 .5 ${H - rl}V0` : 'V0') : ''}`;
  return { fill, edge };
}
// One footer slice: card background, divider, an optional cell separator, and content.
function footSlice({ W, H, r, i, n, T, title, desc, body }) {
  const f = footShape(W, H, r, i === 0, i === n - 1);
  return `${svgOpen(W, H, title, desc)}
<defs>${dotGrid('dots', T, 20)}</defs>
<path d="${f.fill}" fill="${T.card}"/><path d="${f.fill}" fill="url(#dots)"/>
<path d="${f.edge}" fill="none" stroke="${T.line}"/>
<line x1="${i === 0 ? 24 : 0}" y1=".5" x2="${i === n - 1 ? W - 24 : W}" y2=".5" stroke="${T.line}"/>
${i < n - 1 ? `<line x1="${W - 0.5}" y1="18" x2="${W - 0.5}" y2="${H - 18}" stroke="${T.line}"/>` : ''}
${body}
</svg>`;
}

// Featured Tindero card: copy on the left, a desktop and a phone showing the app on the right.
function tinderoFeature(T) {
  const W = 1200, H = 380, pad = 44, c = T.accent;
  const p = PROJECTS[0];
  const lines = wrap(p.body, 19, 580).slice(0, 3);
  let cx = pad;
  const chips = p.stack.map((s) => { const w = textW(s, 14, true) + 22; const o = `<rect x="${cx}" y="0" width="${w}" height="30" rx="15" fill="${T.card2}" stroke="${T.line}"/><text x="${cx + w / 2}" y="20" text-anchor="middle" class="chip">${esc(s)}</text>`; cx += w + 7; return o; }).join('');
  // Stylised screens (no copied UI): header bar, search, service row and product tiles.
  const screen = (x, y, w, h, cols, scale) => {
    const g = 10 * scale, tw = (w - g * (cols + 1)) / cols, th = tw * 1.05;
    let tiles = '';
    for (let r = 0; r < 3; r++) for (let k = 0; k < cols; k++) {
      const tx = x + g + k * (tw + g), ty = y + 64 * scale + r * (th + g);
      if (ty + th > y + h) continue;
      tiles += `<g class="tile" style="animation-delay:${(r * cols + k) * 0.25}s"><rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${6 * scale}" fill="${T.card2}"/><rect x="${tx}" y="${ty}" width="${tw}" height="${th * 0.62}" rx="${6 * scale}" fill="${(r + k) % 3 === 0 ? c : T.lineHi}" fill-opacity="${(r + k) % 3 === 0 ? 0.28 : 0.6}"/><rect x="${tx + 6 * scale}" y="${ty + th * 0.7}" width="${tw * 0.6}" height="${5 * scale}" rx="${2.5 * scale}" fill="${T.muted}" fill-opacity=".5"/><rect x="${tx + 6 * scale}" y="${ty + th * 0.84}" width="${tw * 0.35}" height="${5 * scale}" rx="${2.5 * scale}" fill="${c}"/></g>`;
    }
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T.bg}"/>
      <rect x="${x}" y="${y}" width="${w}" height="${26 * scale}" fill="${T.card2}"/>
      <rect x="${x + g}" y="${y + 8 * scale}" width="${30 * scale}" height="${10 * scale}" rx="${3 * scale}" fill="${c}"/>
      <rect x="${x + g}" y="${y + 34 * scale}" width="${w - g * 2}" height="${20 * scale}" rx="${10 * scale}" fill="${T.card2}" stroke="${T.line}"/>
      <g clip-path="url(#clip-${Math.round(x)})"><g class="scroll">${tiles}</g></g>
      <clipPath id="clip-${Math.round(x)}"><rect x="${x}" y="${y + 60 * scale}" width="${w}" height="${h - 60 * scale}"/></clipPath>`;
  };
  const dx = 690, dy = 58, dw = 420, dh = 262;
  const px = 1040, py = 110, pw = 118, ph = 236;
  return `${svgOpen(W, H, 'Tindero — flagship project', `${p.body} Built with ${p.stack.join(', ')}. ${p.status} at tinderoph.vercel.app.`)}
<defs>${dotGrid('dots', T, 20)}
  <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${dx + dw / 2} ${H / 2}) scale(420 260)"><stop offset="0" stop-color="${c}" stop-opacity=".12"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
</defs>
<style>
  ${beamCss}
  .k{font:600 13px ${MONO};letter-spacing:2px;fill:${c}}
  .title{font:700 46px ${SANS};fill:${T.text};letter-spacing:-1.2px}
  .tag{font:600 21px ${SANS};fill:${T.text}}
  .body{font:400 19px ${SANS};fill:${T.muted}}
  .chip{font:500 14px ${MONO};fill:${T.text}}
  .st{font:600 14px ${MONO};fill:${T.text}}
  .url{font:500 12px ${MONO};fill:${T.muted}}
  .tile{animation:tile 9s ${EASE} infinite backwards}
  @keyframes tile{0%{opacity:0;transform:translateY(8px)}6%,90%{opacity:1;transform:none}100%{opacity:0}}
  .scroll{animation:scroll 9s ease-in-out infinite}
  @keyframes scroll{0%,40%{transform:none}55%,85%{transform:translateY(-40px)}100%{transform:none}}
  .pulse{animation:pulse 2s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
  .ring{animation:ring 2s ease-out infinite;transform-box:fill-box;transform-origin:center}
  @keyframes ring{0%{transform:scale(.6);opacity:.7}100%{transform:scale(2.4);opacity:0}}
  .float{animation:float 7s ease-in-out infinite}@keyframes float{0%,100%{transform:none}50%{transform:translateY(-6px)}}
  ${reducedMotion('.tile{opacity:1}.beam,.ring{opacity:0}')}
</style>
${(() => { const t = topShape(W, H, 26); return `<path d="${t.fill}" fill="${T.card}"/><path d="${t.fill}" fill="url(#dots)"/><path d="${t.fill}" fill="url(#glow)"/><path d="${t.edge}" fill="none" stroke="${T.line}"/>`; })()}
<text x="${pad}" y="${pad + 14}" class="k">01 · ${esc(p.kind)}</text>
<text x="${pad}" y="${pad + 66}" class="title">Tindero</text>
<text x="${pad}" y="${pad + 102}" class="tag">Shop, eat, sell and send in one Filipino app.</text>
${lines.map((l, j) => `<text x="${pad}" y="${pad + 140 + j * 28}" class="body">${esc(l)}</text>`).join('')}
<g transform="translate(0 ${H - 104})">${chips}</g>
<g transform="translate(${pad} ${H - 56})"><rect width="${textW(p.status, 14, true) + 44}" height="32" rx="16" fill="${T.card2}" stroke="${T.line}"/>
  <circle cx="17" cy="16" r="4.5" fill="${T.ok}" class="ring"/><circle cx="17" cy="16" r="4.5" fill="${T.ok}" class="pulse"/><text x="30" y="21" class="st">${esc(p.status)}</text></g>
<g class="float">
  <rect x="${dx - 10}" y="${dy - 10}" width="${dw + 20}" height="${dh + 34}" rx="16" fill="${T.card2}" stroke="${T.lineHi}"/>
  <circle cx="${dx + 4}" cy="${dy + 2}" r="3.5" fill="${T.lineHi}"/><circle cx="${dx + 16}" cy="${dy + 2}" r="3.5" fill="${T.lineHi}"/><circle cx="${dx + 28}" cy="${dy + 2}" r="3.5" fill="${T.lineHi}"/>
  <rect x="${dx + 120}" y="${dy - 4}" width="180" height="14" rx="7" fill="${T.bg}"/><text x="${dx + 210}" y="${dy + 7}" text-anchor="middle" class="url">tinderoph.vercel.app</text>
  ${screen(dx, dy + 16, dw, dh, 4, 1)}
</g>
<g class="float" style="animation-delay:-3s">
  <rect x="${px - 7}" y="${py - 7}" width="${pw + 14}" height="${ph + 14}" rx="22" fill="${T.card2}" stroke="${T.lineHi}"/>
  <g clip-path="url(#phone)">${screen(px, py, pw, ph, 2, 0.62)}</g>
  <clipPath id="phone"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="16"/></clipPath>
</g>
</svg>`;
}

// Small link pill: one primary (accent fill) or quiet outline, with a brand or outline icon.
function linkPill(o, T) {
  const H = 52, w = Math.round(textW(o.label, 17) + 118), fg = o.primary ? T.onAccent : T.text;
  const icon = o.brand ? brand(o.brand, 22, H / 2 - 11, 22, T) : lucide(o.icon, 22, H / 2 - 11, 22, o.primary ? fg : (o.iconColor || T.text));
  return `${svgOpen(w, H, o.label, o.label)}
<rect x=".75" y=".75" width="${w - 1.5}" height="${H - 1.5}" rx="${H / 2}" fill="${o.primary ? T.accent : T.card}" stroke="${o.primary ? T.accent : T.lineHi}" stroke-width="1.5"/>
${icon}
<text x="56" y="${H / 2 + 6}" font-family="${SANS}" font-size="17" font-weight="650" fill="${fg}">${esc(o.label)}</text>
${lucide('arrow-up-right', w - 36, H / 2 - 9, 18, o.primary ? fg : T.faint, 2.2)}
</svg>`;
}
const LINKS = [
  { id: 'tindero-site', label: 'Visit live site', icon: 'globe', primary: true },
  { id: 'tindero-fb', label: 'Tindero on Facebook', brand: 'facebook' },
  { id: 'tindero-repo', label: 'View repo', icon: 'github' },
];

// Social buttons for the Connect row: brand icon, network name and handle.
const SOCIALS = [
  { id: 'linkedin', name: 'LinkedIn', handle: 'Joshua M. Camacho', icon: 'linkedin', color: '#0A66C2' },
  { id: 'instagram', name: 'Instagram', handle: '@schneizel_jmnl', brand: 'instagram' },
  { id: 'tiktok', name: 'TikTok', handle: '@jmnl_inc', brand: 'tiktok' },
  { id: 'facebook', name: 'Facebook', handle: 'Joshua M. Camacho', brand: 'facebook' },
];
function social(o, T) {
  const W = 260, H = 72;
  const icon = o.brand ? brand(o.brand, 22, 22, 28, T) : lucide(o.icon, 22, 22, 28, T.bg === '#ffffff' ? o.color : '#4D9DE0', 2);
  return `${svgOpen(W, H, `${o.name}: ${o.handle}`, `${o.name} profile ${o.handle}`)}
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="18" fill="${T.card}" stroke="${T.line}" stroke-width="1.5"/>
<rect x="12" y="12" width="48" height="48" rx="13" fill="${T.card2}"/>
${icon}
<text x="76" y="32" font-family="${SANS}" font-size="17" font-weight="650" fill="${T.text}">${esc(o.name)}</text>
<text x="76" y="53" font-family="${MONO}" font-size="12.5" fill="${T.muted}">${esc(o.handle.length > 20 ? o.handle.slice(0, 19) + '…' : o.handle)}</text>
${lucide('arrow-up-right', W - 36, H / 2 - 9, 18, T.faint, 2.2)}
</svg>`;
}

// Tindero footer: three slices, each holding one button centred in its cell.
function linkSlice(o, T, i, n) {
  const W = 1200 / n, H = 96, bh = 52, bw = 300, bx = (W - bw) / 2, by = (H - bh) / 2 - 2;
  const fg = o.primary ? T.onAccent : T.text;
  const icon = o.brand ? brand(o.brand, bx + 22, by + bh / 2 - 11, 22, T) : lucide(o.icon, bx + 22, by + bh / 2 - 11, 22, fg);
  return footSlice({ W, H, r: 26, i, n, T, title: o.label, desc: o.label, body: `
<rect x="${bx + 0.75}" y="${by + 0.75}" width="${bw - 1.5}" height="${bh - 1.5}" rx="${bh / 2}" fill="${o.primary ? T.accent : T.card2}" stroke="${o.primary ? T.accent : T.lineHi}" stroke-width="1.5"/>
${icon}
<text x="${bx + 58}" y="${by + bh / 2 + 6}" font-family="${SANS}" font-size="17" font-weight="650" fill="${fg}">${esc(o.label)}</text>
${lucide('arrow-up-right', bx + bw - 38, by + bh / 2 - 9, 18, o.primary ? fg : T.faint, 2.2)}` });
}

// Contact footer: four slices, one per social profile.
function socialSlice(o, T, i, n) {
  const W = 1200 / n, H = 104, x = 26, y = 26;
  const icon = o.brand ? brand(o.brand, x + 11, y + 11, 26, T) : lucide(o.icon, x + 11, y + 11, 26, T.bg === '#ffffff' ? o.color : '#4D9DE0', 2);
  return footSlice({ W, H, r: 24, i, n, T, title: `${o.name}: ${o.handle}`, desc: `${o.name} profile ${o.handle}`, body: `
<rect x="${x}" y="${y}" width="48" height="48" rx="13" fill="${T.card2}" stroke="${T.line}"/>
${icon}
<text x="${x + 64}" y="${y + 20}" font-family="${SANS}" font-size="18" font-weight="650" fill="${T.text}">${esc(o.name)}</text>
<text x="${x + 64}" y="${y + 42}" font-family="${MONO}" font-size="13" fill="${T.muted}">${esc(o.handle)}</text>
${lucide('arrow-up-right', W - 44, y + 15, 18, T.faint, 2.2)}` });
}

// ------------------------------------------------------------------ WRITE
mkdirSync('assets', { recursive: true });
for (const [name, T] of Object.entries(THEMES)) {
  writeFileSync(`assets/about-${name}.svg`, about(T));
  writeFileSync(`assets/stack-${name}.svg`, stack(T));
  PROJECTS.forEach((p, i) => writeFileSync(`assets/card-${p.id}-${name}.svg`, card(p, T, i)));
  BUTTONS.forEach((b, i) => writeFileSync(`assets/btn-${b.id}-${name}.svg`, button(b, T, i)));
  writeFileSync(`assets/cta-${name}.svg`, cta(T));
  writeFileSync(`assets/feature-tindero-${name}.svg`, tinderoFeature(T));
  LINKS.forEach((o, i) => writeFileSync(`assets/link-${o.id}-${name}.svg`, linkSlice(o, T, i, LINKS.length)));
  SOCIALS.forEach((o, i) => writeFileSync(`assets/social-${o.id}-${name}.svg`, socialSlice(o, T, i, SOCIALS.length)));
  NAV.forEach((n) => writeFileSync(`assets/nav-${n.id}-${name}.svg`, nav(n, T)));
  SECTIONS.forEach((sec) => writeFileSync(`assets/h-${sec.id}-${name}.svg`, header(sec, T)));
}
console.log('Section SVGs written to assets/');
