/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  // jose ships ESM-only; Jest's module system can't load raw `export`
  // syntax from node_modules by default, so let babel-jest transpile it.
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(jose)/)'],
}
