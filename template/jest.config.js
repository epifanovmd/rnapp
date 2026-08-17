/**
 * Юнит-тесты чистой логики (worklet-функции в Node — обычные функции).
 * RN-рантайм не поднимается: testEnvironment=node, трансформ — babel
 * без плагина Reanimated (см. babel-jest.config.js).
 */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.(t|j)sx?$": ["babel-jest", { configFile: "./babel-jest.config.js" }],
  },
  moduleNameMapper: {
    "^@app(.*)$": "<rootDir>/src/app$1",
    "^@pages(.*)$": "<rootDir>/src/pages$1",
    "^@widgets(.*)$": "<rootDir>/src/widgets$1",
    "^@features(.*)$": "<rootDir>/src/features$1",
    "^@entities(.*)$": "<rootDir>/src/entities$1",
    "^@shared(.*)$": "<rootDir>/src/shared$1",
  },
  collectCoverageFrom: [
    "src/shared/lib/holders/**/*.{ts,tsx}",
    "!src/shared/lib/holders/**/index.ts",
    "!src/shared/lib/holders/**/*.types.ts",
    "!src/shared/lib/holders/**/__tests__/**",
    "src/shared/lib/holders/holder.types.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
