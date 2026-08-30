# CLAUDE.md

## Язык ответа

Отвечать на русском.

## Проект

RN template app: auth (sign-in/up/recovery, 2FA, biometrics, passkeys), сканеры
(текст/объекты/номера/контейнеры), чат на AnchorList, settings, ui-kit-плейграунд. Код — в `template/` (корневые
`package.json`/`template.config.js` принадлежат scaffold-утилите, не приложению).

## Стек

RN 0.86 + React 19.2 + TS 5.9 + MobX 6 + React Navigation 7 + Socket.IO 4 + Axios + Zod 4 +
react-hook-form 7 + Inversify 8 + Skia + Reanimated + keyboard-controller +
VisionCamera 5 (Nitro, frame-worklets).
New Architecture (Fabric/TurboModules). Node >= 22.11.

## Layout (FSD: app → pages → widgets → features → entities → shared)

- `app/` — композиционный корень: App.tsx, App.navigator.tsx, App.screens.ts, app-tab-screens.tsx,
  App.linking.ts, App.notifications.tsx, app.module.ts (DI), app-data-* (стор данных приложения)
- `pages/` — сгруппированы по навигаторам: `tabs/` (main, playground, settings),
  `stack/` (sign-in, sign-up, recovery-password, charts, chat, components,
  container-scanner, context-menu, input-bar, object-scanner, pdf-view, plate-scanner,
  text-scanner, web-view)
- `widgets/` — app-shell, chat (ChatView: AnchorList + InputBar + контекстное меню)
- `features/` — sign-in, sign-up, recovery-password, biometric, container-scan,
  message-actions, object-scan, plate-scan, text-scan
- `entities/` — auth, message, user
- `shared/` — ui | api | config | lib (di, holders, navigation, theme, socket, keyboard, ...)

## Правила (обязательные)

- FSD: импорт только вниз по слоям; слайсы одного слоя не импортируют друг друга
  (`eslint-plugin-boundaries`). Именование файлов/папок — `eslint-plugin-check-file`.
- `shared/api/gen/` — orval-генерация, **не редактировать** (`npm run generate:orval`).
- Алиасы `@app/@pages/@widgets/@features/@entities/@shared` — в `tsconfig.json` **и**
  `babel.config.js`, синхронно.
- Внутри слайса/сегмента — только относительные импорты; self-alias запрещён (`no-restricted-imports`).
- После каждой задачи — прогон `tsc --noEmit` и `eslint` в `template/`. Все ошибки править сразу, за один проход.
- **Багфикс через тест.** Любой баг сначала покрывается тестом, потом чинится.
  Порядок обязательный: тест, воспроизводящий баг и падающий на текущем коде →
  правка → зелёный прогон. Тест остаётся в кодовой базе. Если поведение не берётся
  юнит-тестом (RN-рантайм, Reanimated, нативный слой) — вынести вычислимую часть в
  чистый модуль и покрыть её, а невозможность прямого теста назвать явно.

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

- **Архитектура**: [`ARCHITECTURE.md`](template/ARCHITECTURE.md) — FSD, зависимости, naming, DI, state,
  HTTP/auth, socket, ESLint.
- **FSD-шпаргалка**: [`FSD-CHEATSHEET.md`](template/FSD-CHEATSHEET.md) — выбор слоя, сегменты,
  public API и checklist.
- **Конвенции**: [`CONVENTIONS.md`](template/CONVENTIONS.md) — naming, компоненты, imports, TypeScript,
  hooks, комментарии, тесты и проверки.
- **Clean code**: [`CLEAN-CODE.md`](template/CLEAN-CODE.md) и
  [`DESIGN-PRINCIPLES.md`](template/DESIGN-PRINCIPLES.md) — KISS, YAGNI, DRY, SOLID и паттерны.
- Нативные модули / чат / keyboard: `.claude/memory/project_native.md`
- UI-кит: `.claude/memory/project_components.md`
- Экраны / навигация: `.claude/memory/project_screens.md`
- Паттерны: `.claude/memory/project_patterns.md`
- Сборка: `.claude/memory/project_build.md`
- Алиасы: `.claude/memory/project_aliases.md`
