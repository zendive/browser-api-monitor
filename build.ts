import { build, type BuildOptions, context, stop } from 'esbuild';
import esbuildSvelte from 'esbuild-svelte';
import { sveltePreprocess } from 'svelte-preprocess';
import manifest from './manifest.json' with { type: 'json' };

const nodeEnv = Deno.env.get('NODE_ENV');
const isProd = nodeEnv === 'production';
const buildOptions: BuildOptions = {
  plugins: [
    esbuildSvelte({
      preprocess: sveltePreprocess(),
      compilerOptions: { dev: !isProd },
    }),
  ],
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
  conditions: [`${nodeEnv}`],
  minify: isProd,
  sourcemap: false,
  treeShaking: true,
  logLevel: 'warning',
};

if (isProd) {
  await build(buildOptions);
  await stop();
} else {
  const ctx = await context(buildOptions);
  await ctx.watch();
}
