module.exports = {
    testMatch: [ '**/__tests__/?(*.)+(test).js?(x)'],
    moduleNameMapper: {
        '\\.(css|scss)$': 'identity-obj-proxy',
    },
    setupFiles: ['<rootDir>/.jest-setup.js'],
};
