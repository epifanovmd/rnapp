---
module: shared/lib/keyboard-aware
summary: Поле формы целиком над клавиатурой в скролле — покадровая докрутка, распорка, реестр полей и возврат скролла при закрытии.
---

# keyboard-aware

Замена `KeyboardAwareScrollView` keyboard-controller'а на его примитивах
(`useKeyboardHandler`, `useReanimatedFocusedInput`): над клавиатурой оказывается поле
целиком (label, описание, ошибка, счётчик), докрутка идёт вместе с клавиатурой.

## Public API

| Экспорт                                                                                                | Что                                                                           |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `useKeyboardAwareScroll(scrollRef, options?)`                                                          | ядро → `{ registry, contentAnchorRef, spacerRef, spacerStyle, spacerHeight }` |
| `KeyboardAwareContent`                                                                                 | якорь первым, реестр для детей, распорка последней                            |
| `KeyboardAwareAnchor`, `KeyboardAwareSpacer`                                                           | части `KeyboardAwareContent` по отдельности (шапка и футер списка)            |
| `useKeyboardAwareAnchorList(config?)`                                                                  | обвязка для AnchorList → `{ controller, listProps, wrap }`                    |
| `useKeyboardAwareField(inputRef)`                                                                      | регистрация поля кита → `{ containerRef, onLayout, onContentSizeChange }`     |
| `KeyboardAwareContext`, `IKeyboardAwareFieldRegistry`                                                  | реестр полей ближайшего скролла (тег TextInput → animated ref контейнера)     |
| `computeKeyboardAwareOffset`, `computeMaxScrollOffset`, `keyboardOverlap`, `predictShiftedViewport`, … | чистая геометрия (`keyboard-aware-offset.ts`)                                 |
| `shouldRestoreOnHide`, `computeRestoreOffset`, `restoreFrameOffset`                                    | возврат скролла при закрытии                                                  |

Опции ядра: `bottomOffset` (16), `enabled`, `topInset` (`TAnimatedNumber`, навбар),
`spacer` (true), `restoreOnHide` (true), `containerShift` (скролл в двигающемся контейнере
— шторка), `scrollLocked` (скролл заблокирован снаружи).

## Устройство

- Подключение, от простого к ручному: контейнеры кита уже подключены (`ScreenScroll`,
  `BottomSheet.Content` → `ModalSheet`); свой скролл — `KeyboardAwareScrollView` из
  `shared/ui`; AnchorList — `wrap(<AnchorList {...listProps} />)`; вручную —
  `useKeyboardAwareScroll` + `KeyboardAwareContent` (ref обязан быть animated ref).
- Поле берётся из реестра (поля кита регистрируются через `useKeyboardAwareField`);
  иначе — layout сфокусированного ввода, только если он лежит в этом скролле.
- Поле меряется от нулевого якоря в координатах контента — один снимок раскладки, не
  зависящий от того, дошло ли смещение до shadow tree. Смещение и drag/momentum хук
  слушает сам, onScroll подключать не нужно.
- Во время анимации клавиатуры смещение = lerp(старт, цель) по её прогрессу; вне неё —
  одна своя докрутка 250 мс, новая цель перенаправляет её с текущего места
  (`planScrollAnimation`). Рост поля во время анимации учитывается в `onEnd`.
- Пока палец на скролле, хук не вмешивается. `restoreOnHide` возвращает скролл к
  положению на момент открытия, если пользователь не скроллил и не закрывал клавиатуру
  жестом.
- Чистые части (геометрия, возврат, захват поля, план докрутки) покрыты тестами; сам хук
  и замеры `measure` — нет.

## Зависимости

- `shared/lib/animation`, `react-native-keyboard-controller`, `react-native-reanimated`,
  type-import `@epifanovmd/anchor-list`.
- Потребители: `shared/ui` (`TextField`, `KeyboardAwareScrollView`, `ScreenScroll`,
  `BottomSheetScrollContent`, `useSheetKeyboardLayout`), демо плейграунда.

## Gotcha

- После распорки отступов быть не должно (нижний отступ — внутри детей): по верху
  распорки считается конец контента, иначе максимальное смещение занижено.
- Контейнер поля — `Animated.View collapsable={false}`, иначе Fabric может его схлопнуть
  и `measure` вернёт `null`.
- `insetEnd` AnchorList с хуком не использовать — он сам двигает смещение и спорит с
  докруткой.
- Шторка блокирует скролл на время своей анимации (`scrollLocked`): докрутка стоит и
  повторяется после снятия блокировки.
