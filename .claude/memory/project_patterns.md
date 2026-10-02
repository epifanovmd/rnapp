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
- Скрываемые панели: `shared/lib/bars/` — только примитив: `IBar` (offset/height/pinned/inset +
  show/hide/snap/shift) на `makeMutable`; ход скрытия = height − pinned
  (`setPinnedHeight` — закреплённая часть HiddenBar); смена высоты перебазирует offset на
  UI-потоке (`rebaseOffset`: скрытая остаётся скрытой), `inset` — высота с анимацией
  переизмерения (`NavbarInset`/`useNavbarInset` — отступ контента без рывка при живой
  высоте шапки; `useNavbarHeight` меняется скачком), `createBarContext(name)` (провайдер + хук на одну
  панель), `useBarHeight(bar)` через `useSyncExternalStore` (высота не в React-state),
  `useBarScrollValues(telemetry)` (безопасные shared values, без telemetry — ближайший
  ScrollProvider) и чистый `resolveScrollEdge` (край списка важнее любого поведения).
- У каждой панели свой слой управления рядом с её UI: навбар — `shared/ui/navbar/`
  (`NavbarProvider`, `useNavbar`, `useNavbarHeight`, `useNavbarScrollSync` — follow + snap),
  таб-бар — `widgets/app-shell/` (`TabBarProvider`, `useTabBar`, `useTabBarHeight`,
  `useTabBarScrollSync` — toggle через чистый `accumulateToggle`). Визуал скрытия отделён
  от поведения: `useTabBarStyle(mode)` — `"slide"` (уезжает вниз) или `"shrink"` (сжимается
  на месте вместе с иконками), выбор через проп `hideMode` у `<TabBar>`; прогресс скрытия
  любой панели — `barProgress(offset, height)`. Экран подключает только
  те панели, которые у него есть (пример: `pages/stack/components/` — один `NavbarProvider`).
- Анимации от значения: `shared/lib/animation/useInterpolatedValue(source, in, out, extrapolation)`
  поверх любого SharedValue (офсет скролла, offset панели); прогресс 0..1 — тот же хук
  с выходом `[0, 1]`.
- Pull-to-refresh: `shared/lib/pull-to-refresh/` — только логика (контроллер-state-machine
  на shared values + адаптеры `usePullToRefreshScroll({ telemetry })`/`usePullToRefreshGesture`),
  визуал строится на месте вызова по `pullDistance`/`progress`/`state` (пример: `pages/tabs/main/`).
- Внутри слайса/сегмента — только относительные импорты.

## Модели данных (`shared/lib/models`)

Базовые классы:

- `DataModelBase<TDto>` — `_data: observable.ref`: DTO не копируется, реакция только на
  замену объекта целиком (по полям DTO не мутировать);
- поля DTO — только через `model.data.x` (Proxy/`TypedModel` убраны 2026-09-28);
- геттеры наследника помечаются `computed` явно в `makeObservable` его конструктора;
- `createEnumModelBase` — `isX`-геттеры без `computed` (дешёвое сравнение с `data`).

## Даты

Библиотека дат — только `date-fns` (dayjs удалён 2026-09-28). Локаль по
умолчанию — `setDefaultOptions({ locale: ru })` в `App.tsx`. Календарь (`shared/ui/calendar`)
отдаёт и принимает `Date` (локальная полночь, экземпляр из кэша — не мутировать), `locale` —
объект `Locale` из `date-fns/locale`, строковые форматы — токены date-fns (`LLLL yyyy`,
`EEEEEE`, `d`).

## Производительность (аудит 2026-10-02)
- Holder-ы: списки `observable.ref` (`items`, `pendingItems`) — массив только заменять, не мутировать
  (push/splice на месте не уведомит). Глубокий observable превращал каждый DTO в observable на
  каждое обновление по сокету.
- Панели (`createBar`): `show/hide/snap` идемпотентны по цели (`isNewBarTarget`, `target` NaN
  после ручного `shift`/перемера); `accumulateToggle` после команды сбрасывает накопление — иначе
  анимация перезапускалась каждый кадр скролла и панель «отставала».
- Сокет: комнаты считают подписчиков (`rooms.ts`: вход на 0→1, выход на 1→0 и только при
  подключении; `testing/fake-socket.ts`). Транспорт через 30 с фона приостанавливается
  (`_suspend`: io-сокет отключён, подписчики и сокет сохранены, `_isSuspended` блокирует
  автопереподключение и `_onWake` из фона); возвращение — переподключение тем же сокетом,
  комнаты входят заново с `onRejoin`.
- `useLiveModel({ enabled })` — слушать только видимым экраном (`useIsFocused()`), включение
  перечитывает пропущенное.
- График: один мост активных индексов в React (`ChartActiveIndicesState.jsIndices/jsIndices2`,
  `sameIndices`), слои не держат свои `scheduleOnRN`. Сглаживание — монотонная кубическая
  (`monotoneSegments`, как d3 curveMonotoneX): Catmull–Rom при неравномерном шаге давал петли и
  провал ниже нуля.
- `Select`/`Autocomplete`: без `virtual` виртуализация сама при > 50 вариантов
  (`AUTO_VIRTUAL_THRESHOLD`), `false` — отключить.
- Сканеры: модель камеры — отдельный стабильный `vm.camera`; одинаковые строки OCR не меняют
  состояние (`sameLines`).
- Списки: `extraData` — стабильный ключ, не объект VM (новый объект на рендер перерисовывает все
  ячейки AnchorList).
