// Turns the plain snake SVGs from Platane/snk into the README's spotlight card:
// amber contribution heatmap, month and weekday labels, a legend, markers for today and
// the best day, and a row of last-year stats — all around the original snake animation.
//
// Called from build-activity.mjs (which already has the day-by-day data) after snk has
// written dist/snake.svg and dist/snake-dark.svg. Writes dist/snake-card-{dark,light}.svg.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { SANS, MONO, EASE, esc, dotGrid, reducedMotion } from './lib.mjs';

// Heatmap scale: tints of the single amber accent, so the snake card matches the page.
const HEAT = {
  dark: { ce: '#151e2e', c1: '#3a2a12', c2: '#6b4812', c3: '#b7740c', c4: '#f59e0b', cb: '#0b0f1700', cs: '#e6edf3' },
  light: { ce: '#eceff3', c1: '#fde8c4', c2: '#f6c46f', c3: '#de8a0d', c4: '#b45309', cb: '#ffffff00', cs: '#111827' },
};

export function snakeCards({ dir, days, themes, user }) {
  for (const [name, T] of Object.entries(themes)) {
    const src = `${dir}/${name === 'dark' ? 'snake-dark' : 'snake'}.svg`;
    if (!existsSync(src)) { console.log(`skip snake card: ${src} not found`); continue; }
    writeFileSync(`${dir}/snake-card-${name}.svg`, card(readFileSync(src, 'utf8'), days, T, HEAT[name], user));
  }
}

function card(raw, days, T, H, user) {
  // --- read the snake SVG: viewBox, inner markup, and the grid geometry.
  const vb = raw.match(/viewBox="([-\d.\s]+)"/)[1].split(/\s+/).map(Number);
  // Crop snk's empty margins (the snake can still move into them: overflow is visible).
  // Its own progress bar (.u) is hidden — the stats row replaces it.
  vb[1] = -6; vb[3] = 124;
  let inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<desc>[\s\S]*?<\/desc>/, '');
  // Recolour: replace snk's colour variables with the amber scale.
  inner = inner.replace(/:root\{[^}]*\}/, `.u{display:none}:root{--cb:${H.cb};--cs:${H.cs};--ce:${H.ce};--c0:${H.ce};--c1:${H.c1};--c2:${H.c2};--c3:${H.c3};--c4:${H.c4}}`);
  const cells = [...raw.matchAll(/<rect class="c[^"]*" x="([\d.]+)" y="([\d.]+)"/g)].map((m) => [+m[1], +m[2]]);
  const cols = Math.round(Math.max(...cells.map((c) => c[0])) / 16) + 1;

  // --- layout: the snake graph scaled into the card.
  const W = 1200, pad = 44, gx = pad + 40, gw = W - gx - pad, s = gw / vb[2], gy = 176, gh = vb[3] * s;
  const HH = Math.round(gy + gh + 146);
  const at = (vx, vy) => [gx + (vx - vb[0]) * s, gy + (vy - vb[1]) * s];
  const cell = (col, row) => at(col * 16, row * 16); // top-left of a cell
  const size = 12 * s;

  // --- dates: the last column is the current week; rows are Sunday..Saturday.
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  const today = new Date(`${days[days.length - 1].date}T00:00:00Z`);
  const dayMs = 864e5;
  const weekStart = new Date(today.getTime() - today.getUTCDay() * dayMs);
  const colDate = (c) => new Date(weekStart.getTime() - (cols - 1 - c) * 7 * dayMs);
  const posOf = (iso) => {
    const d = new Date(`${iso}T00:00:00Z`);
    const ws = new Date(d.getTime() - d.getUTCDay() * dayMs);
    const col = cols - 1 - Math.round((weekStart - ws) / (7 * dayMs));
    return col >= 0 ? cell(col, d.getUTCDay()) : null;
  };

  // Month labels where a new month starts.
  let months = '', last = -1;
  for (let c = 0; c < cols; c++) {
    const d = colDate(c);
    const m = new Date(d.getTime() + 6 * dayMs).getUTCMonth();
    if (m !== last && c < cols - 2) {
      const [x] = cell(c, 0);
      months += `<text x="${x}" y="${cell(0, 0)[1] - 12}" class="lab">${new Date(Date.UTC(2000, m, 1)).toLocaleString('en', { month: 'short', timeZone: 'UTC' })}</text>`;
    }
    last = m;
  }
  const weekdays = [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']].map(([r, l]) => { const [, y] = cell(0, r); return `<text x="${gx - 12}" y="${y + size - 2}" text-anchor="end" class="lab">${l}</text>`; }).join('');

  // Last-year stats from the same window as the graph.
  const from = colDate(0).toISOString().slice(0, 10);
  const year = days.filter((d) => d.date >= from);
  const total = year.reduce((n, d) => n + d.count, 0);
  const active = year.filter((d) => d.count > 0).length;
  const best = year.reduce((b, d) => (d.count > b.count ? d : b), { count: -1 });
  let run = 0, longest = 0;
  for (const d of year) { run = d.count ? run + 1 : 0; longest = Math.max(longest, run); }
  const fmt = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });

  // Markers: today (pulsing ring) and best day (ring + tag).
  const tPos = posOf(days[days.length - 1].date);
  const bPos = best.count > 0 ? posOf(best.date) : null;
  const ring = (p, cls) => p ? `<rect x="${p[0] - 3}" y="${p[1] - 3}" width="${size + 6}" height="${size + 6}" rx="5" fill="none" stroke="${T.accent}" stroke-width="2" class="${cls}"/>` : '';
  const tag = (p, text, up) => {
    if (!p) return '';
    const w = text.length * 7.6 + 18, x = Math.min(Math.max(p[0] + size / 2 - w / 2, gx), W - pad - w), y = up ? cell(0, 0)[1] - 64 : cell(0, 6)[1] + size + 14;
    const ly1 = up ? y + 24 : p[1] + size + 3, ly2 = up ? p[1] - 3 : y;
    return `<line x1="${p[0] + size / 2}" y1="${ly1}" x2="${p[0] + size / 2}" y2="${ly2}" stroke="${T.accent}" stroke-opacity=".6" stroke-dasharray="2 3"/>
      <rect x="${x}" y="${y}" width="${w}" height="24" rx="12" fill="${T.card2}" stroke="${T.accent}" stroke-opacity=".5"/>
      <text x="${x + w / 2}" y="${y + 16}" text-anchor="middle" class="tag">${esc(text)}</text>`;
  };

  const legend = (() => {
    const x0 = W - pad - 5 * 18 - 84, y = 70;
    return `<text x="${x0}" y="${y + 11}" class="lab">Less</text>${[H.ce, H.c1, H.c2, H.c3, H.c4].map((c, i) => `<rect x="${x0 + 38 + i * 18}" y="${y}" width="13" height="13" rx="3" fill="${c}"/>`).join('')}<text x="${x0 + 38 + 5 * 18 + 4}" y="${y + 11}" class="lab">More</text>`;
  })();

  const stats = [
    [total.toLocaleString('en'), 'contributions in the last year'],
    [String(active), 'active days'],
    [String(longest), 'longest streak (days)'],
    [best.count > 0 ? String(best.count) : '0', best.count > 0 ? `best day · ${fmt(best.date)}` : 'best day'],
  ];
  const statY = gy + gh + 92;
  const statsSvg = stats.map(([v, l], i) => {
    const x = pad + i * ((W - pad * 2) / 4);
    return `<text x="${x}" y="${statY}" class="sv"${i === 0 ? ` fill="${T.accent}"` : ''}>${v}</text><text x="${x}" y="${statY + 24}" class="sl">${esc(l)}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${HH}" viewBox="0 0 ${W} ${HH}" role="img" aria-labelledby="st sd">
<title id="st">Contribution graph for ${esc(user)}</title>
<desc id="sd">An animated snake eats the squares of the contribution graph. ${total} contributions in the last year across ${active} active days. Longest streak ${longest} days. Best day ${best.count > 0 ? `${fmt(best.date)} with ${best.count} contributions` : 'none yet'}.</desc>
<defs>${dotGrid('sdots', T)}</defs>
<style>
  .lab{font:500 13px ${MONO};fill:${T.faint}}
  .eb{font:600 13px ${MONO};letter-spacing:2.2px;fill:${T.muted}}
  .tt{font:700 30px ${SANS};fill:${T.text};letter-spacing:-.6px}
  .tag{font:600 12.5px ${MONO};fill:${T.text}}
  .sv{font:700 30px ${SANS};fill:${T.text};font-variant-numeric:tabular-nums}
  .sl{font:400 14px ${SANS};fill:${T.muted}}
  .today{animation:ring 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
  @keyframes ring{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(1.25)}}
  .best{animation:fadein 1s ${EASE} 1s backwards}@keyframes fadein{from{opacity:0}}
  .pulse{animation:pulse 2s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
  ${reducedMotion()}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${HH - 1}" rx="24" fill="${T.card}" stroke="${T.line}"/>
<rect x=".5" y=".5" width="${W - 1}" height="${HH - 1}" rx="24" fill="url(#sdots)"/>
<circle cx="${pad + 5}" cy="${pad + 6}" r="5" fill="${T.ok}" class="pulse"/>
<text x="${pad + 20}" y="${pad + 11}" class="eb">CONTRIBUTION GRAPH · LAST 12 MONTHS</text>
<text x="${pad}" y="${pad + 52}" class="tt">Every square is a day of work. <tspan fill="${T.accent}">The snake eats them all.</tspan></text>
${legend}
${months}${weekdays}
<svg x="${gx}" y="${gy}" width="${gw}" height="${gh}" viewBox="${vb.join(' ')}" overflow="visible">${inner}</svg>
${ring(bPos, 'best')}${tag(bPos, `best day · ${best.count}`, true)}
${ring(tPos, 'today')}${tag(tPos, 'today', false)}
<line x1="${pad}" y1="${statY - 44}" x2="${W - pad}" y2="${statY - 44}" stroke="${T.line}"/>
${statsSvg}
</svg>`;
}
