// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://mrm1001.github.io',
  base: '/tiny-agents',
  output: 'static',
  integrations: [react()],
});
