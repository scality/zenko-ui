const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    plugins: [
        new BundleAnalyzerPlugin(),
    ],
    devServer: {
        contentBase: path.join(__dirname, 'public/assets'),
        host: 'localui.zenko.local',
        port: 8383,
        open: true,
        historyApiFallback: true,
        hot: true,
        proxy: {
            '/s3': {
                target: 'http://s3.zenko.local',
                pathRewrite: {'^/s3' : ''},
                bypass: function(req) {
                    req.headers.proxypath = req.path;
                    req.headers.host = 's3.zenko.local';
                    req.headers.proxyhost = '127.0.0.1:8383';
                },
            },
            '/iam': {
                target: 'http://iam.zenko.local',
                pathRewrite: {'^/iam' : ''},
                changeOrigin: true,
            },
            '/sts': {
                target: 'http://sts.zenko.local',
                pathRewrite: {'^/sts' : ''},
                changeOrigin: true,
            },
        },
    },
});
