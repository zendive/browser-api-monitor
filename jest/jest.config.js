/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // 2024-05-09 to disable verbatimModuleSyntax
        tsconfig: './jest/tsconfig.json',
        useESM: true,
        defaultsESM: true,
      },
    ],
  },
  rootDir: '..', // . - /
  roots: ['jest/tests'], // . - /jest
};
