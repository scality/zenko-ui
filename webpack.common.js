const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const deps = require('./package.json').dependencies;

module.exports = {
    // entry: {
    //     zenko_ui: './src/react/App',
    // },
    entry: './src/react/index',
    output: {
        // filename: 'js/[name].js',
        // path: path.resolve(__dirname, 'public/assets'),
        // publicPath: '/',
        publicPath: 'http://localhost:8383/',
        // publicPath: 'auto',
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
        new ModuleFederationPlugin({
            name: 'tabs',
            filename: 'remoteEntry.js',
            exposes: {
                './Loader': './src/react/ui-elements/Loader.jsx',
            },
            // https://github.com/oncet/federated-modules-styled-components
            // https://github.com/styled-components/styled-components/issues/3302#issuecomment-707431329
            // shared: {
            //     react: { singleton: true },
            // },
            shared: ['react'],
            // remotes: {
            //     'lib-app': 'lib_app@http://localhost:3000/remoteEntry.js',
            // },
        }),
        new HtmlWebPackPlugin({
            template: './src/index-template.html',
            filename: './index.html',
            chunks: ['main'],
        }),
    ],
};
