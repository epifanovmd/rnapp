---
name: AnchorList — журнал проблем
description: Проблемы и доработки @epifanovmd/anchor-list (../anchor-list), найденные на экранах приложения
type: project
---

Все списки приложения — на `AnchorList`; найденные на экранах проблемы фиксируются
здесь, правки базовой логики — в rnapp или в репозитории `../anchor-list`
(`link:`-зависимость; после правок — сборка `lib/`).

## Открытые

1. **`contentContainerStyle.paddingTop` не входит в начало координат** (2026-10-01):
   `ListRuntime.getContentOrigin()` = только `headerSize`, паддинг контейнера контента
   не учитывается → диапазон отрисовки, кромки, прилипание и `scrollToIndex` смещены
   на величину паддинга. Обход: верхний отступ (навбар, ImageBar) — через
   `ListHeaderComponent` (так сделано в Main и ListsDemo). `paddingBottom` безопасен
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
   `contentContainerStyle` (так в постраничных списках). На устройстве не проверено.
6. **`onEndReached` — один раз на жест** (2026-10-01): если в момент срабатывания идёт
   refresh (`loadMore` → no-op), повтора до следующего жеста нет; короткая первая
   страница, не заполняющая вьюпорт, может не догрузиться без жеста. Проверить на
   устройстве (постраничный список, маленькая страница / высокий экран).
7. **Заметки по использованию**: `contentContainerStyle` действует на всех детей контента
   (шапка, пустое, подвал) — межстрочный зазор только пропом `gap`; у `style` нет
   `flex: 1` по умолчанию; ячейки с локальным `useState` корректны лишь при
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

## Догнать LegendList на быстром скролле (2026-10-04) — закоммичено в anchor-list

Коммиты в `../anchor-list` (main): 85656e8 fix(layout) замеры по живому смещению;
2bba0b9 fix(scroll) граница кадра вместо 16 мс; 9dd670a feat(layout) visible-first на скачке
дальше запаса вперёд. Release: 40k наравне с LegendList; 100k+ — визуально проверено
пользователем перед коммитом. Изменения rnapp (экраны лент, бенчмарк) — отдельно.

На стенде ленты (playground → Lists) при 40k px/s у AnchorList пурпурных пустот больше,
чем у LegendList. Разбор LegendList 3.6.0 (`react-native.js`): синхронный JS `onScroll`
(`scrollEventThrottle: 0`) → `calculateItemsInView` в том же тике, без rAF; замер в
layout effect и поправка позиций синхронно до paint (Fabric); при скачке > вьюпорта
`drawDistance` урезается до 50 и полный буфер — следующим кадром; буфер вперёд
`drawDistance*1.5` + проекция по скорости (насыщение 4 px/мс). У AnchorList: UI-onScroll →
`scheduleOnRN`; проход откладывается в rAF, если прошлый был < 16 мс назад
(`shouldDeferScrollPass`); замер → `scheduler.schedule()` → rAF → `flushLayout` (кадр
задержки); запас вперёд до 1,5 экрана + drawDistance.
Лог Debug 100k (2026-10-04): JS 20 fps, событие = ~5000 px (10 экранов), пустоты 476/517 px;
«не привязано 67» ≈ 73 flush с задержкой 49 мс — `flushLayout` считал по смещению последнего
события, а не живому → перепривязка туда, где пользователя нет. Исправлено в anchor-list:
`ListRuntime.catchUpLiveScroll()` (общий с `deferPass`, только вперёд по `scrollDirection`)
вызывается в `flushLayout` в ветке без компенсации; тесты «применяет замеры по живому
смещению…», «не откатывает замером…»; docs architecture/mechanics; lib пересобран, не закоммичено.
Лог Debug 40k после catch-up: «не привязано» 5 (было массово), но пустоты до прохода 93/273
по 512 px: JS 24 fps → скачок ~1660 px/событие > запаса ~1000; ядро дешёвое (проход 0.22 мс),
кадр 29 мс = рендер ~6.7 карточек/событие при 4 видимых. Сделано visible-first:
`isVisibleFirstJump(travelled > scrollLength)` в `visible-range.ts`, `computeVisibleRange({visibleFirst})`
→ запас min(drawDistance, 50), без lookahead; в рантайме флаг `visibleFirst` ставится в
`setScroll` (не для ownMove), проход не откладывается; снимается первым событием короче экрана и
idle-таймером (не rAF-префетчем: на загруженном JS кадр приходит между скачками). Счётчик
`passVisibleFirst` → «скачков N» в строке «диапазон». Тест «расширяет диапазон буфером» теперь
ждёт idle. docs/performance.md. lib пересобран, не закоммичено.
Лог visible-first (40k Debug): fps 24→40, перепривязок/событие 6.7→4.4, но пустота на КАЖДОМ
проходе (513/517): скачок ~1000 px (2 экрана) на 317/321 событиях, а рисовался только текущий
экран — к коммиту вьюпорт уже уехал. На глаз 40k стало хуже. Заменено на окно скачка:
`computeVisibleRange({ jumpAhead })` — видимое + впереди на длину скачка (потолок 2.5 экрана,
`JUMP_AHEAD_SCREENS`), полоса 50 px, без запаса позади и по скорости; `isJump`, поле рантайма
`jumpAhead = scrollDirection * travelled`; счётчик `passJump` («скачков»). Вывод: цена кадра ≈
число новых строк за событие; запас позади бесплатен по перепривязкам, но позади на скачке не
нужен. Нужны числа LegendList (`[feed-bench]` его JS FPS) для сравнения цены кадра.
Окно скачка (видимое + впереди на длину скачка, ≤2.5 экрана): спираль — 11 перепривязок/событие,
кадр 60 мс, 18 fps, пустота на каждом проходе. ОТКАЧЕНО целиком (и visible-first): в anchor-list
остался только catch-up. Итог 40k Debug: catch-up 24 fps/6.7 перепривязок/93 из 273 с пустотой;
visible-only 40/4.4/319 из 637; окно скачка 18/11/140 из 280. Урок: окно не подбирать наугад —
в Debug цена кадра ≈ 5 мс на перепривязку карточки, она и решает. Следующее — сравнить цену
кадра с LegendList (его `[feed-bench]` JS FPS), затем удешевлять кадр: 2 коммита на событие
(проход + flush замеров ≈ 1 на событие) → поправка замеров в том же коммите (как LegendList).
Сравнение Debug (после отката): 40k — AnchorList 24.7 fps, LegendList 24.3 (кадр одинаковый!);
100k — 19.2 против 25.2. Значит на 40k разница в том, что на экране: поправка замеров у нас
следующим кадром (flush 97, задержка 27.5 мс, правка 33 px) → кадр карточек по оценке 182 →
пурпурные полосы. Сделано (итерация 2): `LayoutScheduler.flushNow()` (generation вместо
cancelAnimationFrame), сигнал `measureEpoch` (поднимает `setItemSize`), `runtime.flushMeasurements()`
(+ в `IAnchorListRuntimeHandle`), компонент `ListMeasureFlush` после `ListContainers` —
layout effect на `measureEpoch` → проход в том же коммите. Тесты планировщика/рантайма;
сам компонент юнит-тестом не берётся (RN-рантайм). docs: architecture, mechanics, performance,
state. lib пересобран, не закоммичено.
Итерация 2 (поправка замеров в том же коммите через `ListMeasureFlush`/`measureEpoch`/`flushNow`)
ОТКАЧЕНА: каскад внутри коммита (поправка → новые строки в диапазоне → замеры → поправка) —
155 flush на 94 события, fps 24.7→19.4, на глаз хуже. В anchor-list снова только catch-up.
Решение пользователя (2026-10-04): дальше мерить в Release (Debug: ~5 мс на карточку, решает
число перерисовок, а не латентность). `console.log` в Release не вырезается (нет remove-console).
Release (2026-10-04): оба 60 fps. 40k у нас чисто (пустоты 6 проходов); 100k — пусто почти
всегда (473/476, «не привязано 303»), у LegendList почти без пурпура. Причина — «слито 462+284»:
`flushLayout` ставил `lastPassAt`, событие скролла после него откладывалось (<16 мс) на rAF, где
сливалось со следующим flush → раскладка отставала на кадр (1667 px > запаса ~1025). LegendList
(`updateScroll`, react-native.js:1847) считает синхронно на каждом событии >2 px. Исправлено:
поле `lastFlushAt` — flush не влияет на откладывание события, но учитывается при слиянии
отложенного прохода; тесты «не откладывает событие скролла из-за применения замеров»,
«сливает в один проход события одного кадра» (диапазон, не getScroll: смещение пишется сразу).
Release после lastFlushAt: 40k наравне с LegendList на глаз; 100k всё ещё пусто — «слито 335+75»:
отложенный проход (rAF, начало кадра) ставил lastPassAt, событие того же кадра снова
откладывалось — цепочка, отставание на кадр навсегда. Исправлено: правило «16 мс» заменено
флагом кадра `passedInFrame` (ставит только немедленный проход по событию, `markPassInFrame`,
сброс rAF `frameReset`); `lastPassAt` удалён; `shouldDeferScrollPass` теперь только для слияния
отложенного прохода с flush (`lastFlushAt`). Тест «не откладывает событие из-за отложенного
прохода начала кадра».
Release после флага кадра: «слито 2+0», «не привязано 1»; 40k наравне с LegendList; 100k —
карточки моргают (видны через кадр, «полупрозрачно»): ~8.6 перепривязок/событие не успевают к
кадру. LegendList на скачке > экрана рисует только видимое (50 px) и успевает. Visible-first
возвращён (в Debug вредил — там ничто не успевало к кадру): `isVisibleFirstJump`,
`computeVisibleRange({visibleFirst})` → запас min(dd,50), без lookahead; флаг рантайма ставится
в `setScroll` (не ownMove), снимается первым событием короче экрана и idle; счётчик
`passVisibleFirst` («скачков»); docs/performance.md. Ждём Release-лог.
Release с visible-first (порог = экран): 100k заметно лучше, но 40k испортился — скачок 667 > 517
включал режим на всех событиях, хотя запас вперёд (250 + 1.5 экрана ≈ 1025) его покрывал.
Порог изменён: `isVisibleFirstJump(travelled, scrollLength, drawDistance)` → travelled >
drawDistance + 1.5·scrollLength (у LegendList порог — экран, но и запас у него меньше). Тест
«держит полный запас на скачке, который запас вперёд покрывает». Ждём Release-лог.
План: 1) стенд честный (`recycleItems`) + отчёт `anchorListPerf` — сделано; 2) применять замеры в layout effect `ListContainers` того же коммита; 3) не откладывать
проход на быстром скролле; 4) visible-first на больших скачках; 5) подбор запаса вперёд.

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
   playground → Components → Lists (`pages/stack/components/demos/lists/SimpleListDemo.tsx`).

2. **Индикатор прокрутки** (2026-10-01): `showsScrollIndicator?: boolean` (default
   `true`) → `shows{Vertical|Horizontal}ScrollIndicator` по `horizontal`;
   `src/types.ts`, `src/components/AnchorList.tsx`, docs/props.md; Main — `false`.

3. **`keyboardShouldPersistTaps`** (2026-10-01): проп пробрасывается во внутренний
   ScrollView (`src/types.ts`, `src/components/AnchorList.tsx`, docs/props.md). Был
   симптом: при открытой клавиатуре (поиск в шапке списка) первое
   касание только закрывало клавиатуру. В rnapp все списки — `"handled"`.
