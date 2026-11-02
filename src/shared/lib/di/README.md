---
module: shared/lib/di
summary: Inversify-контейнер приложения и фабрика токенов `createInjectDecorator` (инъекция, getInstance, useInstance), утилиты освобождения ресурсов.
---

# di

Единственный IoC-контейнер приложения и способ объявить токен сервиса так, чтобы им
можно было и инжектить в конструктор, и получать экземпляр в React и вне его.

## Public API

| Экспорт                                    | Что                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| `iocContainer`                             | общий `Container` Inversify                                               |
| `createInjectDecorator<T>(name)`           | токен: декоратор параметра/свойства + `Tid`, `getInstance`, `useInstance` |
| `IInjectDecorator`, `IIoCDecoratorOptions` | типы токена и опций (`optional`)                                          |
| `disposer(d)`                              | вызывает освобождение: функция, массив или промис с ними                  |
| `Disposer`, `createDisposer()`             | набор освобождений с `add(...)` / `dispose()`                             |
| `InitializeDispose`, `SupportInitialize`   | контракт `initialize()` → освобождение                                    |
| `Maybe<T>`                                 | `T \| undefined`                                                          |

## Устройство

- `create-inject-decorator.ts` — токен по строковому `name` (обычно имя интерфейса):
  строка стабильна при hot reload, биндинги остаются валидными.
  - параметр конструктора → `inject(name)` (+ `optional()` с `{ optional: true }`);
  - свойство класса → `lazyInject` (резолв при первом чтении), с `optional` —
    обычный `inject`;
  - как декоратор класса — бросает ошибку: класс помечается `@injectable()` и
    биндится явно в `<slice>.module.ts`.
- `getInstance({ optional: true })` вернёт `undefined`, если токен не забинжен; без
  опции — ошибка контейнера.
- `useInstance()` берёт экземпляр один раз за жизнь компонента (ленивый `useRef`).
- Модули собираются в `app/app.module.ts` (`registerContainerModules`: `unbindAll` +
  `load`).

## Зависимости

- `inversify`, `inversify-inject-decorators`, `reflect-metadata`, `react` (`useRef`).
- Используют почти все DI-модули: `shared/api`, сервисы `shared/lib/*`, сторы
  `entities/*`, `features/biometric`, `app`.

## Gotcha

- `disposer` глотает отказ промиса освобождения: ошибка асинхронного `initialize` не
  всплывёт.
- `useInstance` не реагирует на перебиндинг токена во время жизни компонента — берётся
  экземпляр, актуальный на первый рендер.
- В `@shared/lib/utils` есть дубликат `disposer`, `InitializeDispose`,
  `SupportInitialize` (`utils/initialize/`); потребители импортируют из обоих мест.
