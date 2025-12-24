import path from 'path';
import packageJson from './package.json';
import { Configuration } from '@rspack/cli';
import * as rspack from '@rspack/core';
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
    publicPath: '/zenko/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [/data-browser-library/],
        resolve: {
          fullySpecified: false,
        },
        type: 'javascript/auto',
      },
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
    ],
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx', '.css', '.json', '.ts', '.tsx'],
  },
  experiments: {
    css: true,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'zenko',
      filename: `static/js/remoteEntry.${revision}.js`,
      exposes: {
        './FederableApp': './src/react/FederableApp.tsx',
        './ExportApp': './src/react/ExportApp.tsx',
        './WelcomeModal': './src/react/ISV/components/Modal/WelcomeModal.tsx',
        './SelectAccountIAMRole':
          './src/react/ui-elements/SelectAccountIAMRole.tsx',
      },
      remotes: !isProduction
        ? {
            shell: 'shell@http://localhost:8084/shell/mf-manifest.json',
          }
        : undefined,
      shared: {
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
      bridge: {
        enableBridgeRouter: true,
      },
    }),
    new rspack.CopyRspackPlugin({
      patterns: [{ from: 'public/assets/zenko' }],
    }),
    process.env.RSDOCTOR && new RsdoctorRspackPlugin({}),
  ].filter(Boolean),
  devServer: {
    host: '127.0.0.1',
    allowedHosts: ['localhost', '127.0.0.1', '.local'],
    port: 8383,
    hot: !isProduction,
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
    static: path.join(__dirname, 'public/assets/zenko'),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods':
        'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': accessControlAllowHeaders.join(', '),
      'Access-Control-Expose-Headers': 'ETag',
    },
    proxy: [
      {
        context: ['/zenko/s3'],
        target: `https://s3.${zenkoDNS}`,
        pathRewrite: { '^/zenko/s3': '' },
        secure: false,
        changeOrigin: true,
        logLevel: 'debug',
        // @ts-expect-error - console is not a valid LogProvider (rspack types)
        logProvider: () => console,
        onProxyRes: (proxyRes, req) => {
          if (req.method === 'OPTIONS') {
            proxyRes.statusCode = 200;
          }
        },
      },
      {
        context: ['/zenko/iam'],
        target: `https://iam.${zenkoDNS}`,
        pathRewrite: { '^/zenko/iam': '' },
        secure: false,
        changeOrigin: true,
        logLevel: 'debug',
        // @ts-expect-error - console is not a valid LogProvider (rspack types)
        logProvider: () => console,
        onProxyRes: (proxyRes, req) => {
          if (req.method === 'OPTIONS') {
            proxyRes.statusCode = 200;
          }
        },
      },
      {
        context: ['/zenko/sts'],
        target: `https://sts.${zenkoDNS}`,
        pathRewrite: { '^/zenko/sts': '' },
        secure: false,
        changeOrigin: true,
        logLevel: 'debug',
        // @ts-expect-error - console is not a valid LogProvider (rspack types)
        logProvider: () => console,
        onProxyRes: (proxyRes, req) => {
          if (req.method === 'OPTIONS') {
            proxyRes.statusCode = 200;
          }
        },
      },
      {
        context: ['/zenko/management'],
        target: `https://management.${zenkoDNS}`,
        pathRewrite: { '^/zenko/management': '' },
        secure: false,
        changeOrigin: true,
        logLevel: 'debug',
        // @ts-expect-error - console is not a valid LogProvider (rspack types)
        logProvider: () => console,
      },
    ],
  },
};

export = config;
