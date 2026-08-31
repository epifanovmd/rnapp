---
name: Code Patterns & Conventions
description: Паттерны — entity store, feature-хук, страница, compound component, форма
type: project
---

| Паттерн                               | Где смотреть                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| Entity store (DI + MobX)              | `entities/auth/model/{types,store}.ts` + `auth.module.ts`                    |
| Feature-хук                           | `features/sign-in/model/useSignInVM.ts` (+ `validation.ts`)                  |
| Страница                              | `pages/sign-in/SignIn.tsx` → регистрация в `App.screens.ts`                  |
| Compound via slots                    | `shared/ui/navbar/Navbar.tsx` (`slot.of` + `createCompound`)                 |
| Многоуровневые слоты + инъекция props | `shared/ui/bottom-sheet/`                                                    |
| Форма (RHF + Zod)                     | `useForm({ resolver: zodResolver(schema) })`; schema в `model/validation.ts` |

Правила:

- Store: `createInjectDecorator<T>()` → `<slice>.module.ts` → `app/app.module.ts`.
  Потребление: `IXxx.useInstance()` / `IXxx.getInstance()`.
- Общая логика слайсов одного слоя — слоем ниже (`loginValidation` в `entities/auth`).
- Async-state — через холдеры `shared/lib/holders/`.
- `shared/api/gen/` не редактировать.
- Стили: `useTheme`; тем-зависимые style-объекты — `makeThemeStyles` (фабрика уровня
  модуля, кэш по имени темы). Тема: предпочтение `Light | Dark | System` (дефолт System,
  следует схеме ОС), в MMKV сохраняется только явный выбор.
- Scroll-поведения строятся на телеметрии `shared/lib/scroll/`: `useScrollTelemetry()` —
  единственный владелец onScroll (offset, direction, drag/momentum, overscroll, maxOffsetY),
  чистые вычисления — в `scroll-metrics.ts`, потребители реагируют через `useAnimatedReaction`.
  Тип разрезан: `IScrollValues` (только shared values, контракт для чтения) и
  `IScrollTelemetry` (+ scrollHandler/handlers, контракт владельца onScroll).
  Владение явное: `useScrollTelemetry()` — создать (экран раздаёт вниз через `ScrollProvider`,
  либо самодостаточный компонент держит телеметрию локально, когда хендлер и анимация
  в одном месте); `useScroll()` — только потребление, без провайдера кидает ошибку,
  как `useNavbar`/`useTabBar`.
- Скрываемые панели: `shared/lib/bars/` — только примитив: `IBar` (offset/height +
  show/hide/snap/shift) на `makeMutable`, `createBarContext(name)` (провайдер + хук на одну
  панель), `useBarHeight(bar)` через `useSyncExternalStore` (высота не в React-state),
  `useBarScrollValues(telemetry)` (безопасные shared values, без telemetry — ближайший
  ScrollProvider) и чистый `resolveScrollEdge` (край списка важнее любого поведения).
- У каждой панели свой слой управления рядом с её UI: навбар — `shared/ui/navbar/`
  (`NavbarProvider`, `useNavbar`, `useNavbarHeight`, `useNavbarScrollSync` — follow + snap),
  таб-бар — `widgets/app-shell/` (`TabBarProvider`, `useTabBar`, `useTabBarHeight`,
  `useTabBarScrollSync` — toggle через чистый `accumulateToggle`). Экран подключает только
  те панели, которые у него есть (пример: `pages/stack/components/` — один `NavbarProvider`).
- Анимации от значения: `shared/lib/animation/useInterpolatedValue(source, in, out, extrapolation)`
  поверх любого SharedValue (офсет скролла, offset панели); прогресс 0..1 — тот же хук
  с выходом `[0, 1]`.
- Pull-to-refresh: `shared/lib/pull-to-refresh/` — только логика (контроллер-state-machine
  на shared values + адаптеры `usePullToRefreshScroll({ telemetry })`/`usePullToRefreshGesture`),
  визуал строится на месте вызова по `pullDistance`/`progress`/`state` (пример: `pages/tabs/main/`).
- Внутри слайса/сегмента — только относительные импорты.
