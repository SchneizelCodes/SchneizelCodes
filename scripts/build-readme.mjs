// Writes README.md and the three theme pages (themes/dark.md, themes/split.md, themes/light.md)
// from one layout, so they never drift apart. Run after build-svgs.mjs and build-sections.mjs:
//   node scripts/build-readme.mjs
//
// Why pages instead of a toggle: GitHub READMEs can't run JavaScript or change GitHub's own
// page background. README.md follows each visitor's GitHub theme (<picture> + prefers-color-scheme);
// the switcher links open the same page rendered fully dark, split, or fully light.
//
// Split mode: everything left of the page centre is dark, everything right of it is light.
// Each image has a "span" (its left and right edge as a fraction of the content width):
// images entirely left use the dark file, entirely right the light file, and images that
// cross the centre use the -split file (built by splitSvg, cut at the right place).

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { splitSvg } from './lib.mjs';

const USER = 'SchneizelCodes';
const REPO = `https://github.com/${USER}/${USER}`;
const REMOTE = `https://raw.githubusercontent.com/${USER}/${USER}/output/`;

// ---------------------------------------------------------------- layout
const img = (base, alt, opts = {}) => ({ base, alt, ...opts }); // opts: width, height, span:[l,r], remote, href
const row = (items, { gapless = false } = {}) => ({ row: items, gapless });

const sections = [
  { anchor: null, items: [img('hero', 'Joshua Manuel Camacho — I build full-stack products, AI-powered tools, accessible learning apps and apps for Filipino users. Full-Stack Engineer, Aspiring AI Engineer, Philippines.')] },
  { switcher: true },
  {
    items: [row([
      img('nav-about', 'About', { height: 38, href: '#about', span: [0.09, 0.26] }),
      img('nav-stack', 'Stack', { height: 38, href: '#stack', span: [0.27, 0.44] }),
      img('nav-projects', 'Projects', { height: 38, href: '#projects', span: [0.415, 0.585] }),
      img('nav-activity', 'Activity', { height: 38, href: '#activity', span: [0.56, 0.73] }),
      img('nav-contact', 'Contact', { height: 38, href: '#contact', span: [0.74, 0.91] }),
    ])],
  },
  {
    anchor: 'about', header: img('h-about', '01 About me'),
    text: "I'm a full-stack engineer from the Philippines who likes building things people actually use, from a marketplace with mobile apps to a sign-language learning system. I work mostly in **TypeScript, React and Next.js** with **Supabase/PostgreSQL**, and I'm growing into **AI engineering**: local models, retrieval and agents that stay private by design.",
    items: [img('about', 'Flagship, live: Tindero, shop, eat, sell and send in one Filipino app, live on desktop and mobile. Exploring: private, local AI with Ollama and retrieval. I care about: security by default, accessibility and tests. Open to: full-stack and AI engineering roles and collaborations.')],
  },
  {
    anchor: 'stack', header: img('h-stack', '02 Tech stack'),
    items: [img('stack', 'Frontend: TypeScript, JavaScript, React, Next.js, Vite, Tailwind CSS, Three.js, Framer Motion, HTML5, CSS. Backend and data: Node.js, Supabase, PostgreSQL, Zod, WebAuthn, row-level security. Mobile and shipping: Capacitor, Vercel, Netlify, GitHub Actions, Git, GitHub. AI and quality: Ollama, Gemini API, RAG and embeddings, Vitest, Figma.')],
  },
  {
    anchor: 'projects', header: img('h-projects', '03 Featured projects'),
    items: [
      row([
        img('feature-tindero', 'Tindero, my flagship project: shop, eat, sell and send in one Filipino app. Verified sellers, food ordering, a pre-loved marketplace and parcel sending. Live on desktop and mobile at tinderoph.vercel.app.', { href: 'https://tinderoph.vercel.app', break: true }),
        img('link-tindero-site', 'Visit Tindero live site', { width: '33.33%', href: 'https://tinderoph.vercel.app', span: [0, 0.3333] }),
        img('link-tindero-fb', 'Tindero on Facebook', { width: '33.33%', href: 'https://www.facebook.com/share/1A3EnLVQAT/?mibextid=wwXIfr', span: [0.3333, 0.6667] }),
        img('link-tindero-repo', 'Tindero repository', { width: '33.33%', href: `https://github.com/${USER}/Tindero`, span: [0.6667, 1] }),
      ], { gapless: true }),
      row([img('card-kamayo', 'Kamayo: interactive Filipino Sign Language learning system with a 100-level path, server-checked progress and row-level security. In development.')]),
      row([img('card-pandeloot', 'PandeLoot: daily loot-drop storefront for Filipino bakery treats with Gemini-powered features. Next.js, Supabase. Deployed on Vercel.', { href: `https://github.com/${USER}/PandeLoot` })]),
      row([img('card-anna', 'Anna: private AI companion that runs entirely on your PC through Ollama, with local retrieval. Runs 100% locally.')]),
      row([img('card-viewer', 'GitHub Profile Viewer: search any GitHub user for live stats, a contribution heatmap, top repos and languages. Live demo.', { href: 'https://playful-pudding-f9a7df.netlify.app' })]),
      row([img('card-portfolio', 'SCHNEIZEL.DEV: my portfolio as a 3D solar system built with React Three Fiber.', { href: `https://github.com/${USER}/SCHNEIZEL.DEV` })]),
    ],
  },
  {
    anchor: 'activity', header: img('h-activity', '04 GitHub activity'),
    items: [
      row([img('activity', 'My GitHub activity: total contributions, contributions this month, weekly streak and contributions per week for the last 16 weeks.', { remote: true })]),
      row([img('snake-card', 'Animated snake eating my contribution graph for the last 12 months, with today and my best day marked, plus last-year totals.', { remote: true })]),
    ],
  },
  {
    anchor: 'contact', header: img('h-contact', '05 Let’s work together'),
    items: [row([
      img('cta', 'Available for work. Let’s build something people use. Full-stack and AI engineering roles, Philippines, remote-friendly. Connect on LinkedIn.', { href: 'https://www.linkedin.com/in/joshua-manuel-camacho-b392963b0/', break: true }),
      img('social-linkedin', 'LinkedIn: Joshua Manuel Camacho', { width: '25%', href: 'https://www.linkedin.com/in/joshua-manuel-camacho-b392963b0/', span: [0, 0.25] }),
      img('social-instagram', 'Instagram: @schneizel_jmnl', { width: '25%', href: 'https://www.instagram.com/schneizel_jmnl/', span: [0.25, 0.5] }),
      img('social-tiktok', 'TikTok: @jmnl_inc', { width: '25%', href: 'https://www.tiktok.com/@jmnl_inc', span: [0.5, 0.75] }),
      img('social-facebook', 'Facebook: Joshua Manuel Camacho', { width: '25%', href: 'https://www.facebook.com/joshuamanuel.camacho', span: [0.75, 1] }),
    ], { gapless: true })],
  },
];

// ---------------------------------------------------------------- theme switcher
const MODES = [
  { id: 'auto', label: 'Auto', span: [0.17, 0.33] },
  { id: 'dark', label: 'Dark', span: [0.34, 0.49] },
  { id: 'split', label: 'Split', span: [0.51, 0.66] },
  { id: 'light', label: 'Light', span: [0.67, 0.83] },
];
const modeHref = (m, fromThemes) => (m === 'auto' ? `https://github.com/${USER}` : fromThemes ? `${m}.md` : `${REPO}/blob/main/themes/${m}.md`);

// ---------------------------------------------------------------- rendering
// Which file a given image uses in a given mode.
function fileFor(it, mode) {
  if (mode === 'dark' || mode === 'light') return `${it.base}-${mode}.svg`;
  const [l, r] = it.span || [0, 1];
  if (r <= 0.5) return `${it.base}-dark.svg`;
  if (l >= 0.5) return `${it.base}-light.svg`;
  return `${it.base}-split.svg`;
}
const sizeAttr = (it) => (it.height ? `height="${it.height}"` : `width="${it.width || '100%'}"`);

// Every image has a desktop file and a phone file (-m). <picture> picks by screen width
// (max-width: 768px) and, on the Auto page, by the visitor's colour scheme.
const PHONE = '(max-width: 768px)';
function tag(it, mode, prefix) {
  const src = (f) => (it.remote ? REMOTE : prefix) + f;
  const alt = it.alt.replace(/"/g, '&quot;');
  const mob = { ...it, base: `${it.base}-m` };
  let el;
  if (mode === 'auto') {
    el = `<picture><source media="${PHONE} and (prefers-color-scheme: dark)" srcset="${src(`${it.base}-m-dark.svg`)}"><source media="${PHONE} and (prefers-color-scheme: light)" srcset="${src(`${it.base}-m-light.svg`)}"><source media="(prefers-color-scheme: dark)" srcset="${src(`${it.base}-dark.svg`)}"><source media="(prefers-color-scheme: light)" srcset="${src(`${it.base}-light.svg`)}"><img alt="${alt}" src="${src(`${it.base}-dark.svg`)}" ${sizeAttr(it)}></picture>`;
  } else {
    el = `<picture><source media="${PHONE}" srcset="${src(fileFor(mob, mode))}"><img alt="${alt}" src="${src(fileFor(it, mode))}" ${sizeAttr(it)}></picture>`;
  }
  return it.href ? `<a href="${it.href}">${el}</a>` : el;
}

function switcher(mode, prefix, fromThemes) {
  const cur = mode;
  const pills = MODES.map((m) => {
    const it = { base: `sw-${m.id}-${m.id === cur ? 'on' : 'off'}`, alt: `${m.label} theme${m.id === cur ? ' (current)' : ''}`, height: 34, span: m.span, href: modeHref(m.id, fromThemes) };
    return tag(it, mode === 'auto' ? 'auto' : mode, prefix);
  });
  return `<p align="center">\n  ${pills.join('\n  ')}\n</p>`;
}

function render(mode) {
  const fromThemes = mode !== 'auto';
  const prefix = fromThemes ? '../assets/' : 'assets/';
  const out = [];
  for (const sec of sections) {
    if (sec.switcher) { out.push(switcher(mode, prefix, fromThemes)); continue; }
    if (sec.anchor) out.push(`<a name="${sec.anchor}"></a>`);
    if (sec.header) out.push(tag(sec.header, mode, prefix));
    if (sec.text) out.push(sec.text);
    for (const item of sec.items || []) {
      if (item.row) {
        const parts = item.row.map((it) => tag(it, mode, prefix) + (it.break ? '<br>' : ''));
        // Gapless rows: no whitespace between the tags so slices meet edge to edge.
        out.push(`<p align="center">\n${item.gapless ? parts.join('') : '  ' + parts.join('\n  ')}\n</p>`);
      } else out.push(tag(item, mode, prefix));
    }
  }
  const note = fromThemes
    ? `\n<p align="center"><sub>Viewing the <b>${mode}</b> theme. GitHub can’t switch themes in place, so each option is its own page. <a href="https://github.com/${USER}">Back to my profile</a></sub></p>\n`
    : '';
  return out.join('\n\n') + '\n' + note;
}

// ---------------------------------------------------------------- split files
// Build -split files for every local image that crosses the page centre, cut at the centre.
function ensureSplits() {
  const all = [];
  for (const sec of sections) {
    if (sec.header) all.push(sec.header);
    for (const item of sec.items || []) (item.row || [item]).forEach((it) => all.push(it));
  }
  MODES.forEach((m) => ['on', 'off'].forEach((st) => all.push({ base: `sw-${m.id}-${st}`, span: m.span })));
  for (const it of all) {
    if (it.remote) continue; // built by the workflow (activity, snake card)
    const [l, r] = it.span || [0, 1];
    if (r <= 0.5 || l >= 0.5) continue;
    for (const v of [it.base, `${it.base}-m`]) {
      const d = `assets/${v}-dark.svg`, lt = `assets/${v}-light.svg`;
      if (!existsSync(d) || !existsSync(lt)) { console.log('missing', v); continue; }
      writeFileSync(`assets/${v}-split.svg`, splitSvg(readFileSync(d, 'utf8'), readFileSync(lt, 'utf8'), (0.5 - l) / (r - l)));
    }
  }
}

ensureSplits();
writeFileSync('README.md', render('auto'));
mkdirSync('themes', { recursive: true });
for (const m of ['dark', 'split', 'light']) writeFileSync(`themes/${m}.md`, render(m));
console.log('README.md and themes/{dark,split,light}.md written');
