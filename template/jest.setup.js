globalThis.__TEST_RUNTIME__ = require("@jest/globals").jest;
// `__DEV__` объявляет Metro, а тесты идут мимо него: код, который в дебаге
// ведёт себя иначе (например, диагностика списка), тестируется в дебаг-режиме.
globalThis.__DEV__ = true;
