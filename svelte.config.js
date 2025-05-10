// svelte.config.js
import adapter from '@sveltejs/adapter-static';

const config = {
	kit: {
		adapter: adapter({ fallback: '404.html' }),
		paths: {
  			base: '/timbergraf'
		},
	},
};


export default config;