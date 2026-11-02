---
module: shared/lib/validation
summary: Хелперы схем Zod для форм — discriminated union по boolean-полю, проверка с путём ошибки поля, необязательное число, русская локаль сообщений.
---

# validation

Общие строительные блоки Zod-схем форм, не привязанные к домену. Доменные правила
(логин, пароль) живут в слайсах, а не здесь.

## Public API

| Экспорт                                                                 | Что                                                                           |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `createBooleanDiscriminatedUnion({ discriminator, enabled, disabled })` | union двух объектных схем по литералу `true`/`false` поля                     |
| `refineFormField(schema, { field, message, check })`                    | sync/async-проверка всей формы с ошибкой на поле `field` (типизирован ключом) |
| `optionalNumber(schema)`                                                | `schema.nullable().optional()` — пустое числовое поле хранится как `null`     |
| `applyZodLocale()`                                                      | русские стандартные сообщения Zod (`z.config(z.locales.ru())`)                |
| `BooleanDiscriminatedUnionOptions`, `RefineFormFieldOptions`            | типы опций                                                                    |

## Устройство

Один хелпер — один файл. Хелперы возвращают обычные схемы Zod: их можно дальше
`extend`/`refine` и отдавать в `zodResolver`.

## Зависимости

- Только `zod` (v4 API: `z.config`, `z.locales`).
- Потребителей через `@shared/lib/validation` пока нет.

## Gotcha

- `z.number().optional()` не принимает `null`, поэтому форма с очищенным числовым полем
  не отправится — для таких полей нужен `optionalNumber`.
- `applyZodLocale()` нигде не вызывается: без вызова при старте приложения и в настройке
  тестов стандартные сообщения Zod остаются английскими.
