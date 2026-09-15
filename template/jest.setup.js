globalThis.__TEST_RUNTIME__ = require("@jest/globals").jest;
// `__DEV__` объявляет Metro, а тесты идут мимо него: код, который в дебаге
// ведёт себя иначе (например, диагностика списка), тестируется в дебаг-режиме.
globalThis.__DEV__ = true;
// React проверяет этот флаг, чтобы `act()` из react-test-renderer работал в node-окружении.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
