# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

RN template app (messenger demo): auth (sign-in/up/recovery, 2FA, biometrics, passkeys), a chat room
screen (mocked data), settings, and a "ui-kit-demo" playground. Source lives in `template/` (root
`package.json`/`template.config.js` are for the scaffold tool, not the app).

## Layout (FSD: app → pages → widgets → features → entities → shared)

- `app/` — composition root: App.tsx, App.navigator.tsx, App.screens.ts, app-tab-screens.tsx,
  App.linking.ts, app.module.ts (DI registration)
- `pages/` — sign-in, sign-up, recovery-password, chat, settings, ui-kit-demo
- `widgets/` — chat-room, app-shell
- `features/` — sign-in, sign-up, recovery-password, biometric
- `entities/` — auth, user
- `shared/` — ui | api | config | lib (di, holders, navigation, theme, socket, keyboard, ...)

## Stack

RN 0.86 + React 19.2 + TS 5.9 + MobX 6 + React Navigation 7 + Socket.IO 4 + Axios + Zod 4 +
react-hook-form 7 + Inversify 8 (IoC) + Skia + Reanimated + `@legendapp/list` v3 + keyboard-controller.
New Architecture (Fabric/TurboModules). Node >= 22.11.

## Non-negotiable rules

- FSD layers import only downward; same-layer slices never import each other (`eslint-plugin-boundaries`);
  file/folder naming via `eslint-plugin-check-file`.
- `shared/api/gen/` is orval-generated — **never edit** (`npm run generate:orval`).
- Aliases `@app/@pages/@widgets/@features/@entities/@shared` declared in **both** `tsconfig.json` and
  `babel.config.js` — kept in sync by hand.
- Inside a slice/segment only relative imports; own alias forbidden (`no-restricted-imports`).

## Commands (from `template/`)

```bash
npm run ios:{Dev,Stg,Prod}-{Debug,Release}
npm run android:{Dev,Stg,Prod}-{Debug,Release}
npm run android:build          # assembleProductionRelease
npm run lint | lint:fix | prettier:fix
npm run generate:orval         # regenerate src/shared/api/gen/ from OpenAPI
npm run start | reinstall
```

No `plop`/scaffolder — new files are created by hand.

## Native (вкратце)

ChatView/InputBar/ContextMenu — iOS-бриджи к внешнему поду `IOSChatView` (sibling repo,
`../../../rn-chat-view`); Android/non-iOS — JS-порты (`JsChatView`/`JsInputBar`/`JsContextMenuView`).
Picker/WheelPicker — на обеих платформах. Load-bearing правила (keyboard compensation, identity-кэш
строк, статические аватары) — в `project_native.md`.

`JsChatView` полагается на штатные механизмы `@legendapp/list` v3.3 (`sharedValues`,
`stickyHeaderIndices`, `viewabilityConfigCallbackPairs`, `maintainScrollAtEnd`) — динамическое
позиционирование живёт на UI-потоке. **Не писать ручные JS-аналоги** (геометрия, якоря, доли
видимости): их специально убрали при рефакторинге, таблица соответствий — в `project_native.md`.

## Где читать

- **Архитектура (главное)**: [`ARCHITECTURE.md`](ARCHITECTURE.md) (корень) — FSD, правила зависимостей,
  naming, DI, state, HTTP/auth, socket, ESLint.
- Нативные модули / chat-view / keyboard: `.claude/memory/project_native.md`
- UI-кит, slots: `.claude/memory/project_components.md`
- Экраны / навигация: `.claude/memory/project_screens.md`
- Паттерны (store/хук/страница/форма): `.claude/memory/project_patterns.md`
- Сборка / multi-env: `.claude/memory/project_build.md`
- Path aliases: `.claude/memory/project_aliases.md`

## Docs sync

Structural changes MUST update CLAUDE.md + the relevant `.claude/memory/*` in the same change.
