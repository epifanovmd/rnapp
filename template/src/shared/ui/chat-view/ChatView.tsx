import type { LegendListRef } from "@legendapp/list/react-native";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, { useSharedValue } from "react-native-reanimated";

import { useConstant, useCrossfade, useLatestRef } from "../../lib/hooks";
import {
  useKeyboardInset,
  useKeyboardScrollCompensation,
} from "../../lib/keyboard";
import { useTheme } from "../../lib/theme";
import { DisintegrateProvider } from "../disintegrate";
import {
  IInputBarViewRef,
  INPUT_BAR_MIN_HEIGHT,
  InputBarView,
  KeyboardInputBar,
} from "../input-bar";
import { Spinner } from "../spinner";
import { ChatFab, ChatList, EmptyStateOverlay } from "./components";
import { CHAT_CONTENT_PADDING, CHAT_SKIN } from "./config";
import { createChatContentRegistry } from "./content";
import { CHAT_BUILTIN_CONTENT } from "./content/builtin";
import {
  useChatCellActions,
  useChatData,
  useChatInitialPosition,
  useChatInputBar,
  useChatPagination,
  useChatScrollControl,
  useChatScrollReport,
  useChatStickyDate,
  useChatUnread,
  useChatViewability,
  useChatViewContextValue,
} from "./hooks";
import {
  ChatAdaptiveRenderStore,
  ChatHighlightStore,
  ChatViewContext,
} from "./model";
import { chatVoicePlayer } from "./services";
import { ChatViewProps, IChatViewRef } from "./types";

/** Пауза перед схлопыванием удалённой строки: столько длится рождение частиц. */
const MESSAGE_REMOVE_DURATION = 0.33;

/**
 * Реестр типов контента. Модульная константа: ссылка обязана быть стабильной —
 * иначе инвалидируется мемоизация всех ячеек и кеш разбора сообщений.
 */
const CONTENT_TYPES = createChatContentRegistry(CHAT_BUILTIN_CONTENT);

/** Чат: LegendList + одна зона клавиатуры на всех потребителей. */
export const ChatView = forwardRef<IChatViewRef, ChatViewProps>(
  (props, ref) => {
    const {
      messages,
      getActionsForMessage,
      inputAction,
      initialScrollAnchor,
      isLoading = false,
      emptyStateText,
      isLoadingTop = false,
      isLoadingBottom = false,
      isLoadingFab = false,
      style,
      unreadCount = -1,
    } = props;

    const propsRef = useLatestRef(props);

    const { isDark } = useTheme();
    const { colors, styles } = isDark ? CHAT_SKIN.dark : CHAT_SKIN.light;

    const listRef = useRef<LegendListRef>(null);
    const inputBarRef = useRef<IInputBarViewRef>(null);

    const highlight = useConstant(() => new ChatHighlightStore());
    const adaptiveRender = useConstant(() => new ChatAdaptiveRenderStore());

    // Плеер — синглтон и переживает чат: без остановки запись продолжала бы
    // играть после ухода с экрана.
    useEffect(() => () => chatVoicePlayer.stop(), []);

    const scrollOffset = useSharedValue(0);
    const isNearEnd = useSharedValue(true);
    const activeStickyIndex = useSharedValue(-1);
    const fabExpanded = useSharedValue(0);
    const fabHiddenForRecording = useSharedValue(0);

    const stickyDate = useChatStickyDate(scrollOffset, activeStickyIndex);

    const data = useChatData({
      messages,
      contentTypes: CONTENT_TYPES,
      getActionsForMessage,
      showBottomLoading: isLoadingBottom && messages.length > 0,
      hideFirstSeparator: isLoadingTop,
      removeDuration: MESSAGE_REMOVE_DURATION,
    });

    const dataRef = useLatestRef(data);

    const handleKeyboardBlur = useCallback(
      () => inputBarRef.current?.blur(),
      [],
    );
    const handleKeyboardRefocus = useCallback(
      () => inputBarRef.current?.focus(),
      [],
    );

    const barHeight = useSharedValue(INPUT_BAR_MIN_HEIGHT);

    const keyboard = useKeyboardInset({
      barHeight,
      extraPadding: CHAT_CONTENT_PADDING,
      onBlur: handleKeyboardBlur,
      onRefocus: handleKeyboardRefocus,
    });

    // Одна зона клавиатуры: панель едет по occludedBottom,
    // контент — распоркой и компенсацией скролла по contentInset.
    const compensation = useKeyboardScrollCompensation(
      keyboard.contentInset,
      keyboard.reservedInset,
    );

    const scrollReport = useChatScrollReport({
      listRef,
      data: dataRef,
      props: propsRef,
      scrollOffset,
      isNearEnd,
      getBottomInset: keyboard.getContentInset,
    });

    const scrollControl = useChatScrollControl({
      listRef,
      data: dataRef,
      highlight,
      getBottomInset: keyboard.getContentInset,
    });

    const unread = useChatUnread(unreadCount, data.messages);

    const viewabilityPairs = useChatViewability({
      props: propsRef,
      isNearEnd,
      onMarkRead: unread.markRead,
    });

    const pagination = useChatPagination({ props: propsRef, scrollOffset });

    // Геометрия скролла нужна пагинации (пороги как доли экрана)
    // и компенсации (предел прокрутки).
    const handleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        compensation.onLayout(event);
        pagination.onLayout(event);
      },
      [compensation, pagination],
    );

    // Начало жеста: включаем флаг пользовательского взаимодействия для якоря.
    const handleScrollBeginDrag = useCallback(() => {
      compensation.onScrollBeginDrag();
      scrollReport.onScrollBeginDrag();
    }, [compensation, scrollReport]);

    // Конец жеста: запускаем таймер устаканивания для снятия якоря.
    const handleScrollEndDrag = useCallback(() => {
      compensation.onScrollEndDrag();
      scrollReport.scheduleAnchorSave();
    }, [compensation, scrollReport]);

    const initialPosition = useChatInitialPosition({
      anchor: initialScrollAnchor,
      listRef,
      data: dataRef,
      contentPaddingTop: CHAT_CONTENT_PADDING,
      getBottomInset: keyboard.getContentInset,
    });

    const clearUnread = unread.clear;

    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom: () => scrollControl.scrollToBottom(true),
        scrollToMessage: scrollControl.scrollToMessage,
        clearUnread,
      }),
      [scrollControl, clearUnread],
    );

    const cellActions = useChatCellActions({
      props: propsRef,
      scrollControl,
      freezeKeyboard: keyboard.freeze,
      restoreKeyboard: keyboard.restore,
    });

    const inputBar = useChatInputBar({
      inputAction,
      messageIndex: data.messageIndex,
      contentTypes: CONTENT_TYPES,
      props: propsRef,
      scrollControl,
      barHeight,
      fabExpanded,
      fabHiddenForRecording,
    });

    const handleFabPress = useCallback(() => {
      propsRef.current.onFabPress?.();
    }, [propsRef]);

    const chatContext = useChatViewContextValue({
      colors,
      styles,
      contentTypes: CONTENT_TYPES,
      actions: cellActions,
      highlight,
      adaptiveRender,
      stickyDate,
    });

    const listWrapStyle = useCrossfade(styles);

    const hasMessages = data.messages.length > 0;

    return (
      <ChatViewContext.Provider value={chatContext}>
        {/* Частицы распада живут поверх всего чата и переживают удалённую строку. */}
        <DisintegrateProvider style={[ss.root, style]}>
          <Animated.View style={[ss.listWrap, listWrapStyle]}>
            <ChatList
              ref={listRef}
              rows={data.rows}
              stickyIndices={data.stickyIndices}
              scrollRef={compensation.scrollRef}
              bottomSpacerStyle={compensation.spacerStyle}
              indicatorBottomInset={keyboard.contentInset}
              scrollOffset={scrollOffset}
              isNearEnd={isNearEnd}
              activeStickyIndex={activeStickyIndex}
              initialScrollIndex={initialPosition.scrollIndex}
              startReachedThreshold={pagination.startReachedThreshold}
              endReachedThreshold={pagination.endReachedThreshold}
              maintainScrollAtEndThreshold={pagination.scrollToBottomThreshold}
              viewabilityConfigCallbackPairs={viewabilityPairs}
              onLoad={initialPosition.onListLoad}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              onStartReached={pagination.onStartReached}
              onEndReached={pagination.onEndReached}
              onLayout={handleLayout}
              onContentSizeChange={compensation.onContentSizeChange}
              onAdaptiveRenderChange={adaptiveRender.set}
            />

            {isLoadingTop && hasMessages && (
              <View style={ss.topSpinner}>
                <Spinner size={20} />
              </View>
            )}

            <EmptyStateOverlay
              visible={!hasMessages}
              loading={isLoading}
              text={emptyStateText}
              bottomInset={keyboard.contentInset}
            />
          </Animated.View>

          <KeyboardInputBar offset={keyboard.occludedBottom}>
            <InputBarView
              ref={inputBarRef}
              mode={inputBar.mode}
              delegate={inputBar.delegate}
              onHeightChange={inputBar.onHeightChange}
            />
          </KeyboardInputBar>

          <ChatFab
            bottomInset={keyboard.occludedBottom}
            inputBarHeight={barHeight}
            isNearEnd={isNearEnd}
            expanded={fabExpanded}
            hiddenForRecording={fabHiddenForRecording}
            isLoading={isLoadingFab}
            hasMessages={hasMessages}
            unreadCount={unread.count}
            onPress={handleFabPress}
          />
        </DisintegrateProvider>
      </ChatViewContext.Provider>
    );
  },
);

ChatView.displayName = "ChatView";

const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent", overflow: "hidden" },
  listWrap: { flex: 1 },
  topSpinner: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});

/** Императивный интерфейс компонента. */
export type ChatView = IChatViewRef;
