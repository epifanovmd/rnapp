import type {
  IAnchorListRef,
  IAnchorListRenderItemProps,
  IAnchorListStickyConfig,
} from "@epifanovmd/anchor-list";
import { AnchorList } from "@epifanovmd/anchor-list";
import { Container, Navbar } from "@shared/ui";
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
  const listRef = useRef<IAnchorListRef>(null);

  const [stickyDates, setStickyDates] = useState(true);
  const [stickyAvatars, setStickyAvatars] = useState(true);

  // Отступы кромок — shared values: у настоящего чата они едут вместе с
  // навбаром и клавиатурой, здесь остаются нулевыми.
  const topOffset = useSharedValue(0);
  const bottomOffset = useSharedValue(0);

  const { rows, dateIndices, avatarIndices, groupStarts } = useMemo(
    () => withDateSeparators(createMessages(0, MESSAGE_COUNT)),
    [],
  );

  const sticky = useMemo<IAnchorListStickyConfig<LabRow>[]>(() => {
    const configs: IAnchorListStickyConfig<LabRow>[] = [];

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
    }: IAnchorListRenderItemProps<LabRow>) => (
      <LabRowView
        row={item}
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
        <LabStatus
          text={`дат: ${dateIndices.length} · групп: ${avatarIndices.length}`}
        />
      </LabPanel>

      {/* Высоты намеренно измеряются. Увеличенный буфер даёт строкам уточнить
          оценку до входа в кадр на быстром броске. */}
      <AnchorList
        ref={listRef}
        data={rows}
        renderItem={renderItem}
        keyExtractor={labRowKey}
        getItemType={labRowType}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        drawDistance={600}
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
