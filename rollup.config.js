// created using: ```npx degit sveltejs/template svelte-app```

import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import css from 'rollup-plugin-css-only';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';

const production = !process.env.ROLLUP_WATCH;
/**
 * @type {import('rollup').RollupOptions}
 */
const extensionFileOptions = {
  output: {
    sourcemap: production ? false : 'inline',
    format: 'iife',
    dir: 'public/build',
  },
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        __development__: !production,
      },
    }),
    commonjs(),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
    }),
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
/**
 * @type {import('rollup').RollupOptions}
 */
const svelteViewOptions = {
  output: {
    sourcemap: production ? false : 'inline',
    format: 'module',
    dir: 'public/build',
  },
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        __development__: !production,
      },
    }),
    svelte({
      preprocess: sveltePreprocess({ sourceMap: !production }),
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
      },
    }),
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css({ output: 'bundle.css' }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte'],
      exportConditions: ['svelte'],
    }),
    commonjs(),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
    }),
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default [
  { input: 'src/devtools.ts', ...extensionFileOptions },
  { input: 'src/cs-main.ts', ...extensionFileOptions },
  { input: 'src/cs-isolated.ts', ...extensionFileOptions },
  { input: 'src/dt-view.ts', ...svelteViewOptions },
];
