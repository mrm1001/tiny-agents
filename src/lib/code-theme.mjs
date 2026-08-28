/**
 * The syntax-highlighting theme, repaired for contrast.
 *
 * `github-light` suits the site but four of its token colours fail WCAG AA
 * against our code-block background: the comment grey (4.37), the keyword red
 * (4.15), the tag green (4.20) and the variable orange (3.17). On a site whose
 * README makes contrast a stated value, unreadable comments are not acceptable.
 *
 * The repair happens here, at the theme, rather than in CSS — and that is
 * forced, not preferred. Shiki writes every token colour inline on the span
 * (`defaultColor: false` only moves it from `color` to a `--shiki-light` custom
 * property; the *value* is still inline), so no stylesheet can override one
 * token without `!important` on every span. Fixing the theme is the only clean
 * seam.
 *
 * `scripts/check-contrast.mjs` re-derives this same theme and asserts every
 * foreground passes, so the repair is verified rather than assumed.
 */
import { bundledThemes } from 'shiki';
import { darkenToRatio, luminance } from './contrast.mjs';
import { token } from './theme-tokens.mjs';

/** Code blocks sit on `--surface`; inline `code` shares it. */
export const CODE_BG = token('surface');
export const MIN_RATIO = 4.5;
const BASE_THEME = 'github-light';

const isHex = (c) => /^#[0-9a-fA-F]{6}$/.test(c ?? '');

/**
 * `github-light` with every token colour pushed just far enough to clear AA.
 *
 * Most styles are a foreground on the code-block background, so the foreground
 * moves. A handful — diff inserted/changed, `carriage-return` — carry their own
 * `background`, and there the pair has to be measured against *that* fill, not
 * against `--surface`. github-light's own diff colours fail there too
 * (4.48, 3.02, 4.42), which the audit found only once it started looking.
 *
 * For those, whichever end is already darker is the end that moves. Darkening
 * near-white `carriage-return` text toward black would technically pass on that
 * red, and would look broken; deepening the red instead keeps white-on-red
 * looking like white-on-red.
 */
export async function accessibleCodeTheme(bg = CODE_BG, min = MIN_RATIO) {
  const mod = await bundledThemes[BASE_THEME]();
  const theme = structuredClone(mod.default ?? mod);

  const fix = (colour, against) =>
    isHex(colour) ? darkenToRatio(colour, against, min) : colour;

  theme.tokenColors = (theme.tokenColors ?? []).map((style) => {
    const { foreground, background } = style.settings ?? {};
    // A style with no foreground contributes no text to read.
    if (!foreground) return style;

    if (!isHex(background)) {
      return { ...style, settings: { ...style.settings, foreground: fix(foreground, bg) } };
    }

    const settings = { ...style.settings };
    if (isHex(foreground) && luminance(foreground) > luminance(background)) {
      settings.background = fix(background, foreground);
    } else {
      settings.foreground = fix(foreground, background);
    }
    return { ...style, settings };
  });

  if (theme.fg) theme.fg = fix(theme.fg, bg);
  if (theme.colors?.['editor.foreground'])
    theme.colors['editor.foreground'] = fix(theme.colors['editor.foreground'], bg);

  // Shiki writes the background inline on the `pre`, so `github-light`'s white
  // would win over the stylesheet's `--surface` — and every ratio above was
  // computed against `--surface`. Pointing the theme at the same token keeps the
  // measurement honest instead of merely plausible.
  theme.bg = bg;
  if (theme.colors) theme.colors['editor.background'] = bg;

  return theme;
}
