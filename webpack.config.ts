import path from 'path';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { fileURLToPath } from 'url';
import { EsbuildPlugin } from 'esbuild-loader';
import sveltePreprocess from 'svelte-preprocess';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import manifest from './manifest.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function (
  env: string,
  op: { mode: webpack.Configuration['mode'] }
): webpack.Configuration {
  const isProd = op.mode === 'production';

  console.log('⌥', env, op.mode);
  if (!isProd) {
    console.log('Bundle anayser available at:', 'http://127.0.0.1:8888');
  }

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
      path: path.resolve(__dirname, 'public/build'),
    },

    resolve: {
      extensions: ['.ts', '.js', '.svelte'],
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    plugins: [
      isProd
        ? () => {}
        : new BundleAnalyzerPlugin({
            // http://127.0.0.1:8888
            openAnalyzer: false,
            logLevel: 'silent',
          }),
      new webpack.DefinePlugin({
        __development__: !isProd,
        __app_name__: `"browser-api-monitor"`,
        __app_version__: `"${manifest.version}"`,
        __home_page__: `"${manifest.homepage_url}"`,
      }),
      new MiniCssExtractPlugin({ filename: 'bundle.css' }),
    ],

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
            target: 'es2022',
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
      minimizer: [new EsbuildPlugin()],
    },

    devtool: false,
  };
}
