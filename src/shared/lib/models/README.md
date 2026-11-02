---
module: shared/lib/models
summary: Базовые MobX-модели поверх DTO — DataModelBase, мемоизированный маппер DTO → модель, модель enum с isX-геттерами, DateModel.
---

# models

Основа доменных моделей `entities/*`: модель оборачивает DTO и добавляет вычисляемые
поля, не копируя сам DTO.

## Public API

| Экспорт                                    | Что                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `DataModelBase<TData>`, `IDataModel`       | база: `data` (DTO), `hasLambda`                                                                                    |
| `createModelMapper(keyExtractor, factory)` | `items → models`, переиспользует модель, пока DTO тот же по ссылке                                                 |
| `createEnumModelBase<TEnum>(enum)`         | класс-база с геттерами `isX` для каждого значения enum                                                             |
| `DateModel`                                | дата-строка ISO: `formatted`, `formattedDate`, `formattedTime`, `formattedInputDate`, `formattedDiff`, `isExpired` |

## Устройство

- Конструктор принимает DTO или функцию (`LambdaValue`):
  `new DateModel(() => this.data.lastOnline)`. `data` — `computed`, поэтому функция,
  читающая observable, делает модель реактивной; модель от значения — снимок.
- `_data` — `observable.ref`: DTO не превращается в observable и не копируется.
- `createModelMapper` держит кэш по ключу: при обновлении одного элемента списка
  пересоздаётся только его модель — computed-геттеры стора не плодят новые экземпляры.
- `DateModel` форматирует через `formatter.date` из `@shared/lib/utils` (`date-fns`).

## Зависимости

- `mobx`, `@shared/lib/utils` (`LambdaValue`, `formatter`, `getEnumNamesAndValues`).
- Потребители: `entities/user` (модели пользователя, профиля, роли, сессии),
  `entities/auth` (`createEnumModelBase`).

## Gotcha

- Поля DTO читаются только как `model.data.x`; мутировать DTO по полям нельзя — реакция
  идёт лишь на замену объекта целиком.
- Геттеры наследника помечаются `computed` явно в `makeObservable` его конструктора —
  база их не видит.
- `isX`-геттеры `createEnumModelBase` объявлены через `defineProperty` без `computed`:
  это дешёвое сравнение с `data`.
