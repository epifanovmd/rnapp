// Значения приходят из нативного слоя; тестам нужны только валидные строки.
const config = {
  BASE_URL: "https://api.test",
  SOCKET_BASE_URL: "wss://api.test",
  DEEPLINK_BASE_URL: "rnapp",
};

module.exports = { __esModule: true, default: config, Config: config };
