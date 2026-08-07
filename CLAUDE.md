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
  `stack/` (sign-in, sign-up, recovery-password, chat, carousel, charts, components,
  container-scanner, context-menu, input-bar, pdf-view, plate-scanner, text-scanner, web-view)
- `widgets/` — chat-room, app-shell
- `features/` — sign-in, sign-up, recovery-password, biometric, container-scan,
  plate-scan, text-scan
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
```

Нет scaffolder'а — файлы создаются вручную.

## Нативные модули

ChatView/InputBar/ContextMenu — iOS-бриджи к поду `IOSChatView` (sibling repo
`../../../rn-chat-view`). Android/non-iOS — JS-порты (`JsChatView`/`JsInputBar`/`JsContextMenuView`).
WheelPicker (`RNWheelPicker`) — на обеих платформах, единый API из одной codegen-спеки:
iOS — Swift/UIKit + UICollectionView, Android — Kotlin + RecyclerView.
AppSplash — свой splash-экран на обеих платформах, ассеты генерируются `npm run splash`
из `splash.config.mjs`.
OcrEngine (`template/modules/react-native-ocr-engine`) — локальный Nitro-модуль
(link:-зависимость) generic-OCR для VisionCamera v5: iOS — Apple Vision + опц.
CoreML-детектор, Android — ML Kit + опц. TFLite-детектор. Модели детекторов
(YOLO → CoreML со встроенным NMS / TFLite) кладутся вручную в
`template/ios/MLModels/` и `template/android/app/src/main/assets/`
(см. README в этих папках); без модели OCR работает полнокадрово.

`JsChatView` использует штатные механизмы `@legendapp/list` v3.3: `sharedValues`,
`stickyHeaderIndices`, `viewabilityConfigCallbackPairs`, `maintainVisibleContentPosition`,
`maintainScrollAtEnd`. Ручные JS-аналоги геометрии/якорей не допускаются.
Детали: `.claude/memory/project_native.md`.

## Где читать

- **Архитектура**: [`ARCHITECTURE.md`](ARCHITECTURE.md) — FSD, зависимости, naming, DI, state,
  HTTP/auth, socket, ESLint.
- Нативные модули / chat-view / keyboard: `.claude/memory/project_native.md`
- UI-кит: `.claude/memory/project_components.md`
- Экраны / навигация: `.claude/memory/project_screens.md`
- Паттерны: `.claude/memory/project_patterns.md`
- Сборка: `.claude/memory/project_build.md`
- Алиасы: `.claude/memory/project_aliases.md`
