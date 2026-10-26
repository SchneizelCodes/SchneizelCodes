// Builds an animated GitHub activity card from your real contribution data.
// Runs in GitHub Actions (see .github/workflows/snake.yml) and writes:
//   dist/activity-dark.svg and dist/activity-light.svg
//
//   GITHUB_TOKEN=... GH_USER=SchneizelCodes node scripts/build-activity.mjs
//   node scripts/build-activity.mjs --demo        (made-up numbers, for previewing the design)
//
// With the default Actions token only public contributions are counted. To include private
// ones, add a fine-grained token as the repository secret ACTIVITY_TOKEN and turn on
// "Include private contributions on my profile" in your GitHub settings.

import { mkdirSync, writeFileSync } from 'node:fs';
import { THEMES, SANS, MONO, EASE, esc, dotGrid, reducedMotion } from './lib.mjs';
import { snakeCards } from './build-snake-card.mjs';

const USER = process.env.GH_USER || 'SchneizelCodes';
const OUT = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'dist';
const DEMO = process.argv.includes('--demo');

async function gql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-activity-card' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GitHub API: ${res.status} ${JSON.stringify(json.errors || json.message)}`);
  return json.data;
}

// Every contribution day since the account was created, oldest first.
async function fetchDays() {
  const { user } = await gql(`query($u:String!){user(login:$u){createdAt}}`, { u: USER });
  const start = new Date(user.createdAt);
  const now = new Date();
  const days = [];
  for (let from = new Date(start); from < now; ) {
    const to = new Date(Math.min(new Date(from).setFullYear(from.getFullYear() + 1) - 1000, now.getTime()));
    const d = await gql(
      `query($u:String!,$f:DateTime!,$t:DateTime!){user(login:$u){contributionsCollection(from:$f,to:$t){contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`,
      { u: USER, f: from.toISOString(), t: to.toISOString() },
    );
    for (const w of d.user.contributionsCollection.contributionCalendar.weeks) for (const day of w.contributionDays) days.push({ date: day.date, count: day.contributionCount });
    from = new Date(to.getTime() + 1000);
  }
  const seen = new Map(days.map((d) => [d.date, d]));
  return [...seen.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function demoDays() {
  const days = [];
  let seed = 3;
  const r = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const start = new Date('2025-09-14T00:00:00Z');
  for (let t = start; t <= new Date('2026-10-26T00:00:00Z'); t = new Date(t.getTime() + 864e5)) {
    // Shaped like a real profile: quiet for months, then a busy recent stretch.
    const m = t.toISOString().slice(0, 7);
    const [busy, peak] = m >= '2026-10' ? [0.95, 46] : m >= '2026-09' ? [0.6, 8] : m >= '2026-08' ? [0.35, 5] : [0.06, 3];
    days.push({ date: t.toISOString().slice(0, 10), count: r() < busy ? Math.floor(r() * peak) + 1 : 0 });
  }
  return days;
}

// ---------------------------------------------------------------- stats
function stats(days) {
  const total = days.reduce((s, d) => s + d.count, 0);
  let longest = 0, run = 0, longestEnd = null;
  for (const d of days) {
    run = d.count ? run + 1 : 0;
    if (run > longest) { longest = run; longestEnd = d.date; }
  }
  // Weekly streak: consecutive weeks (Sun-Sat) with at least one contribution, counting back
  // from this week. The current week counts once it has a contribution, so a quiet Monday
  // doesn't zero it.
  const weeks = new Map();
  for (const d of days) {
    const t = new Date(`${d.date}T00:00:00Z`);
    const key = new Date(t.getTime() - t.getUTCDay() * 864e5).toISOString().slice(0, 10);
    weeks.set(key, (weeks.get(key) || 0) + d.count);
  }
  const keys = [...weeks.keys()].sort();
  let i = keys.length - 1;
  if (weeks.get(keys[i]) === 0) i--;
  let weekStreak = 0;
  for (; i >= 0 && weeks.get(keys[i]) > 0; i--) weekStreak++;
  // Last 12 months, oldest first.
  const end = new Date(`${days[days.length - 1].date}T00:00:00Z`);
  const months = [];
  for (let k = 11; k >= 0; k--) {
    const m = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - k, 1));
    const key = m.toISOString().slice(0, 7);
    months.push({ label: m.toLocaleString('en', { month: 'short', timeZone: 'UTC' }), count: days.filter((d) => d.date.startsWith(key)).reduce((s, d) => s + d.count, 0) });
  }
  const dow = [0, 0, 0, 0, 0, 0, 0];
  for (const d of days) dow[new Date(`${d.date}T00:00:00Z`).getUTCDay()] += d.count;
  const busiest = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][dow.indexOf(Math.max(...dow))];
  const since = new Date(`${days[0].date}T00:00:00Z`).toLocaleString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const updated = days[days.length - 1].date;
  const monthKey = updated.slice(0, 7);
  const thisMonth = days.filter((d) => d.date.startsWith(monthKey)).reduce((s, d) => s + d.count, 0);
  const monthName = new Date(`${updated}T00:00:00Z`).toLocaleString('en', { month: 'long', timeZone: 'UTC' });
  // Last 16 weeks (Sun-Sat), oldest first, labelled with the week's start date.
  const recent = keys.slice(-16).map((k) => ({ key: k, count: weeks.get(k), label: new Date(`${k}T00:00:00Z`).toLocaleString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }) }));
  return { total, longest, longestEnd, weekStreak, months, busiest, since, updated, thisMonth, monthName, recent };
}

// ---------------------------------------------------------------- drawing
// Odometer number: each digit is a column 0-9 that rolls into place.
function odometer(value, x, y, size, color, delay, cls) {
  const s = value.toLocaleString('en');
  const lh = size * 1.1;
  const cw = size * 0.6;
  let cx = x;
  const parts = [...s].map((ch, i) => {
    if (!/\d/.test(ch)) {
      const out = `<text x="${cx + cw * 0.25}" y="${y}" text-anchor="middle" class="${cls}" fill="${color}">${ch}</text>`;
      cx += cw * 0.5;
      return out;
    }
    const d = +ch;
    const col = Array.from({ length: 10 + d + 1 }, (_, k) => `<text x="${cx + cw / 2}" y="${y + k * lh}" text-anchor="middle" class="${cls}" fill="${color}">${k % 10}</text>`).join('');
    const target = -(10 + d) * lh;
    const out = `<g class="roll" style="--to:${target}px;animation-delay:${delay + i * 0.08}s;transform:translateY(${target}px)">${col}</g>`;
    cx += cw;
    return out;
  });
  return { svg: parts.join(''), width: cx - x, lh };
}

function card(st, T) {
  const W = 1200, H = 360, pad = 36;
  const blocks = [
    { label: 'Total contributions', sub: `Since ${st.since}`, value: st.total, color: T.text },
    { label: `In ${st.monthName}`, sub: 'contributions this month', value: st.thisMonth, color: T.accent },
    { label: 'Weekly streak', sub: 'weeks in a row with commits', value: st.weekStreak, color: T.text },
  ];
  let defs = '';
  const blockSvg = blocks.map((b, i) => {
    const x = pad + i * 205, y = 150;
    const o = odometer(b.value, x, y, 56, b.color, 0.3 + i * 0.25, 'num');
    defs += `<clipPath id="c${i}"><rect x="${x - 4}" y="${y - 56}" width="200" height="${o.lh + 6}"/></clipPath>`;
    return `<g clip-path="url(#c${i})">${o.svg}</g>
      <text x="${x}" y="${y + 40}" class="lbl">${esc(b.label)}</text>
      <text x="${x}" y="${y + 64}" class="sub">${esc(b.sub)}</text>`;
  }).join('');

  // Weekly bars for the last 16 weeks. A square-root scale keeps quieter weeks visible
  // next to a very busy one; the exact numbers are in the description and labels.
  const n = st.recent.length, bx = 690, gap = 8, bw = (470 - gap * (n - 1)) / n, base = 262, maxH = 150;
  const max = Math.max(1, ...st.recent.map((w) => w.count));
  const bars = st.recent.map((w, i) => {
    const h = w.count ? Math.max(6, Math.sqrt(w.count / max) * maxH) : 3;
    const x = bx + i * (bw + gap);
    const last = i === n - 1;
    const peak = w.count === max;
    return `<rect x="${x}" y="${base - h}" width="${bw}" height="${h}" rx="5" fill="${last ? T.accent : T.lineHi}" class="bar" style="transform-origin:${x}px ${base}px;animation-delay:${0.3 + i * 0.04}s"/>
      ${i % 4 === 0 ? `<text x="${x}" y="${base + 24}" class="m">${w.label}</text>` : ''}
      ${peak || last ? `<text x="${x + bw / 2}" y="${base - h - 10}" text-anchor="middle" class="peak"${last ? ` fill="${T.accent}"` : ''}>${w.count}</text>` : ''}`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">GitHub activity for ${esc(USER)}</title>
<desc id="d">${st.total} contributions since ${st.since}. Weekly streak: ${st.weekStreak} weeks. Longest daily streak: ${st.longest} days. ${st.thisMonth} in ${st.monthName}. Most active on ${st.busiest}. Last 16 weeks: ${st.recent.map((w) => `week of ${w.label}: ${w.count}`).join(', ')}.</desc>
<defs>${dotGrid('dots', T)}${defs}</defs>
<style>
  .num{font:700 56px ${SANS};font-variant-numeric:tabular-nums}
  .roll{animation:roll 1.6s ${EASE} backwards}
  @keyframes roll{from{transform:translateY(0)}}
  .lbl{font:600 16px ${SANS};fill:${T.text}}
  .sub{font:400 14px ${SANS};fill:${T.muted}}
  .eyebrow{font:600 13px ${MONO};letter-spacing:2.2px;fill:${T.muted}}
  .note{font:400 15px ${SANS};fill:${T.muted}}
  .m{font:500 12px ${MONO};fill:${T.faint}}
  .peak{font:600 13px ${MONO};fill:${T.text}}
  .bar{animation:grow 14s ${EASE} infinite backwards}
  @keyframes grow{0%{transform:scaleY(0)}8%,92%{transform:scaleY(1)}100%{transform:scaleY(0)}}
  .pulse{animation:pulse 2s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
  ${reducedMotion()}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="24" fill="${T.card}" stroke="${T.line}"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="24" fill="url(#dots)"/>
<circle cx="${pad + 5}" cy="${pad + 10}" r="5" fill="${T.ok}" class="pulse"/>
<text x="${pad + 20}" y="${pad + 15}" class="eyebrow">LIVE FROM GITHUB · UPDATED ${st.updated}</text>
${blockSvg}
<text x="${pad}" y="${H - 34}" class="note">Longest daily streak: ${st.longest} days · most active on ${esc(st.busiest)}</text>
<line x1="650" y1="62" x2="650" y2="${H - 40}" stroke="${T.line}"/>
<text x="${bx}" y="${pad + 15}" class="eyebrow">LAST 16 WEEKS</text>
<line x1="${bx}" y1="${base + 0.5}" x2="${bx + 470}" y2="${base + 0.5}" stroke="${T.line}"/>
${bars}
</svg>`;
}

const days = DEMO ? demoDays() : await fetchDays();
const st = stats(days);
mkdirSync(OUT, { recursive: true });
for (const [name, T] of Object.entries(THEMES)) writeFileSync(`${OUT}/activity-${name}.svg`, card(st, T));
// Wrap snk's snake (already in OUT when the workflow runs snk first) into the spotlight card.
snakeCards({ dir: OUT, days, themes: THEMES, user: USER });
console.log(`Activity card written to ${OUT}/ (${st.total} contributions, ${st.weekStreak}-week streak)`);
