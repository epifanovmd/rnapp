/**
 * Babel для jest: пресет RN без плагина Reanimated — worklet-директивы
 * в тестах остаются строками, алиасы резолвит moduleNameMapper jest'а.
 */
module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "@babel/plugin-transform-export-namespace-from",
  ],
};
