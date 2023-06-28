import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
	adapter: cloudflare({
		mode: 'directory',
	}),
	output: 'server',
	build: {
		split: true
	}
});
