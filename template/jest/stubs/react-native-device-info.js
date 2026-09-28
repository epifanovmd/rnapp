// Нативный модуль недоступен в jest: значения тестового устройства.
module.exports = {
  __esModule: true,
  default: {
    getModel: () => "iPhone 17 Pro",
    getSystemName: () => "iOS",
    getSystemVersion: () => "26.5",
    isTablet: () => false,
  },
};
