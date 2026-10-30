module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.ui.test.tsx'],
  passWithNoTests: false,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.cjs'],
};
