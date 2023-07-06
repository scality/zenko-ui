const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const CompressionPlugin = require('compression-webpack-plugin');
const path = require('path');
const fs = require('fs-extra');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'hidden-source-map',
  plugins: [
    new CompressionPlugin(),
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
          fs.copySync(
            path.resolve(__dirname, path.join('public', 'assets', 'zenko')),
            path.resolve(__dirname, 'build'),
            {
              dereference: true,
            },
          );
        });
      },
    },
  ],
});
