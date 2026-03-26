---
name: Build & Environment
description: Команды сборки, multi-env конфигурация, CI, нативные настройки
type: project
---

## Commands (template/package.json)

```bash
# iOS
npm run ios:Dev-Debug        # Development debug
npm run ios:Stg-Debug        # Staging debug
npm run ios:Stg-Release      # Staging release
npm run ios:Prod-Debug       # Production debug
npm run ios:Prod-Release     # Production release

# Android
npm run android:Dev-Debug
npm run android:Stg-Debug
npm run android:Stg-Release
npm run android:Prod-Release

# Code Quality
npm run lint                 # ESLint
npm run lint:fix             # ESLint auto-fix
npm run prettier:fix         # Prettier

# Code Generation
npm run generate:api         # OpenAPI → API client
```

## Multi-Environment

3 среды: development, staging, production
- react-native-config: отдельные .env файлы per env
- Android: `config/env/{env}.android.env` в build.gradle
- iOS: Xcode schemes per environment
- APP_ID, DISPLAY_NAME, API URLs — из .env

## Android Build
- Gradle (build.gradle, NOT .kts)
- Version code: `CI_BUILD_NUMBER * 1000`
- Hermes enabled
- Namespace: `com.rnapp`
- Deep link scheme из `@string/DEEPLINK_BASE_URL`

## iOS Build
- CocoaPods (Podfile)
- Frameworks: static linkage
- Firebase/Core + Firebase/Messaging
- BootSplash (storyboard)
- Min iOS version: platform default

## TypeScript
- Target: через @react-native/typescript-config
- experimentalDecorators + emitDecoratorMetadata (для IoC)
- Path aliases через tsconfig paths + babel module-resolver
