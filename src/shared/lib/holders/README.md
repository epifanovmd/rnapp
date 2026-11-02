---
module: shared/lib/holders
summary: MobX-холдеры асинхронного состояния (сущность, коллекция, страницы, бесконечный список, курсор, мутация, поллинг, фильтры) и React-хуки над ними.
---

# holders

Единый способ держать результат запроса: статус, ошибка, данные, отмена устаревших
ответов. Холдер — класс MobX (живёт в сторе); хук `useX` создаёт холдер на жизнь
компонента и грузит по `watch`/`autoLoad`.

## Public API

| Группа      | Экспорт                                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| сущность    | `EntityHolder`, `useEntity` (= `useEntityHolder`), `EntityProvider`, `useEntityContext`                                            |
| коллекция   | `CollectionHolder`, `useCollection`, `CollectionProvider`, `useCollectionContext`                                                  |
| страницы    | `PagedHolder`, `usePaged`, `PagedProvider`, `usePagedContext`                                                                      |
| бесконечный | `InfiniteHolder`, `useInfinite`, `InfiniteProvider`, `useInfiniteContext`                                                          |
| курсор      | `CursorHolder`, `CachedCursorHolder`, `SyncCursorHolder` + типы кэша/фетча                                                         |
| мутация     | `MutationHolder`, `useMutation`, `MutationProvider`, `useMutationContext`, `runMutation`                                           |
| поллинг     | `PollingHolder`, `usePolling`, `PollingProvider`, `usePollingContext`                                                              |
| фильтры     | `FilterHolder`, `FiltersHolder`, типы `filter.types.ts`                                                                            |
| база        | `BaseHolder`, `BaseListHolder`, `CombinedHolder` (сводный статус нескольких)                                                       |
| типы        | `HolderStatus`, `MutationStatus`, `IHolderError`, `IApiResponse`, `*FetchFn`, `isCancelError`, `isCancelResponse`, `toHolderError` |
| хуки        | `useWatchEffect`, `useHolderRef`, `useLatestFn`, `useCtx`                                                                          |

`useXHolder` — алиас `useX`.

## Устройство

- `base/base-holder.ts` — общий конвейер `_request`: отменяет предыдущий запрос
  (`cancel()` у промиса), нумерует запросы и применяет только ответ последнего.
  Отмена (`error.isCanceled`, контракт `ApiError`) — не ошибка: статус
  восстанавливается в `Success` при наличии данных, иначе `Idle`.
- `fetchFn` хуков оборачивается `useLatestFn` — замыкание всегда свежее, холдер
  создаётся один раз (`useHolderRef`).
- `useWatchEffect`: `watch: [args]` — загрузка при монтировании и смене аргумента;
  `autoLoad` — однократно без аргументов; без обоих холдер сам не грузит.
- `CollectionHolder.fromApi(fn, extractor?)` — загрузка произвольным запросом.
- `CursorHolder` — пассивный контейнер ленты (`setItems`/`appendItems`/`prependItems`,
  статусы подгрузки старых и новых); запросы и защиту от устаревших ответов ведёт стор.
  `CachedCursorHolder`/`SyncCursorHolder` добавляют кэш по ключу и окно вокруг якоря.
- `MutationHolder`: `execute(args)` — функция из опций, `run(fn)` — произвольная;
  применяется результат последнего вызова, прежний не отменяется.

## Зависимости

- `mobx`, `react`; `@shared/lib/utils`.
- Потребители: `entities/user` (сущность, коллекция сессий, мутации), `entities/file`
  (бесконечный список), `entities/audit` (курсор), демо фильтров в `pages/stack`.

## Gotcha

- Списки (`items`, `pendingItems`) — `observable.ref`: массив только заменять,
  `push`/`splice` на месте не уведомят наблюдателей; DTO внутри не становятся observable.
- `fromApi` без `extractor` кладёт ответ в `items` как есть — для страницы
  `{ items, total }` нужен `page => page.items`.
- `watch` сравнивает аргумент по ссылке: объект, создаваемый на каждый рендер,
  перезапускает загрузку каждый рендер.
- После ошибки подгрузки (`isLoadMoreError`) `onEndReached` списка сам не повторит —
  нужна явная кнопка «повторить».
