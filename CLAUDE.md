# CLAUDE.md

## Язык ответа

Отвечать на русском.

## Проект

RN template app (messenger demo): auth (sign-in/up/recovery, 2FA, biometrics, passkeys), чат
(мок-данные), settings, ui-kit-плейграунд. Код — в `template/` (корневые
`package.json`/`template.config.js` принадлежат scaffold-утилите, не приложению).

## Стек

RN 0.86 + React 19.2 + TS 5.9 + MobX 6 + React Navigation 7 + Socket.IO 4 + Axios + Zod 4 +
react-hook-form 7 + Inversify 8 + Skia + Reanimated + `@legendapp/list` v3.3 + keyboard-controller +
VisionCamera 5 (Nitro, frame-worklets).
New Architecture (Fabric/TurboModules). Node >= 22.11.

## Layout (FSD: app → pages → widgets → features → entities → shared)

- `app/` — композиционный корень: App.tsx, App.navigator.tsx, App.screens.ts, app-tab-screens.tsx,
  App.linking.ts, App.notifications.tsx, app.module.ts (DI), app-data-* (стор данных приложения)
- `pages/` — сгруппированы по навигаторам: `tabs/` (main, playground, settings),
  `stack/` (sign-in, sign-up, recovery-password, chat, charts, components,
  container-scanner, context-menu, input-bar, object-scanner, pdf-view, plate-scanner,
  text-scanner, web-view)
- `widgets/` — chat-room, app-shell
- `features/` — sign-in, sign-up, recovery-password, biometric, container-scan,
  object-scan, plate-scan, text-scan
- `entities/` — auth, user
- `shared/` — ui | api | config | lib (di, holders, navigation, theme, socket, keyboard, ...)

## Правила (обязательные)

- FSD: импорт только вниз по слоям; слайсы одного слоя не импортируют друг друга
  (`eslint-plugin-boundaries`). Именование файлов/папок — `eslint-plugin-check-file`.
- `shared/api/gen/` — orval-генерация, **не редактировать** (`npm run generate:orval`).
- Алиасы `@app/@pages/@widgets/@features/@entities/@shared` — в `tsconfig.json` **и**
  `babel.config.js`, синхронно.
- Внутри слайса/сегмента — только относительные импорты; self-alias запрещён (`no-restricted-imports`).
- После каждой задачи — прогон `tsc --noEmit` и `eslint` в `template/`. Все ошибки править сразу, за один проход.

## Комментарии в коде

- Разрешены только: JSDoc/краткий комментарий к пропсам, определениям функций, компонентов и хуков.
- В теле функций — только если место неочевидное и без комментария нельзя.
- Комментарий — краткий, по факту. Не описывать историю изменений.
- Если комментарий устарел — переписать заново, а не дополнять.

## Документация

- Обновлять только если изменился архитектурный факт.
- Писать новое состояние, не описывать «что и когда изменилось».
- Только сухие факты: архитектура, структура, важные решения.

## Команды (из `template/`)

```bash
npm run ios:{Dev,Stg,Prod}-{Debug,Release}
npm run android:{Dev,Stg,Prod}-{Debug,Release}
npm run android:build          # assembleProductionRelease
npm run lint | lint:fix | prettier:fix
npm run generate:orval         # перегенерировать shared/api/gen/
npm run start | reinstall
npm run restore:native         # бинарники Skia/AudioAPI после yarn install
```

Нет scaffolder'а — файлы создаются вручную.

## Чат

ChatView, InputBar и ContextMenuView (`shared/ui/chat-view`, `shared/ui/input-bar`,
`shared/ui/context-menu-view`) — обычные React-компоненты. Внешней настройки
оформления и поведения нет: палитра light/dark выбирается по `useTheme().isDark`,
метрики — литералы в стилях; коллбэки принимают обычные аргументы, а не
объекты-события.

`ChatView` использует штатные механизмы `@legendapp/list` v3.3: `sharedValues`,
`stickyHeaderIndices`, `viewabilityConfigCallbackPairs`, `maintainVisibleContentPosition`,
`maintainScrollAtEnd`. Ручные JS-аналоги геометрии/якорей не допускаются.
Детали: `.claude/memory/project_native.md`.

## Нативные модули

WheelPicker (`RNWheelPicker`) — на обеих платформах, единый API из одной codegen-спеки:
iOS — Swift/UIKit + UICollectionView, Android — Kotlin + RecyclerView.
AppSplash — свой splash-экран на обеих платформах, ассеты генерируются `npm run splash`
из `splash.config.mjs`.
VisionEngine (`template/modules/react-native-vision-engine`) — локальный Nitro-модуль
(link:-зависимость) generic-OCR + детекция объектов (`detectObjects`) для VisionCamera v5: iOS — Apple Vision + опц.
CoreML-детектор, Android — ML Kit + опц. TFLite-детектор. Модели детекторов
(YOLO → CoreML со встроенным NMS / TFLite) кладутся вручную в
`template/ios/MLModels/` и `template/android/app/src/main/assets/`
(см. README в этих папках); без модели OCR работает полнокадрово.

## Где читать

- **Архитектура**: [`ARCHITECTURE.md`](ARCHITECTURE.md) — FSD, зависимости, naming, DI, state,
  HTTP/auth, socket, ESLint.
- **FSD-шпаргалка**: [`FSD-CHEATSHEET.md`](FSD-CHEATSHEET.md) — выбор слоя, сегменты,
  public API и checklist.
- **Конвенции**: [`CONVENTIONS.md`](CONVENTIONS.md) — naming, компоненты, imports, TypeScript,
  hooks, комментарии, тесты и проверки.
- **Clean code**: [`CLEAN-CODE.md`](CLEAN-CODE.md) и
  [`DESIGN-PRINCIPLES.md`](DESIGN-PRINCIPLES.md) — KISS, YAGNI, DRY, SOLID и паттерны.
- Нативные модули / чат / keyboard: `.claude/memory/project_native.md`
- UI-кит: `.claude/memory/project_components.md`
- Экраны / навигация: `.claude/memory/project_screens.md`
- Паттерны: `.claude/memory/project_patterns.md`
- Сборка: `.claude/memory/project_build.md`
- Алиасы: `.claude/memory/project_aliases.md`
