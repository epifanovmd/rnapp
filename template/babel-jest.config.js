/**
 * Babel для jest: пресет RN без плагина Reanimated — worklet-директивы
 * в тестах остаются строками, алиасы резолвит moduleNameMapper jest'а.
 * Плагины декораторов те же, что в `babel.config.js`: без метаданных
 * контейнер не соберёт классы с @inject в конструкторе.
 */
module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "@babel/plugin-transform-export-namespace-from",
    "babel-plugin-transform-typescript-metadata",
    "babel-plugin-parameter-decorator",
  ],
};
