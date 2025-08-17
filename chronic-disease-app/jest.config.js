module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/src/__tests__/setup.js'],
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{js,jsx}',
  ],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|@reduxjs/toolkit|react-redux|@react-native-async-storage)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'identity-obj-proxy',
  },
  globals: {
    __DEV__: true,
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/__tests__/**',
    '!src/index.js',
    '!src/App.js',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  clearMocks: true,
  testTimeout: 10000,
};