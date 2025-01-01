module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
      '^.+\\.js$': 'babel-jest',
    },
    coveragePathIgnorePatterns: ['/node_modules/', '/src/.internal/'],
  
    collectCoverageFrom: [
      "**/src/*.{js,jsx}",
      "!**/node_modules/**"
  ]
  };