module.exports = {
  testMatch: ['**/?(*.)+(test).ts?(x)'],
  transformIgnorePatterns: [
    '/node_modules/(?!(vega-lite|@scality|pretty-bytes)/)',
  ],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/assetsTransformer.js',
    '\\.(css|less)$': '<rootDir>/assetsTransformer.js',
  },
  setupFiles: ['<rootDir>/.jest-setup.js'],
  setupFilesAfterEnv: ['<rootDir>/.jest-setup-after-env.js'],
  globalSetup: './global-setup.js',
};
