// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	integrations: [
    svelte(),
    icon()
  ],
  devToolbar: {
    enabled: false
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      hmr: false,
      ws: false,
    },
  },
  server: {
    host: true, // required to listen on 0.0.0.0 for external/proxy traffic
    allowedHosts: ['ln.tejory.io'], // or true to allow all
  },
});