const path = require('path');

module.exports = {
    entry: {
        zenko_ui: './src/react/App',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'public/assets/js'),
        publicPath: 'http://127.0.0.1:8383/',
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
                use: 'file-loader?name=[name].[ext]?[hash]',
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url-loader?limit=10000&mimetype=application/fontwoff',
            },
            {
                test: /\.css$/,
                include: /node_modules/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            // importLoaders: 1,
                            modules: false,
                        },
                    },
                ],
            },
        ],
    },
};
