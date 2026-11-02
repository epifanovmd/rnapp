---
module: shared/lib/theme
summary: Светлая и тёмная темы — ThemeStore с предпочтением Light/Dark/System, ThemeProvider, useTheme и кэширующая фабрика стилей makeThemeStyles.
---

# theme

Цвета приложения и выбор темы. Предпочтение пользователя — `Light | Dark | System`
(по умолчанию `System`: тема следует схеме ОС).

## Public API

| Экспорт                                                                      | Что                                                                                             |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `ThemeProvider`                                                              | observer-провайдер контекста поверх `IThemeStore`                                               |
| `useTheme()`                                                                 | `IThemeContext`: `name`, `colors`, `preference`, `isLight`, `isDark`, `setTheme`, `toggleTheme` |
| `makeThemeStyles(fn)`                                                        | фабрика хука тем-зависимых стилей, вызывается на уровне модуля                                  |
| `IThemeStore`                                                                | токен стора темы (тот же контракт, что контекст)                                                |
| `IColorSchemeProvider`                                                       | токен + контракт схемы ОС: `getPreferredScheme`, `onSchemeChange`                               |
| `ThemeContext`, `themeModule`                                                | контекст и DI-модуль                                                                            |
| типы                                                                         | `ITheme`, `TColorTheme`, `TThemeName`, `TThemePreference`, `IThemeContext`                      |
| `DEFAULT_LIGHT_THEME`, `DARK_THEME`, `LIGHT_COLOR_THEME`, `DARK_COLOR_THEME` | палитры из `variants/`                                                                          |

## Устройство

- `theme.store.ts` — MobX-стор: `name` = предпочтение или, при `System`, текущая схема
  ОС. `setTheme` сохраняет предпочтение в `IStorageService` по ключу `themeName`.
- `color-scheme.service.ts` — схема ОС через `Appearance` (не хук `useColorScheme`:
  сервис работает вне React); `null` трактуется как `Light`.
- `ThemeProvider` прокидывает значения стора в `ThemeContext`; `useTheme` — чтение
  контекста.
- `makeThemeStyles(t => ({ … }))` кэширует результат по имени темы: ссылки на стили
  стабильны между рендерами и экземплярами компонентов.

## Зависимости

- `mobx`, `mobx-react-lite`, `react-native`; `@shared/lib/di`, `@shared/lib/storage`.
- Потребители: почти весь `shared/ui`, `pages/stack`, `pages/tabs`, `widgets/app-menu`,
  `widgets/auth-layout`, `entities/message`, `features/*`,
  `shared/lib/notifications`, `app` (провайдер, модуль).

## Gotcha

- iOS шлёт ложные смены схемы при уходе в фон: события `Appearance` вне `active`
  игнорируются, схема перечитывается при возврате приложения.
- Без `ThemeProvider` `useTheme` отдаёт светлую тему по умолчанию, а `setTheme`/
  `toggleTheme` только пишут ошибку в консоль.
- Генератор `makeThemeStyles` видит только `{ name, colors }` и вызывается один раз на
  тему — пропсы компонента в нём недоступны.
