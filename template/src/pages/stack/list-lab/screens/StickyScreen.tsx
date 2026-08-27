import { Container, Navbar } from "@shared/ui";
import type {
  IListRef,
  IListRenderItemProps,
  IListStickyConfig,
} from "@shared/ui/list";
import { List, setListDebug } from "@shared/ui/list";
import React, { FC, useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import {
  LabAvatarPin,
  LabPanel,
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

const MESSAGE_COUNT = 1000;
const ESTIMATED_ITEM_SIZE = 92;
/** Высота аватара: до неё список доводит подъём у верха группы. */
const AVATAR_SIZE = 36;

/**
 * Стенд прилипания.
 *
 * Две кромки одновременно и с разным поведением: даты прилипают к верхней —
 * уходящая вверх шапка задерживается у кромки, пока её не вытолкнет следующая;
 * аватарки прилипают к нижней — аватар группы остаётся у нижнего края, пока
 * видна хоть часть группы, и не поднимается выше её начала.
 */
export const StickyScreen: FC = () => {
  const listRef = useRef<IListRef>(null);

  const [stickyDates, setStickyDates] = useState(true);
  const [stickyAvatars, setStickyAvatars] = useState(true);
  const [logsEnabled, setLogsEnabled] = useState(false);

  // Список пересоздаётся: часть логов захватывается worklet-ами при монтировании.
  const handleLogsChange = useCallback((value: boolean) => {
    setListDebug(
      value ? ["scroll", "range", "position", "size", "sticky"] : [],
    );
    setLogsEnabled(value);
  }, []);

  // Отступы кромок — shared values: у настоящего чата они едут вместе с
  // навбаром и клавиатурой, здесь остаются нулевыми.
  const topOffset = useSharedValue(0);
  const bottomOffset = useSharedValue(0);

  const { rows, dateIndices, avatarIndices, groupStarts } = useMemo(
    () => withDateSeparators(createMessages(0, MESSAGE_COUNT)),
    [],
  );

  const sticky = useMemo<IListStickyConfig<LabRow>[]>(() => {
    const configs: IListStickyConfig<LabRow>[] = [];

    if (stickyDates) {
      configs.push({ edge: "start", indices: dateIndices, offset: topOffset });
    }

    if (stickyAvatars) {
      // Прилипает только аватар: сообщение остаётся на своём месте.
      configs.push({
        edge: "end",
        indices: avatarIndices,
        offset: bottomOffset,
        mode: "offset",
        size: AVATAR_SIZE,
        groupStarts,
        limitInset: MESSAGE_GAP,
        // Пока аватар стоит у кромки, его рисует слой поверх списка: там у него
        // нет покадрового трансформа и нечему дрожать.
        renderOverlay: item => <LabAvatarPin row={item} />,
      });
    }

    return configs;
  }, [
    stickyDates,
    stickyAvatars,
    dateIndices,
    avatarIndices,
    groupStarts,
    topOffset,
    bottomOffset,
  ]);

  const renderItem = useCallback(
    ({
      item,
      stickyOffset,
      stickyPinned,
      index,
    }: IListRenderItemProps<LabRow>) => (
      <LabRowView
        row={item}
        index={index}
        withAvatar
        stickyOffset={stickyOffset}
        stickyPinned={stickyPinned}
      />
    ),
    [],
  );

  return (
    <Container>
      <Navbar title={"Прилипание"} safeArea>
        <Navbar.BackButton />
      </Navbar>

      <LabPanel>
        <LabToggle
          title={"Даты прилипают сверху"}
          value={stickyDates}
          onChange={setStickyDates}
        />
        <LabToggle
          title={"Аватарки прилипают снизу"}
          value={stickyAvatars}
          onChange={setStickyAvatars}
        />
        <LabToggle
          title={"Логи в консоль"}
          value={logsEnabled}
          onChange={handleLogsChange}
        />
        <LabStatus
          text={`дат: ${dateIndices.length} · групп: ${avatarIndices.length}`}
        />
      </LabPanel>

      <List
        key={logsEnabled ? "logs-on" : "logs-off"}
        ref={listRef}
        data={rows}
        renderItem={renderItem}
        keyExtractor={labRowKey}
        getItemType={labRowType}
        getFixedItemSize={labRowHeight}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        sticky={sticky}
        recycleItems
        style={ss.list}
      />
    </Container>
  );
};

StickyScreen.displayName = "StickyScreen";

const ss = StyleSheet.create({
  list: { flex: 1 },
});
