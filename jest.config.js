/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/commands/**/*.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: ['**/tests/**/*.test.ts'],
};
