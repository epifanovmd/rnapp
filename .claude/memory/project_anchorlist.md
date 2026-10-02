---
name: AnchorList — журнал проблем
description: Проблемы и доработки @epifanovmd/anchor-list (../anchor-list), найденные на экранах WG Admin
type: project
---

Ветка `feat/wg-admin-mobile` — стенд для `AnchorList`: все списки на нём, найденные
проблемы фиксируются здесь, правки базовой логики — в `master` rnapp или в репозитории
`../anchor-list` (`link:`-зависимость; после правок — сборка `lib/`).

## Открытые

1. **`contentContainerStyle.paddingTop` не входит в начало координат** (2026-10-01):
   `ListRuntime.getContentOrigin()` = только `headerSize`, паддинг контейнера контента
   не учитывается → диапазон отрисовки, кромки, прилипание и `scrollToIndex` смещены
   на величину паддинга. Обход: верхний отступ (навбар, ImageBar) — через
   `ListHeaderComponent` (так сделано в Main и ListsTab). `paddingBottom` безопасен
   (входит в нативный contentSize). Выведено из кода, на устройстве не проверялось.
2. **Сдвиг контента при протяжке на Android не двигает слой прилипших копий**
   (2026-10-01): `useAnchorListPullToRefresh` транслирует обёртку ScrollView внутри
   `renderScrollView`, а `ListStickyOverlay` живёт снаружи. У верхней кромки копий
   обычно нет (offset 0), но при `sticky` с `edgeOffset` > 0 копия останется на месте.
3. **Прочие пропы ScrollView не пробрасываются** — список прокидывает только свой
   набор (индикатор прокрутки — исправлено, см. ниже).

4. **`gap` не действует вокруг шапки и подвала** (2026-10-01): зазор только между
   строками данных; между `ListHeaderComponent`/`ListFooterComponent` и строками —
   отступом внутри шапки/подвала, который остаётся и при пустом списке.
5. **`ListEmptyComponent` не растягивается на свободную высоту** (2026-10-01): рендерится
   прямо в контенте без обёртки; центрирование пустого/загрузки — `flexGrow: 1` в
   `contentContainerStyle` (так в ленте пиров). На устройстве не проверено.
6. **`onEndReached` — один раз на жест** (2026-10-01): если в момент срабатывания идёт
   refresh (`loadMore` → no-op), повтора до следующего жеста нет; короткая первая
   страница, не заполняющая вьюпорт, может не догрузиться без жеста. Проверить на
   устройстве (лента пиров, маленькая страница / высокий экран).
7. **Заметки по использованию**: `contentContainerStyle` действует на всех детей контента
   (шапка, пустое, подвал) — межстрочный зазор только пропом `gap`; у `style` нет
   `flex: 1` по умолчанию; ячейки с `useState` (RolePermissionsCard) корректны лишь при
   выключенном `recycleItems`.

8. **AnchorList внутри gorhom-шторки** (2026-10-02, Select кита): совмещено без правок
   библиотек — `shared/ui/bottom-sheet/hooks/useBottomSheetScrollableBridge` (свой
   `useAnimatedRef` → `refScrollView` + `useScrollableSetter`, обработчики
   `useScrollEventsHandlersDefault` → `scrollHandlers`, `Gesture.Native` вокруг ScrollView
   через `renderScrollView` и в `simultaneousHandlers` шторки). Ограничения:
   `BottomSheetScrollView` через `renderScrollView` нельзя (AnchorList создаёт свой
   `Animated.ScrollView` с UI-обработчиком `onScroll`, gorhom вызывает onScroll через
   runOnJS); нет высоты по контенту (ScrollView `flex: 1` — высоту списка задаёт Select:
   контент/оценка ≤ maxHeight); не повторено снятие инерции gorhom (`decelerationRate`
   до раскрытия шторки); тип `refScrollView` приводится (своя копия reanimated у
   link-пакета). Жест «тянуть шторку вниз из верха списка» — проверить на устройстве.

- **Кандидат: среднее замеренных для незамеренных строк.** Незамеренные строки
  считаются по `estimatedItemSize`; при заметной ошибке оценки высота контента
  меняется по ходу прокрутки. Можно брать среднее замеренных того же типа (как
  FlashList). Заминка в конце инерции на playground Lists (2026-10-02) была не
  отсюда, а от доводки шапки после инерции — исправлено в `use-navbar-scroll-sync`.

## Исправлено

1. **Pull-to-refresh** (2026-10-01; был: `bounces={false}` жёстко, нет onScroll,
   нет точки для жеста). В `../anchor-list`:
   - `bounces?: boolean` (default `false`) — `src/types.ts`, `src/components/AnchorList.tsx`;
   - `scrollHandlers?: IAnchorListScrollHandlers` — worklet-обработчики фаз
     (`onScroll/onBeginDrag/onEndDrag/onMomentumBegin/onMomentumEnd`), получают сырое
     событие после списка; чейнятся в `src/hooks/useListScrollHandler.ts`
     (`externalHandlers`). Совместим с `IScrollTelemetry.handlers` rnapp;
   - `renderScrollView?: (scrollView) => ReactElement` — обёртка вокруг внутреннего
     ScrollView (для `GestureDetector`: детектор цепляется к прямому ребёнку);
   - резинка не ломает механику: в JS (`runtime.setScroll`) смещение уходит зажатым в
     `[0, maxScroll]` (`getReportedOffset` в `useListScrollHandler.ts`, во всех фазах),
     `adapter.getOffset` — `Math.max(0, …)`. Прилипание (`scrollOffset` UI),
     `sharedValues.scrollOffset` и `scrollHandlers` получают сырое значение — sticky
     едет с контентом (getStickyOffset при отрицательном scroll даёт 0),
     `distanceFromStart` на время оттяжки отрицательный, `isAtStart` = true;
   - тесты: `src/hooks/__tests__/useListScrollHandler.test.ts` («оттяжка за кромку»,
     «внешние обработчики»); docs: props.md, limitations.md, migration.md; `lib/` пересобран.

   В rnapp: `shared/lib/pull-to-refresh/use-anchor-list-pull-to-refresh.ts`
   (`useAnchorListPullToRefresh({ onRefresh, telemetry?, haptics? })` →
   `{ ...controller, gesture, contentTranslateY, telemetry, listProps }`), индикатор —
   `shared/ui/refresh-indicator` (`RefreshIndicator`). Протяжку ведёт **своя** телеметрия
   списка, события чейнятся в телеметрию экрана: общая телеметрия табов
   (ComponentsNavigator) несёт скролл соседних вкладок, и bounce в одной вкладке
   запускал бы refresh в другой. Демо: Main (AnchorList вместо FlatList) и
   playground → вкладка `Lists` (`pages/stack/components/tabs/ListsTab.tsx`).

2. **Индикатор прокрутки** (2026-10-01): `showsScrollIndicator?: boolean` (default
   `true`) → `shows{Vertical|Horizontal}ScrollIndicator` по `horizontal`;
   `src/types.ts`, `src/components/AnchorList.tsx`, docs/props.md; Main — `false`.

3. **`keyboardShouldPersistTaps`** (2026-10-01): проп пробрасывается во внутренний
   ScrollView (`src/types.ts`, `src/components/AnchorList.tsx`, docs/props.md). Был
   симптом: при открытой клавиатуре (поиск в шапке ленты пиров, пользователей) первое
   касание только закрывало клавиатуру. В rnapp все списки — `"handled"`.
