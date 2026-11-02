---
module: shared/lib/hooks
summary: Общие React-хуки без домена — состояние, стабильные ссылки и колбэки, измерение layout, буфер обмена, анимации на Reanimated.
---

# hooks

Набор небольших переиспользуемых хуков, на которых стоят `shared/ui` и экраны. Ни
один не знает о бэкенде, DI или конкретных слайсах.

## Public API

| Группа            | Экспорт                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------- |
| состояние         | `useBoolean`, `useControllableState` (+ `StateUpdater`), `useDebouncedValue`, `useConstant`   |
| стабильные ссылки | `useLatestRef`, `useEvent`, `useMergedCallback`, `useStableValue`, `mergeRefs`                |
| размеры           | `useLayout` (+ `ILayout`), `useSharedLayout` (shared values, без ре-рендера), `useDimensions` |
| анимации          | `useCrossfade`, `useFreezableValue`                                                           |
| прочее            | `useClipboard`, `useCloseWhenForbidden`                                                       |

## Устройство

- Один хук — один файл, `index.ts` реэкспортирует всё (`export *`).
- `useControllableState` — controlled/uncontrolled в одном контракте: сеттер всегда
  зовёт `onChange`, внутреннее состояние меняется только без внешнего значения.
- `useStableValue` — прежняя ссылка, пока значение глубоко равно (функции — по ссылке).
- `useLayout`/`useSharedLayout` обновляются только при реальной смене размера.
- `useCrossfade` — первый рендер без анимации, переход только при смене зависимости.

## Зависимости

- `react`, `react-native`, `react-native-reanimated`, `react-native-worklets`,
  опционально `@react-native-clipboard/clipboard`.
- Основной потребитель — `shared/ui`; также `shared/lib/socket`, `shared/lib/navigation`,
  `shared/lib/live`, `pages/stack`, `widgets/chat`.

## Gotcha

- `useClipboard` грузит нативный модуль лениво и только если он есть в бинарнике
  (`TurboModuleRegistry.get("RNCClipboard")`): без `pod install` `copy()` вернёт `false`
  вместо фатальной ошибки Metro.
- `useFreezableValue.restore()` не снимает заморозку синхронно: подмена уходит, когда
  живое значение догонит замороженное (плюс запасной таймер). Синхронная разморозка
  даёт прыжок — ради этого хук и написан.
- `use-relative-time.ts` лежит в папке, но не экспортируется из `index.ts` и нигде не
  используется.
