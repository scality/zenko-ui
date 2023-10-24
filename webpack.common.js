const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const deps = require('./package.json').dependencies;

const revision = require('child_process')
  .execSync('git rev-parse HEAD')
  .toString()
  .trim();

module.exports = {
  entry: {
    zenko_ui: './src/react/App',
  },
  output: {
    filename: `js/[name].${revision}.js`,
    publicPath: '/data/',
    path: path.resolve(__dirname, 'build'),
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    // This is needed because node_modules/aws-sdk/lib/event_listeners.js use require('util')
    // and webpack doesn't know how to resolve it.
    fallback: { util: require.resolve('util/') },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules(?!\/monaco-editor)/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
          },
        ],
      },
      {
        test: /\.jpe?g$|\.gif$|\.png$|\.ttf$|\.eot$|\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]?[hash]',
              outputPath: 'fonts/',
            },
          },
        ],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'application/fontwoff',
              outputPath: 'fonts/',
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'zenko',
      filename: 'js/remoteEntry.js',
      exposes: {
        './FederableApp': './src/react/FederableApp.tsx',
        './VeeamWelcomeModal':
          './src/react/ui-elements/Veeam/VeeamWelcomeModal.tsx',
      },
      shared: {
        ...Object.fromEntries(
          Object.entries(deps).map(([key, version]) => [key, {}]),
        ),
        '@scality/core-ui': {
          singleton: true,
        },
        '@scality/module-federation': {
          singleton: true,
        },
        'styled-components': {
          singleton: true,
          requiredVersion: deps['styled-components'],
        },
        react: {
          singleton: true,
          requiredVersion: deps.react,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: deps['react-dom'],
        },
      },
    }),
    new MonacoWebpackPlugin({
      languages: ['json'],
    }),
    new HtmlWebPackPlugin({
      template: './src/index-template.html',
      filename: './index.html',
    }),
  ],
};
