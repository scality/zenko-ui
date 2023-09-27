const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

const zenkoDNS = 'zenko.local';

const accessControlAllowHeaders = [
  'X-Requested-With',
  'content-type',
  'Authorization',
  'x-amz-content-sha256',
  'x-amz-user-agent',
  'x-amz-security-token',
  'x-amz-date',
  'if-none-match',
  'x-amz-bucket-object-lock-enabled',
  'x-authentication-token',
  'content-md5',
  'x-amz-bypass-governance-retention',
];

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    publicPath: '/zenko/',
  },
  devServer: {
    static: path.join(__dirname, 'public/assets'),
    host: '127.0.0.1',
    port: 8383,
    historyApiFallback: true,
    hot: false,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods':
        'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': accessControlAllowHeaders.join(', '),
      'Access-Control-Expose-Headers': 'ETag',
    },
    proxy: {
      '/s3': {
        target: `https://s3.${zenkoDNS}`,
        pathRewrite: { '^/s3': '' },
        secure: false,
        changeOrigin: true,
        logLevel: 'debug',
        logProvider: () => console,
        onProxyRes: function (proxyRes, req, res) {
          if (req.method === 'OPTIONS') {
            proxyRes.statusCode = 200;
          }
        },
      },
      '/iam': {
        target: `https://iam.${zenkoDNS}`,
        pathRewrite: { '^/iam': '' },
        secure: false,
        changeOrigin: true,
        logLevel: 'debug',
        logProvider: () => console,
        onProxyRes: function (proxyRes, req, res) {
          if (req.method === 'OPTIONS') {
            proxyRes.statusCode = 200;
          }
        },
      },
      '/sts': {
        target: `https://sts.${zenkoDNS}`,
        pathRewrite: { '^/sts': '' },
        secure: false,
        changeOrigin: true,
        logLevel: 'debug',
        logProvider: () => console,
        onProxyRes: function (proxyRes, req, res) {
          if (req.method === 'OPTIONS') {
            proxyRes.statusCode = 200;
          }
        },
      },
      '/management': {
        target: `https://management.${zenkoDNS}`,
        pathRewrite: { '^/management': '' },
        secure: false,
        changeOrigin: true,
        logLevel: 'debug',
        logProvider: () => console,
      },
    },
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
  },
});
