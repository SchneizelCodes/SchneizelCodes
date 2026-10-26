// Builds the animated SVGs used in README.md, in a dark and a light version.
// Run: node scripts/build-svgs.mjs   (no dependencies)
//
// Motion rules, taken from the Claude motion videos on prompt-motion.com:
// - One continuous element: the project reel is a single frame whose shape and colour
//   morph between projects, with content swapping through a short blur. No hard cuts.
// - Restraint: soft ease-out, no bounce, no glows, no particle bursts.
// - Seamless loops: every looping animation ends exactly where it starts.
// - Vary the pace: a quick entrance, then slow ambient motion.
// - Respect prefers-reduced-motion: everything settles to a readable still frame.

import { mkdirSync, writeFileSync } from 'node:fs';

const THEMES = {
  dark: {
    bg: '#0d1117', panel: '#161b22', line: '#30363d', text: '#e6edf3', muted: '#8b949e',
    accent: '#2dd4bf', violet: '#a78bfa', star: '#c9d1d9', cell: '#21262d',
    project: { amber: '#f59e0b', green: '#4ade80', pink: '#e879f9', violet: '#a78bfa', teal: '#2dd4bf' },
    green: ['#0e4429', '#006d32', '#26a641', '#39d353'],
  },
  light: {
    bg: '#ffffff', panel: '#f6f8fa', line: '#d0d7de', text: '#1f2328', muted: '#59636e',
    accent: '#0f766e', violet: '#7c3aed', star: '#8c959f', cell: '#ebedf0',
    project: { amber: '#b45309', green: '#15803d', pink: '#a21caf', violet: '#6d28d9', teal: '#0f766e' },
    green: ['#9be9a8', '#40c463', '#30a14e', '#216e39'],
  },
};

const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, 'Cascadia Code', Consolas, 'Liberation Mono', monospace";
const EASE = 'cubic-bezier(.22,1,.36,1)'; // ease-out, no overshoot

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Small deterministic random generator so the stars and heatmap don't change between builds.
const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

// ---------------------------------------------------------------- HERO
function hero(T) {
  const W = 1200, H = 420, cx = 930, cy = 210;
  const r = rng(7);
  const stars = Array.from({ length: 80 }, (_, i) => {
    const x = (r() * (W - 40) + 20).toFixed(1);
    const y = (r() * (H - 40) + 20).toFixed(1);
    const s = (r() * 1.1 + 0.5).toFixed(2);
    const d = (r() * 4 + 3).toFixed(2);
    const delay = (-r() * 6).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${s}" class="star" style="animation-duration:${d}s;animation-delay:${delay}s"/>`;
  }).join('');

  // Each orbit carries one project planet. Colours match the project reel.
  const orbits = [
    { r: 62, c: T.project.amber, s: 3.2, t: 14 }, // Tindero
    { r: 98, c: T.project.green, s: 4.2, t: 22 }, // Kamayo
    { r: 134, c: T.project.pink, s: 3.6, t: 32 }, // PandeLoot
    { r: 170, c: T.violet, s: 4.6, t: 46 }, // Anna
  ];
  const orbitSvg = orbits
    .map(
      (o, i) => `
    <circle cx="${cx}" cy="${cy}" r="${o.r}" fill="none" stroke="${T.line}" stroke-dasharray="3 7"/>
    <g transform="rotate(${[-35, 130, 245, 50][i]} ${cx} ${cy})"><g class="spin" style="animation-duration:${o.t}s">
      <circle cx="${cx + o.r}" cy="${cy}" r="${o.s * 2}" fill="${o.c}"/>
    </g></g>`,
    )
    .join('');

  const phrases = ['full-stack products', 'AI-powered tools', 'accessible learning apps', 'apps for Filipino users'];
  const PH = 3; // seconds per phrase
  const cycle = phrases.length * PH;
  const phraseSvg = phrases
    .map((p, i) => `<text x="0" y="0" class="phrase p${i}" style="animation-delay:${1.4 + i * PH}s">${esc(p)}</text>`)
    .join('');

  const words = [
    { t: 'Joshua', x: 64, y: 190, cls: '' },
    { t: 'Manuel', x: 314, y: 190, cls: '' },
    { t: 'Camacho', x: 64, y: 258, cls: 'accent' },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">Joshua Manuel Camacho</title>
<desc id="d">Full-stack engineer and aspiring AI engineer from the Philippines. I build full-stack products, AI-powered tools, accessible learning apps and apps for Filipino users.</desc>
<style>
  .star{fill:${T.star};animation:twinkle ease-in-out infinite alternate}
  @keyframes twinkle{from{opacity:.15}to{opacity:.75}}
  .spin{transform-origin:${cx}px ${cy}px;animation:spin linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .word{font:700 64px ${SANS};fill:${T.text};letter-spacing:-1.5px;opacity:0;animation:rise .9s ${EASE} forwards}
  .accent{fill:${T.accent}}
  @keyframes rise{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
  .fade{opacity:0;animation:fade .8s ease-out forwards}
  @keyframes fade{to{opacity:1}}
  .eyebrow{font:500 17px ${MONO};fill:${T.muted}}
  .lead{font:400 28px ${SANS};fill:${T.muted}}
  .phrase{font:600 28px ${SANS};fill:${T.text};opacity:0;animation:swap ${cycle}s ${EASE} infinite backwards}
  @keyframes swap{
    0%{opacity:0;transform:translateY(14px);filter:blur(6px)}
    ${((0.5 / cycle) * 100).toFixed(2)}%{opacity:1;transform:none;filter:blur(0)}
    ${(((PH - 0.4) / cycle) * 100).toFixed(2)}%{opacity:1;transform:none;filter:blur(0)}
    ${((PH / cycle) * 100).toFixed(2)}%{opacity:0;transform:translateY(-14px);filter:blur(6px)}
    100%{opacity:0}
  }
  .meta{font:400 16px ${MONO};fill:${T.muted}}
  .dot{fill:${T.accent};animation:pulse 2.4s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
  .core{fill:${T.accent}}
  @media (prefers-reduced-motion: reduce){
    *{animation:none!important}
    .word,.fade,.p0{opacity:1}
  }
</style>
<rect width="${W}" height="${H}" rx="20" fill="${T.bg}"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="20" fill="none" stroke="${T.line}"/>
${stars}
<g class="fade" style="animation-delay:.2s">
  ${orbitSvg}
  <circle cx="${cx}" cy="${cy}" r="30" fill="none" stroke="${T.accent}" stroke-opacity=".35"/>
  <circle cx="${cx}" cy="${cy}" r="18" class="core"/>
</g>
<g class="fade" style="animation-delay:.1s">
  <circle cx="72" cy="104" r="5" class="dot"/>
  <text x="88" y="110" class="eyebrow">hello, I'm</text>
</g>
${words.map((w, i) => `<text x="${w.x}" y="${w.y}" class="word ${w.cls}" style="animation-delay:${0.25 + i * 0.12}s">${w.t}</text>`).join('\n')}
<g transform="translate(64 330)">
  <text x="0" y="0" class="lead fade" style="animation-delay:.8s">I build</text>
  <g transform="translate(104 0)">${phraseSvg}</g>
</g>
<text x="64" y="380" class="meta fade" style="animation-delay:1.1s">Full-Stack Engineer  ·  Aspiring AI Engineer  ·  Philippines</text>
</svg>`;
}

// ---------------------------------------------------------------- PROJECT REEL
const PROJECTS = [
  {
    name: 'Tindero',
    color: 'amber',
    tag: ['Pre-loved and community marketplace for the', 'Philippines. Role-based access, passkey sign-in,', 'and Android/iOS apps from one codebase.'],
    stack: ['TypeScript', 'React', 'Supabase', 'Capacitor', 'WebAuthn'],
    status: 'Web + mobile',
    shape: { x: 650, y: 78, w: 470, h: 284, rx: 18 },
    motif: 'market',
  },
  {
    name: 'Kamayo',
    color: 'green',
    tag: ['Interactive Filipino Sign Language learning', 'system. 100-level path, server-checked progress', 'and row-level security on every record.'],
    stack: ['React 19', 'TypeScript', 'Vite', 'Supabase', 'Vitest'],
    status: 'In development',
    shape: { x: 670, y: 66, w: 440, h: 308, rx: 44 },
    motif: 'path',
  },
  {
    name: 'PandeLoot',
    color: 'pink',
    tag: ['Daily “loot drop” storefront for Filipino', 'bakery treats, with Gemini-powered features', 'and live drops.'],
    stack: ['Next.js', 'TypeScript', 'Supabase', 'Gemini API', 'Framer Motion'],
    status: 'Deployed on Vercel',
    shape: { x: 640, y: 92, w: 480, h: 256, rx: 12 },
    motif: 'crates',
  },
  {
    name: 'Anna',
    color: 'violet',
    tag: ['Private AI companion that runs entirely on your', 'own PC. Reads only approved folders, remembers', 'what you allow, and suggests instead of editing.'],
    stack: ['Node.js', 'Ollama', 'Local RAG', 'Tailscale'],
    status: 'Runs 100% locally',
    shape: { x: 690, y: 78, w: 420, h: 284, rx: 30 },
    motif: 'chat',
  },
  {
    name: 'GitHub Profile Viewer',
    color: 'teal',
    tag: ['Search any GitHub user for live stats, a', 'contribution heatmap with snake animation,', 'top repos and language breakdown.'],
    stack: ['React', 'Vite', 'Tailwind CSS', 'GitHub API'],
    status: 'Live demo',
    shape: { x: 650, y: 78, w: 470, h: 284, rx: 18 },
    motif: 'heatmap',
  },
];

function motif(kind, s, T, c) {
  const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
  if (kind === 'market') {
    // 2 x 2 product cards; one gets a verified badge.
    return [0, 1, 2, 3]
      .map((i) => {
        const x = cx - 170 + (i % 2) * 180, y = cy - 110 + Math.floor(i / 2) * 116;
        return `<rect x="${x}" y="${y}" width="160" height="100" rx="12" fill="${T.panel}" stroke="${T.line}"/>
        <rect x="${x + 12}" y="${y + 12}" width="56" height="56" rx="8" fill="${c}" fill-opacity="${0.18 + i * 0.08}"/>
        <rect x="${x + 80}" y="${y + 18}" width="64" height="8" rx="4" fill="${T.muted}" fill-opacity=".5"/>
        <rect x="${x + 80}" y="${y + 34}" width="44" height="8" rx="4" fill="${T.muted}" fill-opacity=".3"/>
        <rect x="${x + 80}" y="${y + 56}" width="52" height="16" rx="8" fill="${c}" fill-opacity=".9"/>
        ${i === 1 ? `<g class="pop" style="transform-origin:${x + 150}px ${y + 10}px"><circle cx="${x + 150}" cy="${y + 10}" r="13" fill="${c}"/><path d="M${x + 144} ${y + 10}l4 4 8-8" stroke="${T.bg}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>` : ''}`;
      })
      .join('');
  }
  if (kind === 'path') {
    const pts = [
      [cx - 120, cy - 90], [cx + 40, cy - 40], [cx - 70, cy + 30], [cx + 100, cy + 90],
    ];
    const d = pts.map((p, i) => (i ? `L${p[0]} ${p[1]}` : `M${p[0]} ${p[1]}`)).join(' ');
    return `<path d="${d}" stroke="${T.line}" stroke-width="5" stroke-dasharray="10 9" fill="none"/>
      <path d="M${pts[0][0]} ${pts[0][1]} L${pts[1][0]} ${pts[1][1]}" stroke="${c}" stroke-width="5" fill="none" class="draw" pathLength="1"/>
      ${pts
        .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="26" fill="${i < 2 ? c : T.panel}" stroke="${i < 2 ? c : T.line}" stroke-width="3"/>
        ${i === 0 ? `<path d="M${x - 9} ${y}l6 6 12-12" stroke="${T.bg}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
        ${i === 1 ? `<path d="M${x} ${y - 10}l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6-6.2 3.6 1.4-7-5.2-4.8 7-.8z" fill="${T.bg}"/>` : ''}
        ${i > 1 ? `<rect x="${x - 7}" y="${y - 3}" width="14" height="11" rx="2" fill="${T.muted}" fill-opacity=".6"/><path d="M${x - 4} ${y - 3}v-4a4 4 0 0 1 8 0v4" stroke="${T.muted}" stroke-opacity=".6" stroke-width="2.4" fill="none"/>` : ''}`)
        .join('')}`;
  }
  if (kind === 'crates') {
    return [0, 1, 2, 3, 4, 5]
      .map((i) => {
        const x = cx - 165 + (i % 3) * 115, y = cy - 92 + Math.floor(i / 3) * 104;
        const hot = i === 4;
        return `<g ${hot ? 'class="lift"' : ''}><rect x="${x}" y="${y + 14}" width="95" height="74" rx="10" fill="${c}" fill-opacity="${hot ? 0.9 : 0.16}" stroke="${c}" stroke-opacity=".6"/>
          <rect x="${x - 4}" y="${y}" width="103" height="22" rx="8" fill="${c}" fill-opacity="${hot ? 1 : 0.3}"/>
          <rect x="${x + 40}" y="${y}" width="15" height="88" fill="${T.bg}" fill-opacity=".25"/></g>`;
      })
      .join('');
  }
  if (kind === 'chat') {
    return `<rect x="${cx - 20}" y="${cy - 100}" width="170" height="44" rx="18" fill="${c}" fill-opacity=".9"/>
      <rect x="${cx - 2}" y="${cy - 84}" width="120" height="10" rx="5" fill="${T.bg}" fill-opacity=".55"/>
      <rect x="${cx - 160}" y="${cy - 36}" width="230" height="64" rx="18" fill="${T.panel}" stroke="${T.line}"/>
      <rect x="${cx - 140}" y="${cy - 20}" width="180" height="9" rx="4.5" fill="${T.muted}" fill-opacity=".55"/>
      <rect x="${cx - 140}" y="${cy - 2}" width="120" height="9" rx="4.5" fill="${T.muted}" fill-opacity=".35"/>
      <rect x="${cx - 160}" y="${cy + 44}" width="96" height="40" rx="18" fill="${T.panel}" stroke="${T.line}"/>
      ${[0, 1, 2].map((i) => `<circle cx="${cx - 134 + i * 22}" cy="${cy + 64}" r="5" fill="${c}" class="typing" style="animation-delay:${i * 0.18}s"/>`).join('')}
      <g transform="translate(${cx + 10} ${cy + 50})"><rect width="140" height="30" rx="15" fill="${c}" fill-opacity=".15" stroke="${c}" stroke-opacity=".5"/>
      <text x="70" y="20" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${c}">saved to inbox</text></g>`;
  }
  // heatmap with a short snake moving along one row
  const r = rng(11);
  const cols = 18, rows = 7, size = 16, gap = 5;
  const x0 = cx - (cols * (size + gap) - gap) / 2, y0 = cy - (rows * (size + gap) - gap) / 2 - 10;
  const cells = [];
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++) {
      const v = r();
      const fill = v > 0.82 ? T.green[2] : v > 0.7 ? T.green[1] : v > 0.62 ? T.green[0] : T.cell;
      cells.push(`<rect x="${x0 + col * (size + gap)}" y="${y0 + row * (size + gap)}" width="${size}" height="${size}" rx="3" fill="${fill}"/>`);
    }
  const snakeY = y0 + 3 * (size + gap);
  const snake = [0, 1, 2, 3, 4].map((i) => `<rect x="${x0 + i * (size + gap)}" y="${snakeY}" width="${size}" height="${size}" rx="4" fill="${T.violet}" fill-opacity="${1 - i * 0.15}"/>`).join('');
  return `${cells.join('')}<g class="snake">${snake}</g>
    <rect x="${x0}" y="${y0 + rows * (size + gap) + 14}" width="${(cols * (size + gap) - gap) * 0.62}" height="8" rx="4" fill="${c}"/>
    <rect x="${x0 + (cols * (size + gap) - gap) * 0.62}" y="${y0 + rows * (size + gap) + 14}" width="${(cols * (size + gap) - gap) * 0.38}" height="8" rx="4" fill="${T.green[2]}"/>`;
}

function chips(list, x, y, T, c) {
  // Chips stop before the preview window (x = 620) so they never overlap it.
  let cx = x;
  return list
    .filter((s) => {
      const w = s.length * 8.4 + 26;
      const fits = cx + w <= 610;
      if (fits) cx += w + 8;
      return fits;
    })
    .map((s, i, kept) => {
      if (i === 0) cx = x;
      const w = s.length * 8.4 + 26;
      const out = `<rect x="${cx}" y="${y}" width="${w}" height="30" rx="15" fill="${T.bg}" stroke="${T.line}"/><text x="${cx + w / 2}" y="${y + 20}" text-anchor="middle" class="chip">${esc(s)}</text>`;
      cx += w + 8;
      return out;
    })
    .join('');
}

function reel(T) {
  const PROJ = PROJECTS.map((p) => ({ ...p, color: T.project[p.color] }));
  const W = 1200, H = 440, N = PROJECTS.length, SLOT = 4, LOOP = N * SLOT;
  const pct = (sec) => ((sec / LOOP) * 100).toFixed(3);
  const kt = []; // keyTimes for the morphing frame: hold, then move during the last 0.6 s of each slot
  const vals = { x: [], y: [], width: [], height: [], rx: [], stroke: [] };
  PROJ.forEach((p, i) => {
    const a = i * SLOT, b = (i + 1) * SLOT - 0.6;
    kt.push(a / LOOP, b / LOOP);
    for (let k = 0; k < 2; k++) {
      vals.x.push(p.shape.x); vals.y.push(p.shape.y); vals.width.push(p.shape.w); vals.height.push(p.shape.h); vals.rx.push(p.shape.rx); vals.stroke.push(p.color);
    }
  });
  kt.push(1);
  const first = PROJ[0];
  vals.x.push(first.shape.x); vals.y.push(first.shape.y); vals.width.push(first.shape.w); vals.height.push(first.shape.h); vals.rx.push(first.shape.rx); vals.stroke.push(first.color);
  const splines = kt.slice(1).map((_, i) => (i % 2 === 0 ? '0 0 1 1' : '.22 1 .36 1')).join(';');
  const anim = (attr) => `<animate attributeName="${attr}" dur="${LOOP}s" repeatCount="indefinite" calcMode="spline" keyTimes="${kt.map((k) => +k.toFixed(4)).join(';')}" keySplines="${splines}" values="${vals[attr].join(';')}"/>`;

  const slides = PROJ.map((p, i) => {
    const s = p.shape;
    return `<g class="slide" style="animation-delay:${i * SLOT}s">
      <text x="80" y="104" class="idx">${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}</text>
      <circle cx="80" cy="146" r="7" fill="${p.color}"/>
      <text x="98" y="160" class="name">${esc(p.name)}</text>
      ${p.tag.map((l, j) => `<text x="80" y="${206 + j * 28}" class="tag">${esc(l)}</text>`).join('')}
      ${chips(p.stack, 80, 300, T, p.color)}
      <text x="80" y="370" class="status" fill="${p.color}">● ${esc(p.status)}</text>
      <g>${motif(p.motif, s, T, p.color)}</g>
    </g>`;
  }).join('');

  const progress = PROJ.map((p, i) => {
    const x = 860 + i * 52;
    return `<rect x="${x}" y="392" width="44" height="4" rx="2" fill="${T.line}"/>
      <rect x="${x}" y="392" width="44" height="4" rx="2" fill="${p.color}" class="bar" style="transform-origin:${x}px 394px;animation-delay:${i * SLOT}s"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">Featured projects</title>
<desc id="d">${PROJ.map((p) => `${p.name}: ${p.tag.join(' ')}`).map(esc).join(' ')}</desc>
<style>
  .slide{opacity:0;animation:slide ${LOOP}s linear infinite backwards}
  @keyframes slide{
    0%{opacity:0;filter:blur(8px)}
    ${pct(0.45)}%{opacity:1;filter:blur(0)}
    ${pct(SLOT - 0.55)}%{opacity:1;filter:blur(0)}
    ${pct(SLOT - 0.1)}%{opacity:0;filter:blur(8px)}
    100%{opacity:0}
  }
  .idx{font:500 15px ${MONO};fill:${T.muted};letter-spacing:2px}
  .name{font:700 40px ${SANS};fill:${T.text};letter-spacing:-.8px}
  .tag{font:400 19px ${SANS};fill:${T.muted}}
  .chip{font:500 13.5px ${MONO};fill:${T.text}}
  .status{font:600 15px ${MONO}}
  .bar{transform:scaleX(0);animation:bar ${LOOP}s linear infinite backwards}
  @keyframes bar{0%{transform:scaleX(0)}${pct(SLOT)}%{transform:scaleX(1)}${pct(SLOT + 0.01)}%{transform:scaleX(0)}100%{transform:scaleX(0)}}
  .pop{animation:pop 4s ${EASE} infinite}
  @keyframes pop{0%,30%{transform:scale(0)}45%,100%{transform:scale(1)}}
  .lift{animation:lift 4s ${EASE} infinite}
  @keyframes lift{0%,25%{transform:none}45%,85%{transform:translateY(-10px)}100%{transform:none}}
  .typing{animation:typing 1.2s ease-in-out infinite}
  @keyframes typing{0%,100%{opacity:.3}50%{opacity:1}}
  .snake{animation:snake 4s linear infinite}
  @keyframes snake{from{transform:translateX(-30px)}to{transform:translateX(280px)}}
  .draw{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 4s ${EASE} infinite}
  @keyframes draw{0%,20%{stroke-dashoffset:1}55%,100%{stroke-dashoffset:0}}
  @media (prefers-reduced-motion: reduce){
    *{animation:none!important}
    .slide{opacity:0}.s0{opacity:1}
    .bar{transform:scaleX(0)}
  }
</style>
<rect width="${W}" height="${H}" rx="20" fill="${T.bg}"/>
<rect x="40.5" y="30.5" width="${W - 81}" height="${H - 61}" rx="22" fill="${T.panel}" stroke="${T.line}"/>
<rect x="${first.shape.x}" y="${first.shape.y}" width="${first.shape.w}" height="${first.shape.h}" rx="${first.shape.rx}" fill="${T.bg}" stroke="${first.color}" stroke-width="2">
  ${anim('x')}${anim('y')}${anim('width')}${anim('height')}${anim('rx')}${anim('stroke')}
</rect>
${slides.replace('class="slide"', 'class="slide s0"')}
${progress}
</svg>`;
}

// ---------------------------------------------------------------- WRITE
mkdirSync('assets', { recursive: true });
for (const [name, T] of Object.entries(THEMES)) {
  writeFileSync(`assets/hero-${name}.svg`, hero(T));
  writeFileSync(`assets/projects-${name}.svg`, reel(T));
}
console.log('SVGs written to assets/');
