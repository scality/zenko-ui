const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

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
                target: 'http://127.0.0.1:8000',
                pathRewrite: {'^/s3' : ''},
                bypass: function(req) {
                    req.headers.proxy_path = req.path;
                },
            },
            '/iam': {
                target: 'http://127.0.0.1:8600',
                pathRewrite: {'^/iam' : ''},
            },
            '/sts': {
                target: 'http://127.0.0.1:8800',
                pathRewrite: { '^/sts' : '' },
            },
        },
    },
});
