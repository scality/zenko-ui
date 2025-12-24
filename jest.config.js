module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/?(*.)+(test).ts?(x)'],
  // TODO: Remove ignore patterns once the tests are updated to use the data-browser-library
  testPathIgnorePatterns: [
    'src/react/ISV/hooks/useGetS3ServicePoint.test.ts',
    'src/react/ISV/modules/veeam/components/VeeamCapacityOverviewRow.test.tsx',
    'src/react/ISV/modules/veeam/components/VeeamCapacityModal.test.tsx',
    'src/react/ISV/components/__tests__/ISVSummary.test.tsx',
    'src/react/ui-elements/__tests__/SelectAccountIAMRole.test.tsx',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(vega-lite|@scality|pretty-bytes|uuid)/)',
  ],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/assetsTransformer.js',
    '\\.(css|less)$': '<rootDir>/assetsTransformer.js',
  },
  setupFiles: ['<rootDir>/.jest-setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jestSetupAfterEnv.tsx'],
  globalSetup: './global-setup.js',
};
