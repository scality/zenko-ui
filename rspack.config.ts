import path from 'path';
import packageJson from './package.json';
import type { Configuration } from '@rspack/cli';
import * as rspack from '@rspack/core';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { execSync } from 'node:child_process';
import { MicroAppRuntimeConfigurationPlugin } from '@scality/module-federation';

const deps = packageJson.dependencies;

const revision = execSync('git rev-parse HEAD').toString().trim();

const zenkoDNS = process.env.ZENKO_DNS || 'zenko.local';

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': accessControlAllowHeaders.join(', '),
  'Access-Control-Expose-Headers': 'ETag',
};

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
        include: [/data-browser-library/, /codemirror-json-schema/],
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
        './WelcomeModal': './src/react/ISV/components/Modal/WelcomeModal.tsx',
        './ISVConnectorModal': './src/react/ISV/components/Modal/ISVConnectorModal.tsx',
        './SelectAccountIAMRole': './src/react/ui-elements/SelectAccountIAMRole.tsx',
        './MCPTools': './src/react/mcpTools/index.ts',
      },
      remotes: !isProduction
        ? {
            shell: 'shell@http://localhost:8084/shell/mf-manifest.json',
          }
        : undefined,
      shared: {
        ...Object.fromEntries(Object.entries(deps).map(([key, version]) => [key, {}])),
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
        'react-hook-form': {
          singleton: true,
        },
        '@hookform/resolvers': {
          singleton: true,
        },
      },
    }),
    new rspack.CopyRspackPlugin({
      patterns: [{ from: 'public' }],
    }),
    process.env.RSDOCTOR && new RsdoctorRspackPlugin({}),
    new MicroAppRuntimeConfigurationPlugin(
      {
        kind: 'MicroAppRuntimeConfiguration',
        apiVersion: 'ui.scality.com/v1alpha1',
        metadata: {
          kind: 'zenko-ui',
          name: 'zenko.eu-west-1',
        },
        spec: {
          title: 'Data Management',
          selfConfiguration: {
            managementEndpoint: '/zenko/management',
            stsEndpoint: '/zenko/sts',
            zenkoEndpoint: '/zenko/s3',
            iamEndpoint: '/zenko/iam',
            features: [],
            basePath: '/',
            s3InternalFQDN: `s3.${zenkoDNS}`,
            iamInternalFQDN: `iam.${zenkoDNS}`,
          },
          auth: {
            kind: 'OIDC',
            providerUrl: '/oidc',
            redirectUrl: 'http://localhost:8084/',
            clientId: 'zenko-ui',
            responseType: 'code',
            scopes: 'openid profile email',
            providerLogout: true,
          },
        },
      },
      'ZENKO_RUNTIME_',
      corsHeaders,
    ),
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
    static: path.join(__dirname, 'public'),
    headers: corsHeaders,
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
