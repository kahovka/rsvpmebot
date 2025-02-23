import { mdsvex } from 'mdsvex';
import adapter from 'sveltekit-adapter-deno';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex()],

	kit: {
		adapter: adapter(),
		csrf: {
			checkOrigin: process.env.NODE_ENV === 'development' ? false : true
		}
	},

	extensions: ['.svelte', '.svx']
};

export default config;
