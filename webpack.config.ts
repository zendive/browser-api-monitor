import webpack from 'webpack';
import { EsbuildPlugin } from 'esbuild-loader';
import { sveltePreprocess } from 'svelte-preprocess';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import manifest from './manifest.json' with { type: 'json' };

export default function (
  env: string,
  op: { mode: webpack.Configuration['mode'] }
): webpack.Configuration {
  console.log('⌥', env, op.mode);
  const isProd = op.mode === 'production';

  return {
    mode: op.mode,

    entry: {
      'api-monitor-devtools': './src/api-monitor-devtools.ts',
      'api-monitor-cs-main': './src/api-monitor-cs-main.ts',
      'api-monitor-cs-isolated': './src/api-monitor-cs-isolated.ts',
      'api-monitor-devtools-panel': './src/api-monitor-devtools-panel.ts',
    },

    output: {
      filename: '[name].js',
      path: new URL('public/build', import.meta.url).pathname,
    },

    resolve: {
      extensions: ['.ts', '.js', '.svelte'],
      modules: ['src', 'node_modules'],
      alias: {
        '@': '/src',
      },
    },

    plugins: [new MiniCssExtractPlugin({ filename: 'bundle.css' })],

    module: {
      rules: [
        {
          test: /\.svelte$/,
          exclude: /node_modules\/(?!svelte)/,
          loader: 'svelte-loader',
          options: {
            preprocess: sveltePreprocess({
              sourceMap: !isProd,
            }),
            emitCss: true,
            compilerOptions: {
              // enable run-time checks when not in production
              dev: !isProd,
            },
          },
        },
        {
          test: /\.tsx?$/,
          loader: 'esbuild-loader',
          options: {
            loader: 'ts',
            target: 'esnext',
          },
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                url: false, // necessary if you use url('/path/to/some/asset.png|jpg|gif')
              },
            },
          ],
        },
        {
          test: /\.svg/,
          type: 'asset/resource',
        },
      ],
    },

    optimization: {
      splitChunks: false,
      usedExports: true,
      minimize: isProd,
      minimizer: [
        new EsbuildPlugin({
          target: 'esnext',
          define: {
            __development__: `${!isProd}`,
            __app_name__: `"browser-api-monitor"`,
            __app_version__: `"${manifest.version}"`,
            __home_page__: `"${manifest.homepage_url}"`,
          },
        }),
      ],
    },

    devtool: false,
  };
}
