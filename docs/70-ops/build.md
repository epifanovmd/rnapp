---
id: ops/build
title: Сборка iOS и Android
summary: Проверка нативной сборки, конфигурация Podfile и Gradle, предсобранные бинарники, orval, Babel и Metro.
layer: project
roles: [devops, developer]
stages: [implementation, verification]
depends_on: [ops/environment]
---

# Сборка iOS и Android

## Проверка нативной сборки

```sh
# iOS, симулятор
xcodebuild -workspace ios/rnapp.xcworkspace -scheme rnapp.developmentDebug \
  -configuration developmentDebug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' build
# Android
cd android && ./gradlew assembleDevelopmentDebug
```

Кэши `ios/Pods`, `ios/build`, `android/build`, `android/app/.cxx`, `android/.gradle`
содержат абсолютные пути: после переноса проекта их удаляют и пересобирают
(`pod install`).

## iOS

- `ios/Podfile`: `use_frameworks! :linkage => :static`, `ccache_enabled`.
- `Info.plist`: `CADisableMinimumFrameDurationOnPhone` (ProMotion 120 Гц).
- `ios/.xcode.env` — путь к node для фаз сборки; локальное переопределение —
  `.xcode.env.local` (вне git).
- Предсобранное ядро RN и маркер конфигурации — [tech/gotchas](../50-tech/gotchas.md).

## Android

- `gradle.properties`: `newArchEnabled=true`, `hermesEnabled=true`, все ABI.
- `versionCode` — `CI_BUILD_NUMBER * 1000` (без него — 1), `versionName` — с суффиксом
  окружения. Release подписан `debug.keystore`: прод-ключ не настроен.

## Предсобранные бинарники

Skia и AudioAPI держат бинарники вне npm-тарболов, `yarn install` их стирает.
`scripts/restore-native-libs.mjs` на `postinstall` возвращает их (`.version` и наличие
папок проверяются, повторный запуск ничего не качает); принудительно —
`yarn restore:native`.

## TypeScript, Babel, Metro

- `tsconfig.json`: `moduleSuffixes` `.ios/.android/.native` — платформенный резолв;
  декораторы и метаданные — для Inversify.
- `babel.config.js`: декораторы (legacy), метаданные типов, `module-resolver` с теми же
  алиасами, что в `tsconfig.json`, плагин Reanimated/worklets. Для Jest — отдельный
  `babel-jest.config.js` без плагина Reanimated; плагины декораторов в нём совпадают с
  основным, алиасы — в `moduleNameMapper` `jest.config.js`.
- `metro.config.js`: `watchFolders` — локально подключённые пакеты (`anchor-list`).

## orval

`orval.config.ts`: один бэкенд — `defineApi(name, input)` → `src/shared/api/gen/<name>/`
(`mode: single`, клиент axios, mutator `shared/api/<name>/<name>.mutator.ts`, очистка только
своей папки, после записи — prettier). Спецификация по умолчанию —
`../rest-api-template-app/src/routing/swagger.json`, переопределяется `MAIN_SWAGGER`.
