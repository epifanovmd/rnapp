# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Detailed Documentation

Подробная документация в `.claude/memory/` — при необходимости глубокого анализа читай эти файлы:
- `.claude/memory/project_architecture.md` — IoC, API layer, holders, socket, auth, навигация, структура
- `.claude/memory/project_native.md` — iOS/Android нативные модули (ChatView, ContextMenu, WheelPicker)
- `.claude/memory/project_components.md` — UI-компоненты, compound components, slots
- `.claude/memory/project_screens.md` — экраны, навигация
- `.claude/memory/project_patterns.md` — паттерны создания stores, компонентов, форм
- `.claude/memory/project_build.md` — команды, multi-env, CI
- `.claude/memory/project_aliases.md` — path aliases

## Commands

```bash
# iOS
npm run ios:Dev-Debug         # Development debug
npm run ios:Stg-Debug         # Staging debug
npm run ios:Prod-Release      # Production release

# Android
npm run android:Dev-Debug
npm run android:Stg-Debug
npm run android:Prod-Release

# Code Quality
npm run lint:fix              # ESLint auto-fix
npm run prettier:fix          # Prettier format

# API Generation
npm run generate:api          # Regenerate API types from OpenAPI
```

## Architecture

### Stack
React Native 0.84 + React 19 + TypeScript + MobX + React Navigation 7 + Socket.IO + Axios + Zod + react-hook-form + Inversify (IoC)

### Key Rules
- `src/api/api-gen/` — **auto-generated from OpenAPI, NEVER edit manually** (`npm run generate:api`)
- **Never import from @force-dev** — all infrastructure is local
- Path aliases: `@api`, `@store`, `@components`, `@core`, `@utils`, `@hooks`, `@di`, `@navigation`, `@socket` (без `~` префикса)

### IoC (Dependency Injection)
Internal DI in `src/di/` (inversify-based). Pattern:
```ts
export const IMyService = createServiceDecorator<IMyService>();
@IMyService({ inSingleton: true })
class MyService { constructor(@IOther() private other: IOther) {} }
const useMyService = iocHook(IMyService);
```

### Navigation (React Navigation 7)
Stack + Bottom Tabs + Material Top Tabs. PUBLIC_SCREENS (auth) vs PRIVATE_SCREENS (app).
NavigationService — singleton с историей и programmatic navigation.

### State Management (MobX)
Singleton stores via IoC. Data holders from `src/store/holders/`:
`EntityHolder`, `PagedHolder`, `InfiniteHolder`, `CollectionHolder`, `MutationHolder`, `PollingHolder`, `CombinedHolder`.

### Native Modules
- **ChatView**: iOS (40 Swift files), Android (16 Kotlin files) — full native chat UI
- **ContextMenu**: iOS (9 Swift files), Android (6 Kotlin files) — long-press context menu
- **WheelPicker**: Android only (5 Java files) — wheel date/time picker
