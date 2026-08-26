import {
  useKeyboardInset,
  useKeyboardScrollCompensation,
} from "@shared/lib/keyboard";
import { Container, Navbar } from "@shared/ui";
import {
  INPUT_BAR_MIN_HEIGHT,
  InputBar,
  KeyboardInputBar,
} from "@shared/ui/input-bar";
import type { IListRef } from "@shared/ui/list";
import { List } from "@shared/ui/list";
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";

import { LabPanel, LabRowView, LabStatus, LabToggle } from "../components";
import type { LabRow } from "../model";
import {
  createMessage,
  createMessages,
  labRowHeight,
  labRowKey,
  labRowType,
} from "../model";

const INITIAL_COUNT = 120;
const ESTIMATED_ITEM_SIZE = 92;

/**
 * Стенд нижнего отступа.
 *
 * Панель ввода и клавиатура съедают низ вьюпорта. Отступ отдаётся списку
 * распоркой в футере: она анимируется на UI-потоке вместе с клавиатурой,
 * поэтому контент не дёргается и последняя строка остаётся над панелью.
 *
 * Проверяется так: встать у нижней строки, открыть клавиатуру — строка должна
 * остаться видимой, а не уехать под панель.
 */
export const InputBarInsetScreen: FC = () => {
  const listRef = useRef<IListRef>(null);

  const [rows, setRows] = useState<LabRow[]>(() =>
    createMessages(0, INITIAL_COUNT),
  );
  const [compensate, setCompensate] = useState(true);
  const [stickToEnd, setStickToEnd] = useState(true);

  const barHeight = useSharedValue(INPUT_BAR_MIN_HEIGHT);
  const kb = useKeyboardInset({ barHeight });

  const handleHeightChange = useCallback(
    (height: number) => {
      barHeight.value = height;
    },
    [barHeight],
  );

  // С выключенной компенсацией инсет застывает: список не узнаёт о клавиатуре,
  // и видно, как контент уходит под неё.
  const isCompensating = useSharedValue(compensate);

  useEffect(() => {
    isCompensating.value = compensate;
  }, [compensate, isCompensating]);

  const contentInset = useDerivedValue(() =>
    isCompensating.value ? kb.contentInset.value : INPUT_BAR_MIN_HEIGHT,
  );
  const reservedInset = useDerivedValue(() =>
    isCompensating.value ? kb.reservedInset.value : INPUT_BAR_MIN_HEIGHT,
  );

  // Распорка в конце контента плюс подъём скролла на ту же дельту: контент
  // поднимается вместе с клавиатурой, а не остаётся под ней.
  const compensation = useKeyboardScrollCompensation(
    contentInset,
    reservedInset,
  );

  const listFooter = useMemo(
    () => (
      <Animated.View style={compensation.spacerStyle} pointerEvents={"none"} />
    ),
    [compensation.spacerStyle],
  );

  const handleSend = useCallback((text: string) => {
    setRows(current => {
      const next = createMessage(30000 + current.length);

      return [...current, { ...next, text: text || next.text }];
    });
  }, []);

  const maintainScrollAtEnd = useMemo(
    () => (stickToEnd ? { onlyWhenAtEnd: true, animated: true } : undefined),
    [stickToEnd],
  );

  const renderItem = useCallback(
    ({ item }: { item: LabRow }) => <LabRowView row={item} />,
    [],
  );

  return (
    // Нижний инсет уже входит в `occludedBottom` панели ввода.
    <Container edges={[]}>
      <Navbar title={"Нижний отступ"} safeArea>
        <Navbar.BackButton />
      </Navbar>

      <LabPanel>
        <LabToggle
          title={"Компенсировать клавиатуру и панель"}
          value={compensate}
          onChange={setCompensate}
        />
        <LabToggle
          title={"Прилипать к концу при отправке"}
          value={stickToEnd}
          onChange={setStickToEnd}
        />
        <LabStatus text={"Встаньте у нижней строки и откройте клавиатуру"} />
      </LabPanel>

      <List
        ref={listRef}
        refScrollView={compensation.scrollRef}
        onLayout={compensation.onLayout}
        onContentSizeChange={compensation.onContentSizeChange}
        onScrollBeginDrag={compensation.onScrollBeginDrag}
        onScrollEndDrag={compensation.onScrollEndDrag}
        data={rows}
        renderItem={renderItem}
        keyExtractor={labRowKey}
        getItemType={labRowType}
        getFixedItemSize={labRowHeight}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        alignItemsAtEnd
        initialScroll={{ type: "end" }}
        maintainScrollAtEnd={maintainScrollAtEnd}
        maintainVisibleContentPosition={{ data: true, size: true }}
        ListFooterComponent={listFooter}
        recycleItems
        style={ss.list}
      />

      <KeyboardInputBar offset={kb.occludedBottom}>
        <InputBar
          onSendMessage={handleSend}
          onHeightChange={handleHeightChange}
        />
      </KeyboardInputBar>
    </Container>
  );
};

InputBarInsetScreen.displayName = "InputBarInsetScreen";

const ss = StyleSheet.create({
  list: { flex: 1 },
});
