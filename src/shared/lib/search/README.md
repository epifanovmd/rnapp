---
module: shared/lib/search
summary: Контроллер поиска экрана, синхронизация со скрываемой шапкой и чистые функции сопоставления текста, подсветки и истории.
---

# search

Логика поиска без UI: состояние запроса и режима поиска, прогресс раскрытия поля на
UI-потоке, поведение скрываемой шапки при поиске, нормализация и фильтрация текста.
Поле, кнопку и оверлей рисует `shared/ui/search`.

## Public API

| Экспорт                                                                                      | Что                                                                                                                               |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `useSearch(options?)`                                                                        | `ISearchController`: `query`, `debouncedQuery`, `active`, `activeValue`, `progress`, `inputRef`, `setQuery/open/close/clear/blur` |
| `useSearchBarSync(search, bar, scroll, options?)`                                            | поиск в закреплённой части `HiddenBar` → `{ contentShift, shiftRange }`                                                           |
| `normalizeSearchText`, `searchTokens`, `matchesQuery`                                        | нормализация (регистр, ё→е, длина сохраняется) и совпадение всех слов в любом порядке                                             |
| `findMatchRanges`, `splitByMatches`, `TMatchRange`                                           | диапазоны совпадений для подсветки                                                                                                |
| `filterByQuery(items, query, fields)`                                                        | фильтр по совокупности полей; пустой запрос — все элементы                                                                        |
| `pushSearchHistory(history, query, max)`                                                     | история: новый первым, повтор поднимается, пустые не сохраняются                                                                  |
| `shouldCloseOnBlur`                                                                          | закрывать ли поиск при потере фокуса                                                                                              |
| `planSearchBarOpen`, `shouldShowBarOnClose`, `resolveSearchGapShift`, `resolveReleasedShift` | планы шапки (worklet)                                                                                                             |

Опции `useSearch`: `debounceMs` (250), `duration` (280), `closeOnBack` (true),
`closeOnEmptyBlur` (true), `onActiveChange`.

## Устройство

- `debouncedQuery` — для фильтрации и сети; при очистке запроса сразу `""`.
- `open` идемпотентен и фокус не ставит (его ставит поле, когда раскрытие уже идёт);
  `close` сворачивает, очищает запрос и убирает клавиатуру; Android «назад» закрывает.
- `closeOnEmptyBlur`: потеря фокуса без запроса закрывает поиск; на Android то же по
  `keyboardDidHide` — скрытие клавиатуры не снимает фокус с поля.
- `useSearchBarSync`: открытие прячет видимую шапку и поднимает контент той же
  анимацией (длительность панели), уже скрытую не трогает; закрытие возвращает шапку по
  `restore` (`"previous"` | `"show"`). Закрытие во время скролла шапку не трогает.
- Чистые функции покрыты тестами (`search-text`, `search-blur`, `search-bar-plan`).

## Зависимости

- `shared/lib/bars` (`IBar`), `shared/lib/scroll` (`IScrollValues`),
  `shared/lib/hooks` (`useDebouncedValue`), `react-native-reanimated`.
- Потребители: `shared/ui/search` (`SearchBar`, `NavbarSearchField`,
  `NavbarSearchButton`, `SearchShiftView`, `HighlightText`), демо плейграунда.

## Gotcha

- Пока идёт поиск, скролл не должен двигать шапку: потребитель ставит
  `useNavbarScrollSync(telemetry, { paused: search.activeValue })`.
- Контент двигается transform'ом (`SearchShiftView`) — в одном кадре с шапкой, без
  перераскладки списка; в конец прокручиваемого содержимого нужен `SearchShiftSpacer`.
