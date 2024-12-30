import { build, stop, context, type BuildOptions } from 'esbuild';
import esbuildSvelte from 'esbuild-svelte';
import { sveltePreprocess } from 'svelte-preprocess';
import manifest from './manifest.json' with { type: 'json' };

const isProd = !Deno.args.includes('--development');
console.log('⌥ Deno-esbuild', Deno.args);

const buildOptions: BuildOptions = {
  plugins: [esbuildSvelte({ preprocess: sveltePreprocess() })],
  entryPoints: [
    './src/api-monitor-devtools.ts',
    './src/api-monitor-cs-main.ts',
    './src/api-monitor-cs-isolated.ts',
    './src/api-monitor-devtools-panel.ts',
  ],
  outdir: './public/build/',
  define: {
    __development__: `${!isProd}`,
    __app_name__: `"browser-api-monitor@${manifest.version}"`,
    __app_version__: `"${manifest.version}"`,
    __home_page__: `"${manifest.homepage_url}"`,
  },
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'esnext',
  minify: isProd,
  sourcemap: false,
  treeShaking: true,
  logLevel: 'debug',
};

if (isProd) {
  build(buildOptions).catch((error) => {
    console.error('💔', error);
  });
} else {
  const ctx = await context(buildOptions);
  await ctx.watch();
}
