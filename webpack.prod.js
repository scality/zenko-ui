const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = merge(common, {
    mode: 'production',
    devtool: 'hidden-source-map',
    plugins: [
        new CompressionPlugin(),
    ],
});
