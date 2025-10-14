export default {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/main.js',
    '!js/Pathfinding.js'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      lines: 80,
      functions: 80,
      statements: 80
    }
  },
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
