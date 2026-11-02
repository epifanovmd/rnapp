---
module: shared/lib/splash
summary: JS-обёртка над нативным splash-экраном — скрыть, когда первый экран готов, и проверить видимость.
---

# splash

Нативный splash держится поверх контента с запуска приложения и убирается вручную из
JS. Нативная часть — модуль `AppSplash` (iOS и Android) в проекте приложения.

## Public API

| Экспорт               | Что                                                                    |
| --------------------- | ---------------------------------------------------------------------- |
| `AppSplash.hide`      | `({ fade = false }?) => Promise<void>` — скрыть, `fade` — растворением |
| `AppSplash.isVisible` | `() => Promise<boolean>`                                               |
| `HideSplashOptions`   | опции `hide`                                                           |

## Устройство

- Нативный модуль берётся из `NativeModules.AppSplash`; без него (тесты, сборка без
  нативной части) `hide` — resolved Promise, `isVisible` — `false`.

## Зависимости

- `react-native` (`NativeModules`).
- Потребитель: `app/hooks/useAppBootstrap.ts` — `AppSplash.hide({ fade: true })`.
