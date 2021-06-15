const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    // plugins: [
    //     new BundleAnalyzerPlugin(),
    // ],
    devServer: {
        contentBase: path.join(__dirname, 'public/assets'),
        host: '127.0.0.1',
        port: 8383,
        open: true,
        historyApiFallback: true,
        hot: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        proxy: {
            '/s3': {
                target: 'http://s3.zenko.local',
                pathRewrite: {'^/s3' : ''},
                bypass: function(req) {
                    req.headers.proxypath = req.path;
                    req.headers.proxyhost = '127.0.0.1:8383';
                },
                changeOrigin: true,
            },
            '/iam': {
                target: 'http://iam.zenko.local',
                bypass: function(req) {
                    req.headers.proxypath = req.path;
                    req.headers.proxyhost = '127.0.0.1:8383';
                },
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
