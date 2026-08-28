/**
 * Reads palette tokens straight out of `src/styles/global.css`.
 *
 * Nothing outside that file may hold a copy of a colour: the build (syntax
 * highlighting) and the audit (`check-contrast.mjs`) both need real values, and
 * a second copy is a second thing to forget. Parsing the stylesheet means a
 * palette change lands everywhere at once, or fails loudly.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const cssPath = join(dirname(fileURLToPath(import.meta.url)), '../styles/global.css');
const css = readFileSync(cssPath, 'utf8');

/** Hex value of `--<name>`, e.g. `token('surface')`. Throws if it is gone. */
export const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found in src/styles/global.css`);
  return m[1];
};

/** A numeric value out of a one-line rule, for the composited-opacity checks. */
export const cssNumber = (pattern, what) => {
  const m = css.match(pattern);
  if (!m) throw new Error(`${what} not found in src/styles/global.css`);
  return parseFloat(m[1]);
};
