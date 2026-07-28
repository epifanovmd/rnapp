---
name: Path aliases
description: Актуальные path aliases проекта — 6 канонических алиасов Feature-Sliced Design
type: project
---

Алиасы объявлены синхронно в двух местах — при добавлении/изменении алиаса нужно править оба файла:
- `template/tsconfig.json` → `compilerOptions.paths` (типы/IDE, tsc)
- `template/babel.config.js` → плагин `module-resolver` (Metro bundler)

`@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared` — каждый резолвится и как голый
алиас (`@shared` → `src/shared`), и как алиас с подпутём (`@shared/*` → `src/shared/*`).

Что где лежит (соответствует слоям FSD):
- `@app` → `src/app/` — композиционный корень, DI-регистрация, навигационные манифесты
- `@pages` → `src/pages/` — экраны (sign-in, sign-up, recovery-password, chat, settings, ui-kit-demo)
- `@widgets` → `src/widgets/` — chat-room, app-shell
- `@features` → `src/features/` — sign-in, sign-up, recovery-password, biometric
- `@entities` → `src/entities/` — auth, user
- `@shared` → `src/shared/` — ui, api, config, lib

Полезные под-пути внутри `@shared`:
- `@shared/lib/di` — `createInjectDecorator`, `iocContainer`
- `@shared/lib/holders` — EntityHolder/PagedHolder/InfiniteHolder/CollectionHolder/MutationHolder/
  PollingHolder/CombinedHolder/CursorHolder/FilterHolder и их хуки
- `@shared/lib/navigation` — StackNavigation/TabNavigation/TopTabNavigation, NavigationService
- `@shared/lib/theme` — ThemeProvider, useTheme, useThemeAwareObject
- `@shared/lib/socket` — SocketTransport, UserSocketService
- `@shared/lib/slots` — createSlot, useSlotProps (compound components)
- `@shared/lib/models` — DataModelBase, EnumModelBase (`createEnumModelBase`)
- `@shared/lib/utils` — общие утилиты
- `@shared/lib/hooks` — общие хуки (useBoolean, useDimensions, ...)
- `@shared/api` — HttpClient (axios), `api.gen/` (orval codegen, не редактировать вручную)
- `@shared/config` — env.ts (react-native-config)
- `@entities/auth` — общая логина/пароль-валидация (`loginValidation`, `passwordValidation`), AuthStore,
  BiometricStore, PasskeyStore, JWT/session/token сервисы; схема конкретной формы — в фиче
  (`@features/sign-in`, `@features/sign-up`)
- `@entities/user` — UserStore, SessionStore, UserRealtime, доменные модели пользователя

Без `~`-префикса нигде в проекте не используется.
