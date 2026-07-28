---
name: Build & Environment
description: Команды сборки, multi-env конфигурация, native build notes
type: project
---

## Commands (`template/package.json`)

```bash
# iOS
npm run ios:Dev-Debug          # --scheme 'rnapp.developmentDebug'
npm run ios:Dev-Release        # --scheme 'rnapp.developmentRelease'
npm run ios:Stg-Debug          # --scheme 'rnapp.stagingDebug'
npm run ios:Stg-Release        # --scheme 'rnapp.stagingReleasse'  (NOTE: typo in repo — extra 's', unverified whether intentional)
npm run ios:Prod-Debug         # --scheme 'rnapp.productionDebug'
npm run ios:Prod-Release       # --scheme 'rnapp.productionRelease'

# Android
npm run android:Dev-Debug      # --mode=developmentDebug
npm run android:Dev-Release
npm run android:Stg-Debug
npm run android:Stg-Release
npm run android:Prod-Debug
npm run android:Prod-Release
npm run android:build          # cd android && ./gradlew assembleProductionRelease
npm run clean:android          # cd android && ./gradlew clean

# Code Quality
npm run lint                   # eslint "src/**/*{.ts,.tsx}"
npm run lint:fix               # eslint --fix
npm run prettier:fix           # prettier --write src/**/*.{ts,tsx}

# Code Generation
npm run generate:orval         # orval --config ./orval.config.ts → src/shared/api/gen/

# Misc
npm run start                  # react-native start --reset-cache
npm run reinstall              # watchman watch-del-all + rm -rf node_modules + yarn + pod install
npm run check-packages-updates # yarn outdated
npm run prepare                 # husky (git hooks, runs post-install)
```

Lint-staged (`package.json` → `lint-staged`) runs `eslint --fix` + `prettier --write` on staged
`*.{ts,tsx}` via a Husky pre-commit hook (`.husky/`).

There is no scaffolding/generator script (e.g. `plop`) in this project — it was removed; new
slices/files/screens are created by hand following `project_patterns.md`.

## Multi-environment

Three environments: `development`, `staging`, `production`, each with `debug`/`release` variants.
- `react-native-config` (`react-native-config` pod/gradle plugin) loads per-env `.env` files:
  `template/config/env/{development,staging,production}.{ios,android}.env` (6 files total, separate
  per-platform even though the env var names presumably overlap).
- Android: `android/app/build.gradle`'s `envConfigFiles` maps each of the 6 build variants
  (`developmentDebug`, `developmentRelease`, `stagingDebug`, `stagingRelease`, `productionDebug`,
  `productionRelease`) to the matching `config/env/*.android.env` file.
- iOS: matched by Xcode scheme (`rnapp.<env><Debug|Release>`, see `project_native.md` for the scheme
  list and the known `stagingReleasse` typo).
- Values consumed in JS via `src/shared/config/env.ts` (e.g. `BASE_URL`, `DEEPLINK_BASE_URL`); Android
  additionally reads `APP_ID_ANDROID`/`DISPLAY_NAME` directly in `build.gradle` for
  `applicationId`/app name.

## Android build
- Gradle (Groovy `build.gradle`, not Kotlin DSL).
- `flavorDimensions "main"` × `development|staging|production` product flavors, crossed with
  `debug|release` build types.
- Version code: `Integer.valueOf(System.env.CI_BUILD_NUMBER ?: 1) * 1000`; version name suffixed per
  flavor (`0.0.1-development`, etc.).
- Namespace `com.rnapp`; Hermes enabled; New Architecture / Fabric enabled
  (`DefaultNewArchitectureEntryPoint.fabricEnabled` in `MainActivity.kt`).
- Debug and release both currently sign with the checked-in `debug.keystore` — release does NOT have a
  separate production keystore configured (see comment in `build.gradle`: "Caution! In production, you
  need to generate your own keystore file").
- Deep link scheme comes from the Android string resource `@string/DEEPLINK_BASE_URL`.
- Autolinking: `react { autolinkLibrariesWithApp() }`; the only manually-registered native package is
  `RnWheelPickerPackage()` in `MainApplication.kt` (see `project_native.md`).

## iOS build
- CocoaPods (`ios/Podfile`), `use_frameworks! :linkage => :static`.
- New Architecture bootstrap in `AppDelegate.swift` (`RCTReactNativeFactory` + `RCTAppDependencyProvider`).
- `IOSChatView` pod is a **path dependency to a sibling repo** (`../../../rn-chat-view`, i.e. outside this
  repo) — cloning this repo alone is not sufficient to `pod install`; that sibling checkout must exist
  at the expected relative path.
- Firebase (`Firebase/Core`, `Firebase/Messaging`) and `react-native-config` also linked via Pods.
- BootSplash via storyboard (`RNBootSplash.initWithStoryboard`).
- 6 Xcode schemes matching the 6 env/build-type combinations (see `project_native.md`).
- Ruby toolchain pinned via `Gemfile` (`xcodeproj < 1.26.0`, `concurrent-ruby < 1.3.4`, plus Ruby 3.4
  stdlib shims: `bigdecimal`, `logger`, `benchmark`, `mutex_m`, `nkf`).

## TypeScript
- Extends `@react-native/typescript-config`.
- `experimentalDecorators` + `emitDecoratorMetadata` enabled (required for Inversify's decorator-based DI).
- `moduleSuffixes: [".ios", ".android", ".native", ""]` — lets a standalone `tsc` run resolve
  platform-specific files (`*.ios.tsx`/`*.android.tsx`) the same way Metro does at bundle time.
- Path aliases via `compilerOptions.paths`, mirrored manually in `babel.config.js`'s `module-resolver`
  (see `project_aliases.md`) — these two are the actual source of truth; there's no generator that keeps
  them in sync automatically.
- `include: ["./src/**/*"]`, `exclude: ["**/node_modules", "**/Pods"]`.

## API codegen
`orval.config.ts` generates `src/shared/api/gen/api.ts` + `gen/model/*.ts` from a remote OpenAPI spec
(`http://147.45.245.104:8181/api-docs/swagger.json` — a live dev/staging server, not a local file) via
axios client mode, using `src/shared/api/http-client.ts`'s `axiosInstance` as the mutator. A `transformer`
hook renames a duplicate `operationId` (`SearchMessages` → `SearchChatMessages` for the
`/api/chat/{chatId}/message/search` path) to avoid a codegen name collision. Runs Prettier on the
generated output afterward (`afterAllFilesWrite` hook); ESLint explicitly ignores `src/shared/api/gen/**`
(global `ignores` entry in `eslint.config.mjs`).
