import type { IAnchorListRef } from "@epifanovmd/anchor-list";
import { AnchorList } from "@epifanovmd/anchor-list";
import { useKeyboardInset } from "@shared/lib/keyboard";
import { Container, Navbar } from "@shared/ui";
import {
  INPUT_BAR_MIN_HEIGHT,
  InputBar,
  KeyboardInputBar,
} from "@shared/ui/input-bar";
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet } from "react-native";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  LabFab,
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

const INITIAL_COUNT = 120;
const ESTIMATED_ITEM_SIZE = 92;

/**
 * Стенд нижнего отступа.
 *
 * Панель ввода и клавиатура съедают низ вьюпорта. Экрану остаётся посчитать
 * перекрытие и отдать его списку одним пропом `insetEnd`: место в конце
 * контента, подъём контента вместе с клавиатурой, отступ индикатора скролла и
 * якоря конечной кромки список делает сам и от этого же числа.
 *
 * Проверяется так: встать у нижней строки, открыть клавиатуру — строка должна
 * остаться видимой, а не уехать под панель. Отдельно — короткий список: там
 * прокручивать нечего, и контент поднимает не скролл, а выравнивание.
 */
export const InputBarInsetScreen: FC = () => {
  const listRef = useRef<IAnchorListRef>(null);

  const [rows, setRows] = useState<LabRow[]>(() =>
    createMessages(0, INITIAL_COUNT),
  );
  const [compensate, setCompensate] = useState(true);
  const [stickToEnd, setStickToEnd] = useState(true);

  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const barHeight = useSharedValue(INPUT_BAR_MIN_HEIGHT);
  /** Список у нижнего края: по нему кнопка возврата решает, показываться ли. */
  const isAtEnd = useSharedValue(true);
  const kb = useKeyboardInset({ barHeight });

  const handleHeightChange = useCallback(
    (height: number) => {
      barHeight.value = height;
    },
    [barHeight],
  );

  // С выключенной компенсацией перекрытие застывает на закрытом положении —
  // панель ввода и безопасная зона под ней. Список тогда не узнаёт о
  // клавиатуре, и видно, как контент уходит под неё.
  const isCompensating = useSharedValue(compensate);

  useEffect(() => {
    isCompensating.value = compensate;
  }, [compensate, isCompensating]);

  const insetEnd = useDerivedValue(() =>
    isCompensating.value
      ? kb.contentInset.value
      : barHeight.value + safeAreaBottom,
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

  const listSharedValues = useMemo(
    () => ({ isWithinMaintainScrollAtEndThreshold: isAtEnd }),
    [isAtEnd],
  );

  const renderItem = useCallback(
    ({ item }: { item: LabRow }) => <LabRowView row={item} />,
    [],
  );

  const handleFabPress = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

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

      <AnchorList
        ref={listRef}
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
        // Одно значение на весь низ: место в конце контента, подъём под
        // клавиатуру, индикатор скролла и якорь конечной кромки.
        insetEnd={insetEnd}
        sharedValues={listSharedValues}
        recycleItems
        style={ss.list}
      />

      {/* Тот же отступ, что у контента: кнопка держится над панелью ввода и
          поднимается вместе с клавиатурой. */}
      <LabFab
        bottomInset={kb.contentInset}
        isAtEnd={isAtEnd}
        onPress={handleFabPress}
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
