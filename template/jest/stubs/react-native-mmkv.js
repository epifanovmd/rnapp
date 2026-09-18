// MMKV — нативный модуль; в node-тестах нужен только импорт, не поведение.
const noop = () => {};

module.exports = {
  createMMKV: () => ({
    getString: () => undefined,
    set: noop,
    delete: noop,
    getAllKeys: () => [],
  }),
};
