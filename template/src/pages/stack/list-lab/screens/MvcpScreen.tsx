import type { IAnchorListRef } from "@epifanovmd/anchor-list";
import { AnchorList } from "@epifanovmd/anchor-list";
import { Container, Navbar, Row } from "@shared/ui";
import React, { FC, useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";

import {
  LabAction,
  LabPanel,
  LabRowView,
  LabStatus,
  LabToggle,
} from "../components";
import type { LabRow } from "../model";
import {
  createMessage,
  createMessages,
  labRowHeight,
  labRowKey,
  labRowType,
} from "../model";

const INITIAL_COUNT = 200;
const ESTIMATED_ITEM_SIZE = 92;
/** Насколько раздувается элемент при проверке компенсации по размеру. */
const GROWN_HEIGHT = 260;

/**
 * Стенд компенсации позиции.
 *
 * Изменения вносятся кнопками строго выше вьюпорта — там, где пользователь их
 * не видит и потому не должен почувствовать. Если компенсация работает,
 * смещение скролла меняется ровно на высоту изменения, а видимая строка
 * остаётся на месте.
 */
export const MvcpScreen: FC = () => {
  const listRef = useRef<IAnchorListRef>(null);
  /**
   * Счётчик новых сообщений.
   *
   * Номер обязан расти монотонно: он идёт в ключ, а повтор ключа после серии
   * вставок и удалений — это два элемента с одним ключом, чего список не
   * допускает.
   */
  const nextSeq = useRef(10000);

  const [rows, setRows] = useState<LabRow[]>(() =>
    createMessages(0, INITIAL_COUNT),
  );
  const [compensateData, setCompensateData] = useState(true);
  const [compensateSize, setCompensateSize] = useState(true);
  // По умолчанию высоты измеряются: это основной путь, и стенд проверяет его.
  const [knownHeights, setKnownHeights] = useState(false);
  const [status, setStatus] = useState("прокрутите вниз и вносите изменения");

  /** Индекс первой видимой строки: изменения вносятся строго над ней. */
  const getAnchorIndex = useCallback(
    () => listRef.current?.getVisibleRange().start ?? 0,
    [],
  );

  const report = useCallback((action: string, before: number) => {
    // Смещение сравнивается на следующем кадре — компенсация применяется в нём.
    requestAnimationFrame(() => {
      const after = listRef.current?.getScrollOffset() ?? 0;

      setStatus(
        `${action} · скролл ${Math.round(before)} → ${Math.round(after)}`,
      );
    });
  }, []);

  /**
   * Вставка над первой видимой строкой — в том числе когда список в самом
   * верху: это основной сценарий подгрузки истории, и позиция должна
   * удерживаться именно в нём.
   */
  const insertAbove = useCallback(() => {
    const anchor = getAnchorIndex();
    const before = listRef.current?.getScrollOffset() ?? 0;

    const inserted = Array.from({ length: 5 }, () =>
      createMessage(nextSeq.current++),
    );

    setRows(current => [
      ...current.slice(0, anchor),
      ...inserted,
      ...current.slice(anchor),
    ]);

    report("вставлено 5 выше", before);
  }, [getAnchorIndex, report]);

  const removeAbove = useCallback(() => {
    const anchor = getAnchorIndex();
    const before = listRef.current?.getScrollOffset() ?? 0;

    if (anchor < 3) {
      setStatus("выше вьюпорта нет строк — прокрутите вниз");

      return;
    }

    setRows(current => [
      ...current.slice(0, anchor - 3),
      ...current.slice(anchor),
    ]);
    report("удалено 3 выше", before);
  }, [getAnchorIndex, report]);

  const growAbove = useCallback(() => {
    const anchor = getAnchorIndex();
    const before = listRef.current?.getScrollOffset() ?? 0;

    if (anchor < 1) {
      setStatus("прокрутите вниз — выше вьюпорта нет строк");

      return;
    }

    setRows(current =>
      current.map((row, index) =>
        index === anchor - 1 && row.type === "message"
          ? { ...row, height: GROWN_HEIGHT }
          : row,
      ),
    );

    report("строка выше выросла", before);
  }, [getAnchorIndex, report]);

  const insertBelow = useCallback(() => {
    const before = listRef.current?.getScrollOffset() ?? 0;
    const anchor = listRef.current?.getVisibleRange().end ?? 0;

    const inserted = Array.from({ length: 5 }, () =>
      createMessage(nextSeq.current++),
    );

    setRows(current => [
      ...current.slice(0, anchor + 1),
      ...inserted,
      ...current.slice(anchor + 1),
    ]);

    report("вставлено 5 ниже", before);
  }, [report]);

  const maintainVisibleContentPosition = useMemo(
    () => ({ data: compensateData, size: compensateSize }),
    [compensateData, compensateSize],
  );

  const renderItem = useCallback(
    ({ item }: { item: LabRow }) => <LabRowView row={item} />,
    [],
  );

  return (
    <Container>
      <Navbar title={"Компенсация позиции"} safeArea>
        <Navbar.BackButton />
      </Navbar>

      <LabPanel>
        <LabToggle
          title={"Компенсировать вставку и удаление"}
          value={compensateData}
          onChange={setCompensateData}
        />
        <LabToggle
          title={"Компенсировать изменение размеров"}
          value={compensateSize}
          onChange={setCompensateSize}
        />
        <LabToggle
          title={"Высоты известны заранее"}
          value={knownHeights}
          onChange={setKnownHeights}
        />
        <LabStatus text={status} />
        <Row gap={8} flexWrap={"wrap"} mt={4}>
          <LabAction title={"+5 выше"} onPress={insertAbove} />
          <LabAction title={"−3 выше"} onPress={removeAbove} />
          <LabAction title={"растянуть выше"} onPress={growAbove} />
          <LabAction title={"+5 ниже"} onPress={insertBelow} />
        </Row>
      </LabPanel>

      <AnchorList
        // Смена способа задания высот пересоздаёт список: уже объявленные
        // размеры живут в метриках и обратно в оценочные не превращаются.
        key={knownHeights ? "fixed" : "measured"}
        ref={listRef}
        data={rows}
        renderItem={renderItem}
        keyExtractor={labRowKey}
        getItemType={labRowType}
        getFixedItemSize={knownHeights ? labRowHeight : undefined}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        maintainVisibleContentPosition={maintainVisibleContentPosition}
        recycleItems
        style={ss.list}
      />
    </Container>
  );
};

MvcpScreen.displayName = "MvcpScreen";

const ss = StyleSheet.create({
  list: { flex: 1 },
});
