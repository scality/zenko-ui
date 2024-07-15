import path from 'path';
import packageJson from './package.json';
import { Configuration } from '@rspack/cli';
import rspack from '@rspack/core';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { execSync } from 'node:child_process';

const deps = packageJson.dependencies;

const revision = execSync('git rev-parse HEAD').toString().trim();

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

const isProduction = process.env.NODE_ENV === 'production';

const config: Configuration = {
  entry: {
    zenko_ui: './src/react/App',
  },
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? false : 'source-map',
  output: {
    filename: `static/js/[name].[contenthash].${revision}.js`,
    assetModuleFilename: 'static/assets/[name].[hash][ext][query]',
    cssFilename: 'static/css/[name].[contenthash].css',
    path: path.resolve(__dirname, 'build'),
    publicPath: isProduction ? '/data/' : '/zenko/',
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'ecmascript',
                jsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                },
              },
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.tsx$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                },
              },
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.(jpe?g|gif|png|ttf|eot|svg)$/,
        type: 'asset',
      },
      {
        test: /\.woff(2)?$/,
        type: 'asset/resource',
      },
      {
        test: /\.css$/,
        type: 'css',
      },
    ],
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx', '.css', '.json', '.ts', '.tsx'],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'zenko',
      filename: 'static/js/remoteEntry.js',
      exposes: {
        './FederableApp': './src/react/FederableApp.tsx',
        './VeeamWelcomeModal':
          './src/react/ui-elements/Veeam/VeeamWelcomeModal.tsx',
        './SelectAccountIAMRole':
          './src/react/ui-elements/SelectAccountIAMRole.tsx',
      },
      remotes: !isProduction
        ? {
            shell: 'shell@http://localhost:8084/shell/mf-manifest.json',
          }
        : undefined,
      shared: {
        ...Object.fromEntries(
          Object.entries(deps).map(([key, version]) => [key, {}]),
        ),
        '@scality/core-ui': {
          singleton: true,
        },
        '@scality/module-federation': {
          singleton: true,
        },
        'styled-components': {
          singleton: true,
          requiredVersion: deps['styled-components'],
        },
        react: {
          singleton: true,
          requiredVersion: deps.react,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: deps['react-dom'],
        },
      },
    }),
    new rspack.CopyRspackPlugin({
      patterns: [{ from: 'public/assets/data' }],
    }),
    process.env.RSDOCTOR && new RsdoctorRspackPlugin({}),
  ].filter(Boolean),
  devServer: {
    host: '127.0.0.1',
    port: 8383,
    hot: !isProduction,
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
    static: path.join(__dirname, 'public/assets'),
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
  },
};

export = config;
