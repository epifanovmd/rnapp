---
name: Code Patterns & Conventions
description: Паттерны — entity store, feature-хук, страница, compound component, форма
type: project
---

| Паттерн | Где смотреть |
|---|---|
| Entity store (DI + MobX) | `entities/auth/model/{types,store}.ts` + `auth.module.ts` |
| Feature-хук | `features/sign-in/model/useSignInVM.ts` (+ `validation.ts`) |
| Страница | `pages/sign-in/SignIn.tsx` → регистрация в `App.screens.ts` |
| Compound via slots | `shared/ui/navbar/Navbar.tsx` (`slot.of` + `createCompound`) |
| Многоуровневые слоты + инъекция props | `shared/ui/bottom-sheet/` |
| Форма (RHF + Zod) | `useForm({ resolver: zodResolver(schema) })`; schema в `model/validation.ts` |

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
  единственный владелец onScroll (offset, direction, drag/momentum, overscroll в shared
  values), потребители реагируют через `useAnimatedReaction`; `ScrollProvider`/`useScroll` —
  для глубоких потребителей (ImageBar, табы).
- Бары: `shared/lib/transition/` — `TransitionProvider` создаёт `IBarHandle` (navbar, tabBar;
  чистая state machine видимости), экран привязывает их к своему скроллу через
  `useBarsScrollSync(telemetry)` (navbar follow + snap, tabbar toggle с порогом).
  `useTransition()` — только чтение, без провайдера кидает ошибку. Вложенный
  `TransitionProvider` даёт изолированные бары поддереву (пример: `pages/stack/components/`).
- Pull-to-refresh: `shared/lib/pull-to-refresh/` — только логика (контроллер-state-machine
  на shared values + адаптеры `usePullToRefreshScroll({ telemetry })`/`usePullToRefreshGesture`),
  визуал строится на месте вызова по `pullDistance`/`progress`/`state` (пример: `pages/tabs/main/`).
- Внутри слайса/сегмента — только относительные импорты.
