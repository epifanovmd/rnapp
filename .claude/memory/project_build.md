---
name: Build & Environment
description: Скрипты, multi-env, iOS/Android-сборка, orval, Metro, env-конфигурация
type: project
---

## Скрипты (`template/package.json`)

```bash
npm run start                  # Metro bundler, --reset-cache
npm run reinstall              # watchman clean + node_modules + pod install
npm run lint | lint:fix        # ESLint src/**/*.ts,tsx
npm run prettier:fix           # Prettier src/**/*.ts,tsx
npm run generate:orval         # orval → shared/api/gen/
npm run check-packages-updates # yarn outdated
npm run clean:android          # cd android && ./gradlew clean
npm run restore:native         # перезалить бинарники Skia и AudioAPI (--force)
```

### Предсобранные бинарники (`scripts/restore-native-libs.mjs`)

Skia и AudioAPI держат бинарники вне своих npm-тарболов, поэтому `yarn install`
их сносит. Скрипт висит на `postinstall` и возвращает всё на место:

- Skia — копирует xcframework'и из `react-native-skia-apple-{ios,macos,tvos}` в
  `@shopify/react-native-skia/libs/<platform>` и штампует `.version`; podspec
  делает то же самое на `pod install` и при совпадении версии копию пропускает.
  Android-бинарники gradle читает прямо из `react-native-skia-android`.
- AudioAPI — запускает `scripts/download-prebuilt-binaries.sh` пакета для ios и
  android (ffmpeg/opus/vorbis в `common/cpp/audioapi/external`, `.so` в
  `android/src/main/jniLibs`); иначе это делают podspec и gradle-таск.

Повторный запуск ничего не перекачивает: проверяются `.version` и наличие папок.
На APFS копирование идёт клонированием (`cp -Rc`) — мгновенно и без расхода места.

### iOS

```bash
npm run ios:{Dev,Stg,Prod}-{Debug,Release}
# Схемы: rnapp.developmentDebug, rnapp.developmentRelease,
#        rnapp.stagingDebug, rnapp.stagingRelease,
#        rnapp.productionDebug, rnapp.productionRelease
```

Опечатка в схеме `ios:Stg-Release`: `'rnapp.stagingReleasse'` (двойная `s`). Не исправлять без проверки нативной сборки.

### Android

```bash
npm run android:{Dev,Stg,Prod}-{Debug,Release}
# Режимы: developmentDebug/Release, stagingDebug/Release, productionDebug/Release
npm run android:build          # assembleProductionRelease (gradlew)
```

## Multi-env (`react-native-config`)

Переменные окружения — `config/env/*.{ios,android}.env`:

| Файл | Назначение |
|---|---|
| `development.ios.env` / `development.android.env` | dev-стенд |
| `staging.ios.env` / `staging.android.env` | staging |
| `production.ios.env` / `production.android.env` | production |

Переменные:
- `BASE_URL` — HTTP API
- `SOCKET_BASE_URL` — WebSocket
- `APP_ID_IOS` / `APP_ID_ANDROID` — bundle id
- `DISPLAY_NAME` — имя приложения
- `DEEPLINK_BASE_URL` — схема deep link

Потребление: `react-native-config` → `src/shared/config/env.ts`:
```ts
export const BASE_URL = Config.BASE_URL;
export const SOCKET_BASE_URL = Config.SOCKET_BASE_URL;
export const DEEPLINK_BASE_URL = Config.DEEPLINK_BASE_URL;
```

На Android `build.gradle` читает env в `productFlavors` (development/staging/production) и подставляет `applicationId`, `app_name`, `versionName`. APK-имя: `{applicationId}-v{versionName}({versionCode}).apk`.

На iOS `Info.plist` подставляет `$(DISPLAY_NAME)` в `CFBundleDisplayName`, `$(DEEPLINK_BASE_URL)` в `CFBundleURLSchemes`.

## Android

- `android/gradle.properties`: `newArchEnabled=true`, `hermesEnabled=true`, `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`, `edgeToEdgeEnabled=false`
- `android/app/build.gradle`: `enableSeparateBuildPerCPUArchitecture=false`, `enableProguardInReleaseBuilds=false`
- `versionCode = CI_BUILD_NUMBER * 1000` (если нет — 1)
- `versionName = "0.0.1"` + суффикс `-development`/`-staging`/`-production`
- Подпись release: `debug.keystore` (checked-in). Прод-keystore не настроен.
- `multiDexEnabled true`
- Зависимости: `firebase-bom:31.2.2`, `firebase-analytics`, `core-ktx:1.13.1`, `recyclerview:1.3.2`
- `react-native.config` в `MainApplication.kt` не регистрируется (только `RnWheelPickerPackage` добавляется вручную)

## iOS

- `ios/Podfile`: `platform :ios, min_ios_version_supported`, `use_frameworks! :linkage => :static`
- Подключаемые поды: `react-native-config`, `Firebase/Core`, `Firebase/Messaging`
- Пост-инсталл: `react_native_post_install` с `ccache_enabled: true`
- Разрешённые permissions: только `Notifications`
- `Info.plist`: `CADisableMinimumFrameDurationOnPhone=true` (ProMotion 120Hz)

## TS / Babel / Metro

**TypeScript** (`tsconfig.json`):
- `moduleSuffixes: [".ios", ".android", ".native", ""]` — платформенный резолв
- `experimentalDecorators: true`, `emitDecoratorMetadata: true` — Inversify DI
- Алиасы: `@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`

**Babel** (`babel.config.js`):
- Пресет `module:@react-native/babel-preset`
- Плагины: `@babel/plugin-proposal-decorators` (legacy), `@babel/plugin-transform-export-namespace-from`, `babel-plugin-transform-typescript-metadata`, `babel-plugin-parameter-decorator`, `react-native-reanimated/plugin`
- `module-resolver` — те же алиасы, что в `tsconfig.json`

**Metro** (`metro.config.js`):
- `mergeConfig(getDefaultConfig(__dirname), config)`
- `resolveRequest` для `axios`: подставляет `unstable_conditionNames: ["browser"]` (axios использует browser-сборку)

## orval

Конфиг: `orval.config.ts`. Генерит `shared/api/gen/`:
- `mode: "single"` → `api.ts` (все эндпоинты в одном файле)
- `client: "axios"`, mutator — `shared/api/http-client.ts` (`axiosInstance`)
- `clean: ["./src/shared/api/gen"]` — полная очистка перед генерацией
- Спецификация: `http://147.45.245.104:8181/api-docs/swagger.json`
- `transformer`: переименовывает дублирующийся `operationId` `SearchMessages` → `SearchChatMessages` (конфликт между `/api/chat/{chatId}/message/search` и `/api/message/search`)
- `afterAllFilesWrite`: `prettier --parser typescript --write`

## Codegen (Fabric)

`package.json` → `codegenConfig`:
- `name: "RNAppSpec"`, `type: "components"`, `jsSrcsDir: "src"`
- `android.javaPackageName: "com.rnapp.spec"`

## Pre-commit

Husky + lint-staged: `*.{ts,tsx}` → `eslint --fix` + `prettier --parser typescript --write`
