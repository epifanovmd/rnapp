import { Container, Navbar } from "@shared/ui";
import type {
  IListRef,
  IListRenderItemProps,
  IListStickyConfig,
} from "@shared/ui/list";
import { List, resetListPerf, setListPerf } from "@shared/ui/list";
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import {
  LabAction,
  LabAvatarPin,
  LabPanel,
  LabPerfHud,
  LabRowView,
  LabStatus,
  LabToggle,
} from "../components";
import type { LabRow } from "../model";
import {
  createMessages,
  labRowHeight,
  labRowKey,
  labRowType,
  MESSAGE_GAP,
  withDateSeparators,
} from "../model";

/** Тысяча сообщений на старте: замер должен идти на настоящем объёме. */
const INITIAL_FROM = 1000;
const INITIAL_TO = 2000;
const PAGE_SIZE = 40;
const LOAD_DELAY_MS = 400;
const ESTIMATED_ITEM_SIZE = 92;
const AVATAR_SIZE = 36;

/**
 * Стенд производительности.
 *
 * Собирает в одном месте всё, что нагружает список одновременно: прилипание на
 * обеих кромках, подгрузка в обе стороны и переработка контейнеров. Счётчики
 * показывают не «тормозит или нет», а что именно стоит дорого — рендеры,
 * пересчёты раскладки, промахи пула или незакрытая часть кадра.
 *
 * Тумблеры выключают источники нагрузки по одному: так видно вклад каждого.
 * Измерение строк — самый дорогой из них, поэтому фиксированные высоты вынесены
 * отдельно.
 */
export const PerfScreen: FC = () => {
  const listRef = useRef<IListRef>(null);

  const [range, setRange] = useState({ from: INITIAL_FROM, to: INITIAL_TO });
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingEnd, setLoadingEnd] = useState(false);

  const [sticky, setSticky] = useState(true);
  const [recycle, setRecycle] = useState(true);
  // По умолчанию высоты меряются: это дороже и ближе к настоящим данным, где
  // высота строки известна только после отрисовки.
  const [fixedSizes, setFixedSizes] = useState(false);
  const [keepPosition, setKeepPosition] = useState(true);
  const [measuring, setMeasuring] = useState(true);

  const topOffset = useSharedValue(0);
  const bottomOffset = useSharedValue(0);

  const listKey = `${recycle}-${fixedSizes}`;

  // Счётчики глобальны для списка: со стендом они и включаются, и выключаются,
  // иначе продолжат стоить работы на других экранах.
  useEffect(() => {
    setListPerf(measuring);

    return () => setListPerf(false);
  }, [measuring]);

  const { rows, dateIndices, avatarIndices, groupStarts } = useMemo(() => {
    const source = withDateSeparators(createMessages(range.from, range.to));
    const data: LabRow[] = [...source.rows];
    const shift = loadingStart ? 1 : 0;

    if (loadingStart) {
      data.unshift({ type: "loader", key: "loader-start", edge: "start" });
    }

    if (loadingEnd) {
      data.push({ type: "loader", key: "loader-end", edge: "end" });
    }

    // Спиннер сверху сдвигает все индексы: наборы прилипания живут в индексах.
    return {
      rows: data,
      dateIndices: source.dateIndices.map(index => index + shift),
      avatarIndices: source.avatarIndices.map(index => index + shift),
      groupStarts: source.groupStarts.map(index => index + shift),
    };
  }, [range, loadingStart, loadingEnd]);

  const stickyConfigs = useMemo<IListStickyConfig<LabRow>[]>(() => {
    if (!sticky) return [];

    return [
      { edge: "start", indices: dateIndices, offset: topOffset },
      {
        edge: "end",
        indices: avatarIndices,
        offset: bottomOffset,
        mode: "offset",
        size: AVATAR_SIZE,
        groupStarts,
        limitInset: MESSAGE_GAP,
        renderOverlay: item => <LabAvatarPin row={item} />,
      },
    ];
  }, [
    sticky,
    dateIndices,
    avatarIndices,
    groupStarts,
    topOffset,
    bottomOffset,
  ]);

  const handleStartReached = useCallback(() => {
    if (loadingStart || range.from <= 0) return;

    setLoadingStart(true);
    setTimeout(() => {
      setRange(current => ({
        ...current,
        from: Math.max(0, current.from - PAGE_SIZE),
      }));
      setLoadingStart(false);
    }, LOAD_DELAY_MS);
  }, [loadingStart, range.from]);

  const handleEndReached = useCallback(() => {
    if (loadingEnd) return;

    setLoadingEnd(true);
    setTimeout(() => {
      setRange(current => ({ ...current, to: current.to + PAGE_SIZE }));
      setLoadingEnd(false);
    }, LOAD_DELAY_MS);
  }, [loadingEnd]);

  const maintainVisibleContentPosition = useMemo(
    () => (keepPosition ? { data: true, size: true } : undefined),
    [keepPosition],
  );

  const renderItem = useCallback(
    ({ item, stickyOffset, stickyPinned }: IListRenderItemProps<LabRow>) => (
      <LabRowView
        row={item}
        withAvatar
        stickyOffset={stickyOffset}
        stickyPinned={stickyPinned}
      />
    ),
    [],
  );

  const handleReset = useCallback(() => {
    resetListPerf();
  }, []);

  return (
    <Container>
      <Navbar title={"Производительность"} safeArea>
        <Navbar.BackButton />
      </Navbar>

      <LabPanel>
        <View style={ss.actions}>
          <LabAction title={"Сброс счётчиков"} onPress={handleReset} />
          <LabAction
            title={"В конец"}
            onPress={() => listRef.current?.scrollToEnd({ animated: false })}
          />
          <LabAction
            title={"В начало"}
            onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
          />
        </View>

        <LabToggle title={"Замер"} value={measuring} onChange={setMeasuring} />
        <LabToggle title={"Прилипание"} value={sticky} onChange={setSticky} />
        <LabToggle
          title={"Переработка контейнеров"}
          value={recycle}
          onChange={setRecycle}
        />
        <LabToggle
          title={"Высоты известны заранее"}
          value={fixedSizes}
          onChange={setFixedSizes}
        />
        <LabToggle
          title={"Удержание позиции"}
          value={keepPosition}
          onChange={setKeepPosition}
        />
        <LabStatus
          text={`строк: ${rows.length} · диапазон ${range.from}…${range.to}`}
        />
        <LabPerfHud enabled={measuring} />
      </LabPanel>

      <List
        key={listKey}
        ref={listRef}
        data={rows}
        renderItem={renderItem}
        keyExtractor={labRowKey}
        getItemType={labRowType}
        getFixedItemSize={fixedSizes ? labRowHeight : undefined}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        sticky={stickyConfigs}
        maintainVisibleContentPosition={maintainVisibleContentPosition}
        onStartReached={handleStartReached}
        onStartReachedThreshold={0.4}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        recycleItems={recycle}
        style={ss.list}
      />
    </Container>
  );
};

PerfScreen.displayName = "PerfScreen";

const ss = StyleSheet.create({
  actions: { flexDirection: "row", gap: 8, marginBottom: 6 },
  list: { flex: 1 },
});
