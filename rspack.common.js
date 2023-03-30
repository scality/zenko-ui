const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

// module.exports = (env, argv) => {
//   const webpackEnv = env.production ? 'production' : 'development';
//   const brand = process.env.BRAND ? process.env.BRAND : 'scality';
//   const envs = {
//     __S3_ENDPOINT__: process.env.S3_ENDPOINT
//       ? JSON.stringify(process.env.S3_ENDPOINT)
//       : undefined,
//     __S3_REGION__: process.env.S3_REGION
//       ? JSON.stringify(process.env.S3_REGION)
//       : undefined,
//     __BRAND__: JSON.stringify(brand),
//   };

//   if (process.env.S3_ENDPOINT && !process.env.S3_REGION) {
//     envs.__S3_REGION__ = JSON.stringify('us-east-1');
//   }
//   return {
//     mode: webpackEnv,
//     entry: './src/index.tsx',
//     output: {
//       filename: '[name].[chunkhash].bundle.js',
//       path: path.resolve(__dirname, 'build'),
//     },
//     builtins: {
//       html: [
//         {
//           template: './src/index.html',
//           filename: 'index.html',
//           favicon: './src/favicon.ico',
//           templateParameters: {
//             titlePrefix: brand === 'scality' ? 'Scality ' : '',
//           },
//         },
//       ],
//       define: {
//         __ENV__: JSON.stringify(webpackEnv),
//         ...envs,
//       },
//     },
//     module: {
//       rules: [
//         {
//           test: /\.s[ac]ss$/i,
//           use: [
//             {
//               loader: 'sass-loader',
//               options: {
//                 additionalData: '$brand: ' + brand + ';',
//               },
//             },
//           ],
//           type: 'css',
//         },
//         /**
//          * We need to figure out why generator are not working despite that the
//          * generator is implemented cf (https://www.rspack.dev/config/module.html#rulegenerator)
//          * The output is correct in the build but the fetching are not
//          */
//         {
//           test: /\.(png|svg|jpg|jpeg|gif)$/i,
//           type: 'asset/resource',
//           // generator: {
//           //   filename: 'assets/images/[hash][ext][query]',
//           // },
//         },
//         {
//           test: /\.(woff|woff2|eot|ttf|otf)$/i,
//           type: 'asset/resource',
//           // generator: {
//           //   filename: 'assets/fonts/[hash][ext][query]',
//           // },
//         },
//       ],
//     },
//   };
// };

module.exports = {
  entry: {
    zenko_ui: './src/react/App',
  },
  output: {
    filename: `[name].[chunkhash].js`,
    path: path.resolve(__dirname, 'build'),
    // path: path.resolve(__dirname, 'public/assets'),
    // publicPath: '/',
  },
  // resolve: {
  //   modules: ['node_modules'],
  //   extensions: ['.js', '.jsx', '.ts', '.tsx'],
  // },
  builtins: {
    html: [
      {
        template: './src/index-template.html',
        filename: './index.html',
        // favicon: './src/favicon.ico',
        // templateParameters: {
        //   titlePrefix: brand === 'scality' ? 'Scality ' : '',
        // },
      },
    ],
    // define: {
    //   __ENV__: JSON.stringify(webpackEnv),
    //   ...envs,
    // },
  },
  module: {
    rules: [
      // {
      //   test: /\.jpe?g$|\.gif$|\.png$|\.ttf$|\.eot$|\.svg$/,
      //   use: [
      //     {
      //       loader: 'file-loader',
      //       options: {
      //         name: '[name].[ext]?[hash]',
      //         outputPath: 'fonts/',
      //       },
      //     },
      //   ],
      // },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        // generator: {
        //   filename: 'assets/images/[hash][ext][query]',
        // },
        // options: {
        //   name: '[name].[ext]?[hash]',
        //   outputPath: 'fonts/',
        // },
      },
      // {
      //   test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      //   use: [
      //     {
      //       loader: 'url-loader',
      //       options: {
      //         limit: 10000,
      //         mimetype: 'application/fontwoff',
      //         outputPath: 'fonts/',
      //       },
      //     },
      //   ],
      // },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        // generator: {
        //   filename: 'assets/fonts/[hash][ext][query]',
        // },
      },
    ],
  },
  plugins: [
    // new MonacoWebpackPlugin({
    //   languages: ['json'],
    // }),
    new CopyPlugin([
      {
        from: 'public',
        to: '.',
      },
    ]),
  ],
};
