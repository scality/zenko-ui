const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [new BundleAnalyzerPlugin()],
  devServer: {
    contentBase: path.join(__dirname, 'public/assets'),
    host: '127.0.0.1',
    port: 8383,
    open: true,
    historyApiFallback: true,
    hot: true,
    proxy: {
      '/s3': {
        target: 'http://s3.latest.scality.local',
        pathRewrite: { '^/s3': '' },
        changeOrigin: true,
      },
      '/iam': {
        target: 'https://iam.latest.scality.local',
        pathRewrite: { '^/iam': '' },
        secure: false,
        changeOrigin: true,
      },
      '/sts': {
        target: 'https://sts.latest.scality.local',
        pathRewrite: { '^/sts': '' },
        secure: false,
        changeOrigin: true,
      },
      '/management': {
        target: 'https://management.latest.scality.local',
        pathRewrite: { '^/management': '' },
        secure: false,
        logLevel: 'info',
        changeOrigin: true,
      },
    },
  },
});
