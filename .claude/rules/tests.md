---
paths:
  - "src/**/__tests__/**"
  - "src/**/testing/**"
  - "jest.config.js"
  - "jest.setup.js"
  - "jest/**"
  - "babel-jest.config.js"
  - "modules/**/src/test/**"
---

# Тесты

- Тест проверяет поведение, не реализацию; не зависит от порядка; без реальной сети
  ([conventions/tests](../../docs/30-conventions/tests.md)).
- Багфикс — тест, падающий на текущем коде, до исправления
  ([bugfix](../../docs/10-process/bugfix.md)).
- Нативные пакеты — стабы `jest/stubs`; сокет — `createFakeSocket`; хуки без RN —
  `react-test-renderer` ([tech/testing](../../docs/50-tech/testing.md)).
- Сгенерированный код напрямую не тестируется.
