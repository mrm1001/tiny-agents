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
 *
 * Syntax highlighting is checked too, and that needed a different mechanism:
 * Shiki writes token colours inline on each span, so parsing the stylesheet can
 * never see them. Instead the last section re-derives the very theme the build
 * ships (`src/lib/code-theme.mjs`) and audits every colour in it. Before this
 * existed the script reported "0 failures" while four token colours on every
 * code block were below AA — true, and meaningless.
 */
import { token as tok, cssNumber } from '../src/lib/theme-tokens.mjs';
import { contrastRatio as ratio, blend } from '../src/lib/contrast.mjs';
import { accessibleCodeTheme, CODE_BG, MIN_RATIO } from '../src/lib/code-theme.mjs';

const lockedOpacity = cssNumber(
  /\.node\[data-status="locked"\]\s*\{\s*opacity:\s*([\d.]+);/,
  'locked-node opacity rule',
);

const P = {
  bg: tok('bg'), bgRaised: tok('bg-raised'), surface: tok('surface'), surfaceHi: tok('surface-hi'),
  border: tok('border'), borderHi: tok('border-hi'),
  fg: tok('fg'), fgStrong: tok('fg-strong'), muted: tok('muted'), faint: tok('faint'),
  accent: tok('accent'), locked: tok('c-locked'), progress: tok('c-progress'), done: tok('c-done'),
  track: tok('c-track'),
  frameFill: tok('c-frame-fill'), nodeFill: tok('c-node-fill'), lockedFill: tok('c-locked-fill'),
  spkUser: tok('spk-user'), spkTool: tok('spk-tool'), white: '#ffffff',
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
  ['notes text',           'fg', 'surface', 4.5],
  ['notes heading',        'fgStrong', 'surface', 4.5],
  ['notes link',           'accent', 'surface', 4.5],
  ['code lifted in notes', 'fg', 'bgRaised', 4.5],
  ['trace label: you',     'spkUser', 'bgRaised', 4.5],
  ['trace label: tool',    'spkTool', 'bgRaised', 4.5],
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
  ['avatar glyph: you',    'white', 'spkUser', 3],
  ['avatar glyph: bot',    'white', 'accent', 3],
  ['avatar glyph: tool',   'white', 'spkTool', 3],
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

// Every foreground in the theme the build actually ships. Token styles that
// carry their own background (diff fills) are measured against that instead.
console.log(`\ncode tokens as shipped (theme repaired in src/lib/code-theme.mjs)`);
const theme = await accessibleCodeTheme();
const codeFails = [];
for (const style of theme.tokenColors ?? []) {
  const { foreground, background } = style.settings ?? {};
  if (!foreground) continue;
  const bg = background ?? CODE_BG;
  const r = ratio(foreground, bg);
  if (r < MIN_RATIO) {
    codeFails.push({ style, r, bg });
    fails++;
  }
}
const scopeOf = (s) => (Array.isArray(s.scope) ? s.scope.join(', ') : (s.scope ?? '?'));
if (codeFails.length === 0) {
  const n = (theme.tokenColors ?? []).filter((s) => s.settings?.foreground).length;
  console.log(`  ok   ${n} token colours, all ≥ ${MIN_RATIO}:1 on ${CODE_BG}`);
} else {
  for (const { style, r, bg } of codeFails)
    console.log(`  FAIL ${scopeOf(style).slice(0, 40).padEnd(40)} ${r.toFixed(2).padStart(6)}  ${style.settings.foreground} on ${bg}`);
}

console.log(`\n${fails === 0 ? 'CONTRAST OK — 0 failures' : `${fails} pair(s) below minimum`}`);
process.exit(fails ? 1 : 0);
