module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/?(*.)+(test).ts?(x)'],
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|vega-lite|@scality|pretty-bytes|uuid|@fortawesome|@marijn|@codemirror|@lezer|codemirror-json-schema|@uiw)/)',
  ],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/assetsTransformer.js',
    '\\.(css|less)$': '<rootDir>/assetsTransformer.js',
    '^@fortawesome/free-solid-svg-icons/(.*)\\.js$': '@fortawesome/free-solid-svg-icons/$1',
    '^@fortawesome/free-regular-svg-icons/(.*)\\.js$': '@fortawesome/free-regular-svg-icons/$1',
    '^@shikijs/(.*)$': '<rootDir>/src/react/__mocks__/esmOnlyModules.js',
    '^shiki/(.*)$': '<rootDir>/src/react/__mocks__/esmOnlyModules.js',
  },
  setupFiles: ['<rootDir>/.jest-setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jestSetupAfterEnv.tsx'],
  globalSetup: './global-setup.js',
};
