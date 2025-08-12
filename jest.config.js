module.exports = {
  testEnvironment: 'jsdom',
  transform: {},
  moduleNameMapper: {
    '^three$': '<rootDir>/tests/__mocks__/three.js',
    '^three/addons/(.*)$': '<rootDir>/tests/__mocks__/three.js',
    'https://cdn.skypack.dev/cannon-es': '<rootDir>/tests/__mocks__/cannon.js'
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/gameLogic.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};