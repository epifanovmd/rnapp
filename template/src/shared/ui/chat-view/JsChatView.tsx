import type { LegendListRef } from "@legendapp/list/react-native";
import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, { useSharedValue } from "react-native-reanimated";

import { useConstant, useCrossfade, useLatestRef } from "../../lib/hooks";
import { useKeyboardInset } from "../../lib/keyboard";
import {
  IInputBarViewRef,
  InputBarContext,
  InputBarView,
  KeyboardInputBar,
} from "../input-bar";
import { ChatFab, ChatList, EmptyStateOverlay } from "./components";
import {
  useChatCellActions,
  useChatConfig,
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
  useInputBarContextValue,
} from "./hooks";
import {
  ChatAdaptiveRenderStore,
  ChatHighlightStore,
  ChatViewContext,
} from "./model";
import { ChatViewProps, IChatViewRef } from "./types";

/** Смена ссылки заставила бы список пересчитать sticky. */
const NO_STICKY_INDICES: number[] = [];

/**
 * React Native-реализация ChatView на `@legendapp/list`.
 *
 * Всё, что связано с положением контента, отдано списку и нативному слою
 * клавиатуры. Здесь остаётся склейка — конфигурация, данные, команды и
 * разводка колбэков наружу.
 *
 * - `config/` — тема, метрики, флаги и готовые стили ячеек;
 * - `data/` — разбор сообщений и построение строк;
 * - `model/` — контекст, стор подсветки и математика якоря позиции;
 * - `hooks/` — по хуку на ответственность;
 * - `components/` — только отрисовка;
 * - `shared/lib/keyboard` — нижняя зона экрана и её заморозка.
 */
export const JsChatView = memo(
  forwardRef<IChatViewRef, ChatViewProps>((props, ref) => {
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
      collectionInsetTop = 0,
      collectionInsetBottom = 0,
      unreadCount = -1,
    } = props;

    const propsRef = useLatestRef(props);

    const { theme, layout, inputBarLayout, features, styles } =
      useChatConfig(props);

    const listRef = useRef<LegendListRef>(null);
    const inputBarRef = useRef<IInputBarViewRef>(null);

    const highlight = useConstant(() => new ChatHighlightStore());
    const adaptiveRender = useConstant(() => new ChatAdaptiveRenderStore());

    const scrollOffset = useSharedValue(0);
    const isNearEnd = useSharedValue(true);
    const activeStickyIndex = useSharedValue(-1);
    const fabExpanded = useSharedValue(0);
    const fabHiddenForRecording = useSharedValue(0);

    const stickyDate = useChatStickyDate(
      scrollOffset,
      activeStickyIndex,
      layout,
      features.showFloatingDate,
    );

    const data = useChatData({
      messages,
      getActionsForMessage,
      features,
      showBottomLoading:
        isLoadingBottom &&
        features.showBottomLoadingIndicator &&
        messages.length > 0,
      hideFirstSeparator: isLoadingTop,
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

    const barHeight = useSharedValue(inputBarLayout.inputBarMinHeight);

    const keyboard = useKeyboardInset({
      barHeight,
      extraPadding: layout.collectionBottomPadding + collectionInsetBottom,
      onBlur: handleKeyboardBlur,
      onRefocus: handleKeyboardRefocus,
    });

    const scrollControl = useChatScrollControl({
      listRef,
      data: dataRef,
      highlight,
    });

    const unread = useChatUnread(unreadCount, data.messages);

    const viewabilityPairs = useChatViewability({
      props: propsRef,
      isNearEnd,
      onMarkRead: unread.markRead,
      visibilityThreshold: props.visibilityThreshold,
      unreadVisibilityThreshold: props.unreadVisibilityThreshold,
      visibleInterval: props.visibleMessagesThrottleInterval,
      unreadInterval: props.unreadMessagesDebounceInterval,
    });

    const handleScroll = useChatScrollReport({
      listRef,
      data: dataRef,
      props: propsRef,
      isNearEnd,
      throttleInterval: layout.scrollThrottleInterval,
      getBottomInset: keyboard.getContentInset,
    });

    const pagination = useChatPagination({
      props: propsRef,
      features,
      scrollOffset,
    });

    const contentPaddingTop = layout.collectionTopPadding + collectionInsetTop;

    const initialPosition = useChatInitialPosition({
      anchor: initialScrollAnchor,
      listRef,
      data: dataRef,
      contentPaddingTop,
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
      props: propsRef,
      scrollControl,
      features,
      barHeight,
      fabExpanded,
      fabHiddenForRecording,
    });

    const handleFabPress = useCallback(
      () => propsRef.current.onFabPress?.({}),
      [propsRef],
    );

    const chatContext = useChatViewContextValue({
      theme,
      layout,
      inputBarLayout,
      features,
      styles,
      actions: cellActions,
      highlight,
      adaptiveRender,
      stickyDate,
    });

    const inputBarContext = useInputBarContextValue(theme, inputBarLayout);

    const stickyIndices = features.showFloatingDate
      ? data.stickyIndices
      : NO_STICKY_INDICES;

    const listWrapStyle = useCrossfade(styles);

    const hasMessages = data.messages.length > 0;

    return (
      <ChatViewContext.Provider value={chatContext}>
        <View style={[ss.root, style]}>
          <Animated.View style={[ss.listWrap, listWrapStyle]}>
            <ChatList
              ref={listRef}
              rows={data.rows}
              stickyIndices={stickyIndices}
              composerInset={keyboard.composerInset}
              freeze={keyboard.isFrozen}
              scrollOffset={scrollOffset}
              isNearEnd={isNearEnd}
              activeStickyIndex={activeStickyIndex}
              contentPaddingTop={contentPaddingTop}
              stickyOffset={collectionInsetTop}
              initialScrollIndex={initialPosition.scrollIndex}
              estimatedItemSize={layout.estimatedRowHeight}
              drawDistance={layout.drawDistance}
              startReachedThreshold={pagination.startReachedThreshold}
              endReachedThreshold={pagination.endReachedThreshold}
              maintainScrollAtEndThreshold={pagination.scrollToBottomThreshold}
              viewabilityConfigCallbackPairs={viewabilityPairs}
              onLoad={initialPosition.onListLoad}
              onScroll={handleScroll}
              onStartReached={pagination.onStartReached}
              onEndReached={pagination.onEndReached}
              onLayout={pagination.onLayout}
              onAdaptiveRenderChange={adaptiveRender.set}
            />

            {isLoadingTop &&
              features.showTopLoadingIndicator &&
              hasMessages && (
                <View style={[ss.topSpinner, { top: 12 + collectionInsetTop }]}>
                  <ActivityIndicator size="small" />
                </View>
              )}

            <EmptyStateOverlay
              visible={!hasMessages}
              loading={isLoading}
              text={emptyStateText}
              bottomInset={keyboard.contentInset}
            />
          </Animated.View>

          {features.showInputBar && (
            <KeyboardInputBar offset={keyboard.occludedBottom}>
              <InputBarContext.Provider value={inputBarContext}>
                <InputBarView
                  ref={inputBarRef}
                  mode={inputBar.mode}
                  delegate={inputBar.delegate}
                  onHeightChange={inputBar.onHeightChange}
                />
              </InputBarContext.Provider>
            </KeyboardInputBar>
          )}

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
        </View>
      </ChatViewContext.Provider>
    );
  }),
);

JsChatView.displayName = "JsChatView";

const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent", overflow: "hidden" },
  listWrap: { flex: 1 },
  topSpinner: { position: "absolute", left: 0, right: 0, alignItems: "center" },
});
