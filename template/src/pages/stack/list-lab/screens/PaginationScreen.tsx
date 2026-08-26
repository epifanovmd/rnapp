import { Container, Navbar } from "@shared/ui";
import type { IListRef } from "@shared/ui/list";
import { List } from "@shared/ui/list";
import React, { FC, useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";

import { LabPanel, LabRowView, LabStatus, LabToggle } from "../components";
import type { LabRow } from "../model";
import { createMessages, labRowHeight, labRowKey, labRowType } from "../model";

const INITIAL_FROM = 500;
const INITIAL_TO = 540;
const PAGE_SIZE = 20;
const LOAD_DELAY_MS = 700;
const ESTIMATED_ITEM_SIZE = 92;

/**
 * Стенд подгрузки в обе стороны.
 *
 * Подгрузка вверх — тот случай, ради которого нужно удержание позиции: список
 * вырастает выше вьюпорта, и без компенсации контент уезжает вниз на высоту
 * добавленного. Переключатель показывает разницу вживую.
 */
export const PaginationScreen: FC = () => {
  const listRef = useRef<IListRef>(null);

  const [range, setRange] = useState({ from: INITIAL_FROM, to: INITIAL_TO });
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingEnd, setLoadingEnd] = useState(false);
  const [keepPosition, setKeepPosition] = useState(true);
  const [status, setStatus] = useState("готово");

  const data = useMemo<LabRow[]>(() => {
    const rows: LabRow[] = createMessages(range.from, range.to);

    if (loadingStart)
      rows.unshift({ type: "loader", key: "loader-start", edge: "start" });
    if (loadingEnd)
      rows.push({ type: "loader", key: "loader-end", edge: "end" });

    return rows;
  }, [range, loadingStart, loadingEnd]);

  const handleStartReached = useCallback(() => {
    if (loadingStart || range.from <= 0) return;

    setLoadingStart(true);
    setStatus("подгрузка сверху…");

    setTimeout(() => {
      setRange(current => ({
        ...current,
        from: Math.max(0, current.from - PAGE_SIZE),
      }));
      setLoadingStart(false);
      setStatus(`добавлено ${PAGE_SIZE} сверху`);
    }, LOAD_DELAY_MS);
  }, [loadingStart, range.from]);

  const handleEndReached = useCallback(() => {
    if (loadingEnd) return;

    setLoadingEnd(true);
    setStatus("подгрузка снизу…");

    setTimeout(() => {
      setRange(current => ({ ...current, to: current.to + PAGE_SIZE }));
      setLoadingEnd(false);
      setStatus(`добавлено ${PAGE_SIZE} снизу`);
    }, LOAD_DELAY_MS);
  }, [loadingEnd]);

  const maintainVisibleContentPosition = useMemo(
    () => (keepPosition ? { data: true, size: true } : undefined),
    [keepPosition],
  );

  const renderItem = useCallback(
    ({ item }: { item: LabRow }) => <LabRowView row={item} />,
    [],
  );

  return (
    <Container>
      <Navbar title={"Подгрузка"} safeArea>
        <Navbar.BackButton />
      </Navbar>

      <LabPanel>
        <LabToggle
          title={"Удерживать позицию при вставке"}
          value={keepPosition}
          onChange={setKeepPosition}
        />
        <LabStatus text={`диапазон ${range.from}…${range.to} · ${status}`} />
        <LabStatus
          text={"Долистайте вверх: с выключенным удержанием контент прыгнет"}
        />
      </LabPanel>

      <List
        ref={listRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={labRowKey}
        getItemType={labRowType}
        getFixedItemSize={labRowHeight}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        maintainVisibleContentPosition={maintainVisibleContentPosition}
        onStartReached={handleStartReached}
        onStartReachedThreshold={0.4}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        recycleItems
        style={ss.list}
      />
    </Container>
  );
};

PaginationScreen.displayName = "PaginationScreen";

const ss = StyleSheet.create({
  list: { flex: 1 },
});
