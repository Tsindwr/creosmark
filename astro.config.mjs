// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    site: 'https://tsindwr.github.io/creosmark',
    output: 'static',
  integrations: [react()]
});