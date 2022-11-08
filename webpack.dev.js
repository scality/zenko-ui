const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

const zenkoDNS = 'zenko.local';

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'public/assets'),
    host: '127.0.0.1',
    port: 8383,
    open: true,
    historyApiFallback: true,
    hot: true,
    proxy: {
      '/s3': {
        target: `https://s3.${zenkoDNS}`,
        pathRewrite: { '^/s3': '' },
        secure: false,
        changeOrigin: true,
      },
      '/iam': {
        target: `https://iam.${zenkoDNS}`,
        pathRewrite: { '^/iam': '' },
        secure: false,
        changeOrigin: true,
      },
      '/sts': {
        target: `https://sts.${zenkoDNS}`,
        pathRewrite: { '^/sts': '' },
        secure: false,
        changeOrigin: true,
      },
      '/management': {
        target: `https://management.${zenkoDNS}`,
        pathRewrite: { '^/management': '' },
        secure: false,
        logLevel: 'info',
        changeOrigin: true,
      },
    },
  },
});
