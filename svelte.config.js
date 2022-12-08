//import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    enableSourcemap: true,
  },
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	// preprocess: preprocess(),
  preprocess: [
    preprocess({
      postcss: true,
      sourceMap: true,
    })
  ],
  kit: {
    adapter: adapter({
      pages:       'build',
      assets:      'build',
      fallback:    'index.html',
      precompress: false,
      strict:      true,
    }),
  },
};

export default config;
