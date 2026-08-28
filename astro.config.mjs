// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import { satteri } from '@astrojs/markdown-satteri';

import { accessibleCodeTheme } from './src/lib/code-theme.mjs';
import { hastBasePath } from './src/lib/hast-base-path.mjs';

const base = '/tiny-agents';

// https://astro.build/config
export default defineConfig({
  site: 'https://mrm1001.github.io',
  base,
  output: 'static',
  integrations: [react()],
  markdown: {
    // `github-light` with its four sub-AA token colours darkened — see
    // src/lib/code-theme.mjs for why this cannot be done in CSS.
    shikiConfig: {
      theme: await accessibleCodeTheme(),
      // Lessons are read in a 68ch column; a horizontal scrollbar inside a code
      // block is worse than a wrapped line. Note this makes `pre`'s
      // `overflow-x: auto` dead.
      wrap: true,
    },
    processor: satteri({ hastPlugins: [hastBasePath({ base })] }),
  },
});
