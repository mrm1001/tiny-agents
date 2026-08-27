/**
 * Colour-contrast check for the theme tokens.
 *
 *   node scripts/check-contrast.mjs      (or: npm run check:contrast)
 *
 * The palette is tuned numerically rather than by eye, so it needs a test.
 * Token values are parsed straight out of src/styles/global.css — this script
 * holds no copy of them, so it cannot drift from what actually ships.
 *
 * Minimums are WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for meaningful graphics
 * (diagram edges, status dots, padlocks, focus rings). Pairs below 3:1 are
 * decorative separations (hairlines, fills) where the number just has to be
 * high enough to be visible; those thresholds are our own.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles/global.css'), 'utf8');

const tok = (n) => {
  const m = css.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${n} not found in src/styles/global.css`);
  return m[1];
};
const lockedOpacity = (() => {
  const m = css.match(/\.node\[data-status="locked"\]\s*\{\s*opacity:\s*([\d.]+);/);
  if (!m) throw new Error('locked-node opacity rule not found in src/styles/global.css');
  return parseFloat(m[1]);
})();

const P = {
  bg: tok('bg'), bgRaised: tok('bg-raised'), surface: tok('surface'), surfaceHi: tok('surface-hi'),
  border: tok('border'), borderHi: tok('border-hi'),
  fg: tok('fg'), fgStrong: tok('fg-strong'), muted: tok('muted'), faint: tok('faint'),
  accent: tok('accent'), locked: tok('c-locked'), progress: tok('c-progress'), done: tok('c-done'),
  track: tok('c-track'),
  frameFill: tok('c-frame-fill'), nodeFill: tok('c-node-fill'), lockedFill: tok('c-locked-fill'),
};

const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (h) => {
  const [r, g, b] = h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
/** Composite `col` at `alpha` over `over` — what the eye actually receives. */
const blend = (col, over, alpha) => {
  const x = col.replace('#', '').match(/../g).map((h) => parseInt(h, 16));
  const y = over.replace('#', '').match(/../g).map((h) => parseInt(h, 16));
  return '#' + x.map((v, i) => Math.round(v * alpha + y[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('');
};

// [description, fg token, bg token, minimum]
const TEXT = [
  ['body text',            'fg', 'bg', 4.5],
  ['headings',             'fgStrong', 'bg', 4.5],
  ['lede, blurbs',         'muted', 'bg', 4.5],
  ['panel blurb',          'muted', 'bgRaised', 4.5],
  ['footer, hints, nums',  'faint', 'bg', 4.5],
  ['footer, hints, nums',  'faint', 'bgRaised', 4.5],
  ['links, part heading',  'accent', 'bg', 4.5],
  ['links in panels',      'accent', 'bgRaised', 4.5],
  ['chip: done',           'done', 'bgRaised', 4.5],
  ['chip: in progress',    'progress', 'bgRaised', 4.5],
  ['chip: locked',         'muted', 'bgRaised', 4.5],
  ['node label',           'fgStrong', 'nodeFill', 4.5],
  ['node meta',            'muted', 'nodeFill', 4.5],
  ['locked node label',    'muted', 'lockedFill', 4.5],
  ['locked node meta',     'faint', 'lockedFill', 4.5],
  ['diagram band caption', 'faint', 'frameFill', 4.5],
  ['row text on hover',    'fg', 'surface', 4.5],
  ['inline code',          'fg', 'surface', 4.5],
];

const GRAPHICS = [
  ['diagram edges',        'borderHi', 'frameFill', 3],
  ['node stroke',          'borderHi', 'nodeFill', 3],
  ['focus ring on page',   'accent', 'bg', 3],
  ['focus ring on node',   'accent', 'nodeFill', 3],
  ['status dot: done',     'done', 'nodeFill', 3],
  ['status dot: progress', 'progress', 'nodeFill', 3],
  ['feedback edge',        'progress', 'frameFill', 3],
  ['padlock',              'locked', 'lockedFill', 3],
  ['bar fill: done',       'done', 'track', 3],
  ['bar fill: in progress','progress', 'track', 3],
];

const SEPARATIONS = [
  ['locked node stroke',       'border', 'lockedFill', 1.5],
  ['card and panel border',    'border', 'bgRaised', 1.5],
  ['progress track on panel',  'track', 'bgRaised', 1.25],
  ['hover fill vs node',       'surfaceHi', 'nodeFill', 1.1],
  ['node vs diagram sheet',    'nodeFill', 'frameFill', 1.1],
  ['locked vs unlocked node',  'lockedFill', 'nodeFill', 1.1],
  ['diagram sheet vs page',    'frameFill', 'bg', 1.05],
];

let fails = 0;
const run = (title, rows) => {
  console.log(`\n${title}`);
  for (const [label, f, b, min] of rows) {
    const r = ratio(P[f], P[b]);
    const pass = r >= min;
    if (!pass) fails++;
    console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${label.padEnd(24)} ${r.toFixed(2).padStart(6)}  (min ${min})  ${P[f]} on ${P[b]}`);
  }
};

console.log(`tokens read from src/styles/global.css`);
run('text (WCAG AA, min 4.5:1)', TEXT);
run('meaningful graphics (WCAG AA, min 3:1)', GRAPHICS);
run('visible separations (our own thresholds)', SEPARATIONS);

// Locked nodes are a <g> that may be faded as a whole, which lowers the
// contrast actually rendered for the majority of nodes on the page.
console.log(`\nlocked nodes as rendered (group opacity ${lockedOpacity})`);
const lockedBg = blend(P.lockedFill, P.bg, lockedOpacity);
for (const [label, key, min] of [['label', 'muted', 4.5], ['meta', 'faint', 4.5], ['padlock', 'locked', 3]]) {
  const r = ratio(blend(P[key], P.bg, lockedOpacity), lockedBg);
  const pass = r >= min;
  if (!pass) fails++;
  console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${label.padEnd(24)} ${r.toFixed(2).padStart(6)}  (min ${min})`);
}

console.log(`\n${fails === 0 ? 'CONTRAST OK — 0 failures' : `${fails} pair(s) below minimum`}`);
process.exit(fails ? 1 : 0);
