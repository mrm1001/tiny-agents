/**
 * WCAG 2.1 contrast maths, in one place.
 *
 * Shared by `scripts/check-contrast.mjs` (which audits the palette) and
 * `src/lib/code-theme.mjs` (which repairs syntax-highlighting colours at build
 * time). One implementation, so an audit can never disagree with a fix.
 */

const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

const bytes = (hex) => hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16));
const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** Relative luminance, 0 (black) to 1 (white). */
export const luminance = (colour) => {
  const [r, g, b] = bytes(colour).map((v) => srgb(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Contrast ratio between two opaque colours, 1 to 21. Order-independent. */
export const contrastRatio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Composite `colour` at `alpha` over `over` — what the eye actually receives. */
export const blend = (colour, over, alpha) => {
  const x = bytes(colour);
  const y = bytes(over);
  return hex(x.map((v, i) => v * alpha + y[i] * (1 - alpha)));
};

/**
 * Darken `colour` just far enough to reach `min` against `bg`, keeping its hue.
 *
 * Scaling the RGB channels together holds the hue and saturation ratio steady,
 * so `#d73a49` stays recognisably that red rather than turning muddy. Returns
 * the colour untouched when it already passes, and gives up at black — a colour
 * that cannot reach the ratio even at black means the *background* is wrong.
 */
export const darkenToRatio = (colour, bg, min) => {
  if (contrastRatio(colour, bg) >= min) return colour;
  const start = bytes(colour);
  // 1% steps: fine enough that the result is never visibly darker than needed.
  for (let scale = 0.99; scale > 0; scale -= 0.01) {
    const next = hex(start.map((v) => v * scale));
    if (contrastRatio(next, bg) >= min) return next;
  }
  return '#000000';
};
