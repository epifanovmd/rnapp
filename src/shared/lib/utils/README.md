---
module: shared/lib/utils
summary: Общие чистые утилиты без домена — форматирование дат и размеров, склонение, строки, type guards, LambdaValue, освобождение ресурсов.
---

# utils

Набор маленьких функций и типов, нужных многим модулям. Состояния и DI нет; одна
утилита — один файл, `index.ts` реэкспортирует всё.

## Public API

| Группа           | Экспорт                                                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| форматирование   | `formatter` (`date.*`, `bytes`, `speed`), `DateFormatter`, `formatBytes`, `formatDuration`, `formatAppVersion`, `formatFullName`, `formatInitials`, `describeUserAgent` |
| склонение        | `pluralize(count, params)`, `pluralizeDay`/`Hour`/`Minute`, `PluralParams`                                                                                              |
| строки, проверки | `stringCapitalize`, `stringUnCapitalize`, `EMAIL_REGEX`, `PHONE_REGEX`, `isEmail`, `isPhone`                                                                            |
| type guards      | `isString`, `isFunction`, `isArray`, `isPromise`                                                                                                                        |
| значения         | `LambdaValue`, `resolveLambdaValue`, `Maybe`, `noop`, `createRandomId`, `joinIds`                                                                                       |
| enum и объекты   | `getEnumNames`, `getEnumNamesAndValues`, `flattenObject`, `FlattenObject`, `DeepKeys`                                                                                   |
| освобождение     | `disposer`, `InitializeDispose`, `SupportInitialize` (`initialize/`)                                                                                                    |
| прочее           | `TimeoutManager`, `toAbsoluteUrl`, `downloadBlob`                                                                                                                       |

## Устройство

- `formatter/date-formatter.ts` — даты из ISO-строк на `date-fns`; пустая или невалидная
  строка → `""` (у `isExpired` — `false`), а не исключение. Локаль — дефолтная
  `date-fns` (`setDefaultOptions({ locale: ru })` в `app/App.tsx`).
- `formatter.bytes` — по умолчанию десятичные единицы (KB = 1000); `bits` — двоичные (KiB).
- `toAbsoluteUrl` достраивает относительный путь от `BASE_URL` из `@shared/config/env`.
- `LambdaValue<T>` — значение или функция, его возвращающая; на нём построены
  `DataModelBase` (`shared/lib/models`) и фильтры холдеров.

## Зависимости

- `date-fns`; `@shared/config/env` (только `toAbsoluteUrl`).
- Потребители: `shared/lib/models`, `holders`, `socket`, `notifications`, `hooks`,
  `shared/config`, `shared/ui`, `entities/user`, `entities/auth`, `features/*`, `pages/stack`, `app`.

## Gotcha

- `downloadBlob` использует DOM (`document`, `URL.createObjectURL`) — в React Native не
  работает.
- `platform.ts` (`isIos`, `getStatusBarHeight`, `useIsLandscape`…) лежит в папке, но не
  экспортируется из `index.ts`.
- `disposer`, `InitializeDispose`, `SupportInitialize` продублированы в `@shared/lib/di`;
  отличие только в отсутствии `Maybe` в `initialize/types.ts`.
