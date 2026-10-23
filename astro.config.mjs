// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import icon from 'astro-icon';
import typography from '@tailwindcss/typography';
import serveStatic from 'serve-static';

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
    plugins: [
			tailwindcss(),
      {
        name: 'serve-root-admin',
        apply: 'serve',
        configureServer(server) {
          server.middlewares.use('/admin', serveStatic('./admin'));
        }
      }
		],
    server: {
      hmr: false,
      ws: false,
    },
  },
  server: {
    host: true, // required to listen on 0.0.0.0 for external/proxy traffic
    allowedHosts: ['dcp.tc-sa.com', 'dcp.sa'], // or true to allow all
  },
});