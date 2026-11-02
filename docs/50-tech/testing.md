---
id: tech/testing
title: Тестовая инфраструктура
summary: Jest без RN-рантайма, стабы нативных модулей, порог 100% на холдеры, как тестировать хуки и VM без react-dom.
layer: project
roles: [developer, tester]
stages: [implementation, verification]
depends_on: [conventions/tests]
---

# Тестовая инфраструктура

## Настройка

- `jest.config.js`: тесты — `**/__tests__/**/*.test.{ts,tsx}`, `setupFiles` —
  `jest.setup.js`, `testEnvironment: "node"`; сам `react-native` и нативные пакеты замаплены на стабы
  `jest/stubs/*` (`react-native`, `react-native-mmkv`, `react-native-config`,
  `device-info`, `clipboard`, пикеры, `react-native-vision-engine` — только
  `VISION_ENGINE_DEFAULTS`); `react-native-worklets` — пустой стаб. Трансформ — отдельный
  `babel-jest.config.js` ([ops/build](../70-ops/build.md)).
- Команды — [ops/commands](../70-ops/commands.md#проверки).

## Порог покрытия

`collectCoverageFrom` — только `src/shared/lib/holders/**` (без `index.ts`,
`__tests__/` и `*.types.ts`, кроме `holder.types.ts`), пороги 100/100/100/100. Проверяются только с `--coverage`:
полная проверка и pre-commit запускают тесты с покрытием.

## Как тестировать

- Чистые функции — напрямую. Поведение, которое не берётся юнит-тестом (Reanimated,
  нативный слой), выносится вычислимой частью в чистый модуль
  ([architecture/native](../20-architecture/native.md)).
- Хуки и VM без RN-рантайма: `react-test-renderer` + `observer`; mobx-react-lite требует
  `react-dom` — `jest.mock("react-dom", …, { virtual: true })`. Тесты с JSX требуют
  PascalCase-имени файла, поэтому хуки тестируются в `.ts` через `createElement`.
- DI — `iocContainer.bind(...)` фейков; барели с нативными модулями мокаются
  (`@shared/lib/socket` тянет netinfo).
- Внутри фабрик `jest.mock` — переменные только с префиксом `mock`.
- Сокет — `createFakeSocket` (`@shared/lib/socket/testing`).

## Gotcha

- `react-test-renderer` пишет предупреждение об устаревании в `console.error` — глушить
  `jest.spyOn(console, "error")` в `beforeEach`.
- JVM-тесты Kotlin-частей VisionEngine — отдельно
  ([tech/native-modules](native-modules.md)).
