/**
 * Стаб `react-native` для node-тестов: модуль импортируется хуками и
 * компонентами на уровне модуля, но в тестах чистой логики не вызывается.
 */
module.exports = {
  StyleSheet: { create: styles => styles },
  Platform: { OS: "ios", select: options => options.ios ?? options.default },
  Dimensions: {
    get: () => ({ width: 0, height: 0, scale: 1, fontScale: 1 }),
    addEventListener: () => ({ remove: () => {} }),
  },
};
