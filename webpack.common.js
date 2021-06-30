const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        zenko_ui: './src/react/App',
    },
    output: {
        filename: 'js/[name].js',
        path: path.resolve(__dirname, 'public/assets'),
        publicPath: '/',
        assetModuleFilename: 'fonts/[name][ext]?[contenthash]',
    },
    resolve: {
        modules: ['node_modules'],
        extensions: [
            '.js',
            '.jsx',
        ],
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.html$/,
                use: [{
                    loader: 'html-loader',
                }],
            },
            {
                test: /\.jpe?g$|\.gif$|\.png$|\.ttf$|\.eot$|\.svg$/,
                type: 'asset/resource',
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                type: 'asset',
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: './src/index-template.html',
            filename: './index.html',
        }),
    ],
};
