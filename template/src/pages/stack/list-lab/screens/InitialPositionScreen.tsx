import type { IAnchorListRef } from "@epifanovmd/anchor-list";
import { AnchorList } from "@epifanovmd/anchor-list";
import { useFocusEffect } from "@react-navigation/native";
import { IStorageService } from "@shared/lib/storage";
import { Container, Navbar } from "@shared/ui";
import React, { FC, useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";

import {
  LabAction,
  LabPanel,
  LabRowView,
  LabStatus,
  LabToggle,
} from "../components";
import type { ILabPosition, LabRow } from "../model";
import {
  createLabPositionStorage,
  createMessages,
  labRowHeight,
  labRowKey,
  labRowType,
} from "../model";

const SCREEN_ID = "initial-position";
const MESSAGE_COUNT = 300;
const ESTIMATED_ITEM_SIZE = 92;

/**
 * Стенд стартовой позиции.
 *
 * Позиция пишется в MMKV синхронно и читается один раз — до первого рендера,
 * поэтому список открывается сразу там, где его оставили, без видимого прыжка.
 * Проверяется уходом с экрана и возвратом на него.
 */
export const InitialPositionScreen: FC = () => {
  const storage = IStorageService.useInstance();
  const positionStorage = useMemo(
    () => createLabPositionStorage(storage),
    [storage],
  );

  const listRef = useRef<IAnchorListRef>(null);
  const data = useMemo(() => createMessages(0, MESSAGE_COUNT), []);

  const [restoreEnabled, setRestoreEnabled] = useState(() =>
    positionStorage.isRestoreEnabled(),
  );

  // Читается ровно один раз: дальше позиция живёт в самом списке.
  const [savedPosition] = useState<ILabPosition | undefined>(() =>
    positionStorage.isRestoreEnabled()
      ? positionStorage.read(SCREEN_ID)
      : undefined,
  );
  const [status, setStatus] = useState(() =>
    savedPosition
      ? `восстановлено: ${savedPosition.key}`
      : "сохранённой позиции нет",
  );

  const initialScroll = useMemo(() => {
    if (!savedPosition) return undefined;

    const index = data.findIndex(row => labRowKey(row) === savedPosition.key);

    if (index === -1) return undefined;

    return { type: "index" as const, index, viewOffset: savedPosition.offset };
  }, [data, savedPosition]);

  /**
   * Снимок текущей позиции: верхняя видимая строка и её смещение относительно
   * кромки со знаком. Отрицательное смещение означает, что строка уходит за
   * кромку — именно оно возвращает её ровно тем же куском, каким она была.
   */
  const savePosition = useCallback(() => {
    const list = listRef.current;

    if (!list || !restoreEnabled) return;

    const topRowIndex = list.getVisibleRange().start;
    const position = list.getPositionAtIndex(topRowIndex);
    const row = data[topRowIndex];

    if (position === undefined || !row) return;

    const next: ILabPosition = {
      key: labRowKey(row),
      offset: position - list.getScrollOffset(),
    };

    positionStorage.write(SCREEN_ID, next);
    setStatus(`сохранено: ${next.key} (${Math.round(next.offset)})`);
  }, [data, positionStorage, restoreEnabled]);

  /**
   * Снимок берётся при уходе с экрана.
   *
   * Видимость сообщает только о смене состава строк, поэтому доводка скролла
   * внутри той же строки в неё не попадает — сохранённое смещение отставало бы
   * от фактического на всю такую доводку.
   */
  useFocusEffect(useCallback(() => savePosition, [savePosition]));

  const handleRestoreChange = useCallback(
    (value: boolean) => {
      setRestoreEnabled(value);
      positionStorage.setRestoreEnabled(value);
      setStatus(value ? "восстановление включено" : "восстановление выключено");
    },
    [positionStorage],
  );

  const handleClear = useCallback(() => {
    positionStorage.clear(SCREEN_ID);
    setStatus("позиция сброшена");
  }, [positionStorage]);

  const renderItem = useCallback(
    ({ item }: { item: LabRow }) => <LabRowView row={item} />,
    [],
  );

  return (
    <Container>
      <Navbar title={"Стартовая позиция"} safeArea>
        <Navbar.BackButton />
      </Navbar>

      <LabPanel>
        <LabToggle
          title={"Восстанавливать позицию"}
          value={restoreEnabled}
          onChange={handleRestoreChange}
        />
        <LabStatus text={status} />
        <LabStatus
          text={
            "Уйдите с экрана и вернитесь — список откроется на той же строке"
          }
        />
        <LabAction
          title={"Сбросить сохранённую позицию"}
          onPress={handleClear}
        />
      </LabPanel>

      <AnchorList
        ref={listRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={labRowKey}
        getItemType={labRowType}
        getFixedItemSize={labRowHeight}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        initialScroll={initialScroll}
        recycleItems
        style={ss.list}
      />
    </Container>
  );
};

InitialPositionScreen.displayName = "InitialPositionScreen";

const ss = StyleSheet.create({
  list: { flex: 1 },
});
