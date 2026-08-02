import type { LegendListRef } from "@legendapp/list/react-native";
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import {
  useKeyboardInset,
  useKeyboardScrollCompensation,
} from "../../lib/keyboard";
import {
  createInputBarStyles,
  IInputBarViewRef,
  INPUT_BAR_DEFAULT_FEATURES,
  InputBarContext,
  InputBarView,
  KeyboardInputBar,
} from "../input-bar";
import {
  ChatFab,
  ChatHighlightStore,
  ChatList,
  ChatViewContext,
  EmptyStateOverlay,
  IChatViewContextValue,
} from "./components";
import { EMPTY_CHAT_DATA, IChatData } from "./data";
import {
  useChatCommands,
  useChatConfig,
  useChatData,
  useChatDelegate,
  useChatInputBar,
  useChatScrollReport,
  useChatStickyDate,
  useChatUnread,
  useChatViewability,
} from "./hooks";
import { ChatViewProps, IChatViewRef } from "./types";

/**
 * React Native-реализация ChatView на `@legendapp/list`.
 *
 * Всё, что связано с положением контента, отдано списку и живёт на UI-потоке:
 * позиция при вставках, прижатие к низу, прилипшая дата, пороги пагинации и
 * доли видимости. Здесь остаётся склейка — конфигурация, данные, команды и
 * разводка колбэков наружу.
 *
 * - `config/` — тема, метрики, флаги и готовые стили ячеек;
 * - `data/` — разбор сообщений и построение строк с сохранением идентичности;
 * - `hooks/` — по хуку на ответственность;
 * - `components/` — только отрисовка;
 * - `shared/lib/keyboard` — нижняя зона экрана и её заморозка (о чате не знает).
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

    // Пропы читаются из ref всеми стабильными колбэками: обработчики не должны
    // пересоздаваться из-за смены любого коллбэка хоста.
    const propsRef = useRef(props);

    propsRef.current = props;

    const { theme, layout, inputBarLayout, features, styles } =
      useChatConfig(props);

    const listRef = useRef<LegendListRef>(null);
    const inputBarRef = useRef<IInputBarViewRef>(null);

    const highlightRef = useRef<ChatHighlightStore | null>(null);

    highlightRef.current ??= new ChatHighlightStore();

    const highlight = highlightRef.current;

    // ─── Значения UI-потока ──────────────────────────────────────────────
    // Их ведут список, клавиатура и панель ввода; React их не читает.

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

    // ─── Данные ──────────────────────────────────────────────────────────

    const data = useChatData({
      messages,
      getActionsForMessage,
      features,
      showBottomLoading: isLoadingBottom && features.showBottomLoadingIndicator,
      hideFirstSeparator: isLoadingTop,
    });

    // Команды и делегат создаются раньше, чем посчитаны строки, — им достаточно
    // стабильной ссылки на актуальный снимок.
    const dataRef = useRef<IChatData>(EMPTY_CHAT_DATA);

    dataRef.current = data;

    // ─── Клавиатура ──────────────────────────────────────────────────────
    // Одна зона на всех потребителей: панель ввода, FAB и низ списка.

    const handleKeyboardBlur = useCallback(
      () => inputBarRef.current?.blur(),
      [],
    );
    const handleKeyboardRefocus = useCallback(
      () => inputBarRef.current?.focus(),
      [],
    );

    const keyboard = useKeyboardInset({
      extraPadding: layout.collectionBottomPadding + collectionInsetBottom,
      initialBarHeight: inputBarLayout.inputBarMinHeight,
      onBlur: handleKeyboardBlur,
      onRefocus: handleKeyboardRefocus,
    });

    const compensation = useKeyboardScrollCompensation(
      keyboard.contentInset,
      keyboard.reservedInset,
    );

    const commands = useChatCommands({
      listRef,
      data: dataRef,
      highlight,
      getBottomInset: keyboard.getContentInset,
    });

    // ─── Непрочитанные ───────────────────────────────────────────────────

    const unread = useChatUnread(unreadCount);
    const trackUnread = unread.track;

    useEffect(() => {
      trackUnread(data.messages);
    }, [data.messages, trackUnread]);

    // ─── Видимость ───────────────────────────────────────────────────────
    // Доли видимости и пороги считает список; здесь только разводка наружу.

    const viewabilityPairs = useChatViewability({
      props: propsRef,
      isNearEnd,
      onMarkRead: unread.markRead,
      visibilityThreshold: props.visibilityThreshold,
      unreadVisibilityThreshold: props.unreadVisibilityThreshold,
      visibleInterval: props.visibleMessagesThrottleInterval,
      unreadInterval: props.unreadMessagesDebounceInterval,
    });

    // ─── Отчёт о скролле ─────────────────────────────────────────────────

    const handleScroll = useChatScrollReport({
      listRef,
      data: dataRef,
      props: propsRef,
      isNearEnd,
      throttleInterval: layout.scrollThrottleInterval,
    });

    const [viewportHeight, setViewportHeight] = useState(0);

    const handleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        compensation.onLayout(event);
        setViewportHeight(event.nativeEvent.layout.height);
      },
      [compensation],
    );

    const handleContentSizeChange = useCallback(
      (width: number, height: number) =>
        compensation.onContentSizeChange(width, height),
      [compensation],
    );

    // Компенсация обязана знать про палец на экране: пока идёт жест,
    // позицию она не трогает.
    const handleScrollBeginDrag = useCallback(
      () => compensation.onScrollBeginDrag(),
      [compensation],
    );
    const handleScrollEndDrag = useCallback(
      () => compensation.onScrollEndDrag(),
      [compensation],
    );

    // ─── Пагинация ───────────────────────────────────────────────────────
    // Пороги задаются пропами в пикселях, список принимает их долей экрана.

    const handleStartReached = useCallback(() => {
      const { hasMore, isLoadingTop: loadingTop } = propsRef.current;

      if (hasMore !== true || loadingTop === true) return;

      propsRef.current.onReachTop?.({ distanceFromTop: scrollOffset.value });
    }, [scrollOffset]);

    const handleEndReached = useCallback(() => {
      const { hasNewer, isLoadingBottom: loadingBottom } = propsRef.current;

      if (hasNewer !== true || loadingBottom === true) return;

      propsRef.current.onReachBottom?.({ distanceFromBottom: 0 });
    }, []);

    const asFraction = (px: number) =>
      viewportHeight > 0 ? px / viewportHeight : 0.5;

    // ─── Начальная позиция ───────────────────────────────────────────────
    // Берётся один раз на монтировании: дальше позицией управляет пользователь.

    const initialScrollIndex = useMemo(() => {
      const anchor = initialScrollAnchor;

      if (!anchor || anchor.wasAtBottom) return undefined;

      const index = dataRef.current.rowIndexById.get(anchor.messageId);

      if (index == null) return undefined;

      // Выравнивание по низу: нижний край строки у низа вьюпорта, сдвинутый
      // на сохранённый offset.
      return { index, viewPosition: 1, viewOffset: -anchor.offset };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Императивный интерфейс ──────────────────────────────────────────

    const clearUnread = unread.clear;

    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom: () => commands.scrollToBottom(true),
        scrollToMessage: commands.scrollToMessage,
        clearUnread,
      }),
      [commands, clearUnread],
    );

    // ─── Панель ввода и делегат ──────────────────────────────────────────

    const delegate = useChatDelegate({
      props: propsRef,
      commands,
      freezeKeyboard: keyboard.freeze,
      restoreKeyboard: keyboard.restore,
    });

    const inputBar = useChatInputBar({
      inputAction,
      messageIndex: data.messageIndex,
      props: propsRef,
      commands,
      features,
      barHeight: keyboard.barHeight,
      fabExpanded,
      fabHiddenForRecording,
    });

    const handleFabPress = useCallback(
      () => propsRef.current.onFabPress?.({}),
      [],
    );

    // ─── Контексты ───────────────────────────────────────────────────────

    const chatContext = useMemo<IChatViewContextValue>(
      () => ({
        theme,
        layout,
        inputBarLayout,
        features,
        styles,
        delegate,
        highlight,
        stickyDate,
      }),
      [
        theme,
        layout,
        inputBarLayout,
        features,
        styles,
        delegate,
        highlight,
        stickyDate,
      ],
    );

    // Ключи темы и метрик у панели ввода совпадают 1:1, поэтому передаются
    // те же объекты — панель просто читает из них свои ключи.
    const inputBarContext = useMemo(
      () => ({
        theme,
        layout: inputBarLayout,
        features: INPUT_BAR_DEFAULT_FEATURES,
        styles: createInputBarStyles(theme, inputBarLayout),
      }),
      [theme, inputBarLayout],
    );

    const listExtraData = useMemo(
      () => ({ styles, features }),
      [styles, features],
    );

    // Без плавающей даты разделители едут в потоке, как обычные строки.
    const stickyIndices = features.showFloatingDate
      ? data.stickyIndices
      : NO_STICKY_INDICES;

    // Смена темы или метрик проявляется коротким кросс-фейдом, а не мгновенной
    // перекраской списка.
    const crossfade = useSharedValue(1);
    const isFirstStyles = useRef(true);

    useEffect(() => {
      if (isFirstStyles.current) {
        isFirstStyles.current = false;

        return;
      }
      crossfade.value = withSequence(
        withTiming(0, { duration: CROSSFADE_MS }),
        withTiming(1, { duration: CROSSFADE_MS }),
      );
    }, [styles, crossfade]);

    const listWrapStyle = useAnimatedStyle(() => ({
      opacity: crossfade.value,
    }));

    return (
      <ChatViewContext.Provider value={chatContext}>
        <View style={[ss.root, style]}>
          <Animated.View style={[ss.listWrap, listWrapStyle]}>
            <ChatList
              ref={listRef}
              rows={data.rows}
              stickyIndices={stickyIndices}
              scrollRef={compensation.scrollRef}
              bottomSpacerStyle={compensation.spacerStyle}
              scrollOffset={scrollOffset}
              isNearEnd={isNearEnd}
              activeStickyIndex={activeStickyIndex}
              contentPaddingTop={
                layout.collectionTopPadding + collectionInsetTop
              }
              stickyOffset={collectionInsetTop}
              initialScrollIndex={initialScrollIndex}
              estimatedItemSize={layout.estimatedRowHeight}
              drawDistance={layout.drawDistance}
              startReachedThreshold={asFraction(features.topLoadThreshold)}
              endReachedThreshold={asFraction(features.bottomLoadThreshold)}
              maintainScrollAtEndThreshold={asFraction(
                features.scrollToBottomThreshold,
              )}
              viewabilityConfigCallbackPairs={viewabilityPairs}
              onScroll={handleScroll}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              onStartReached={handleStartReached}
              onEndReached={handleEndReached}
              onLayout={handleLayout}
              onContentSizeChange={handleContentSizeChange}
              extraData={listExtraData}
            />

            {isLoadingTop && features.showTopLoadingIndicator && (
              <View style={[ss.topSpinner, { top: 12 + collectionInsetTop }]}>
                <ActivityIndicator size="small" />
              </View>
            )}

            <EmptyStateOverlay
              visible={data.messages.length === 0}
              loading={isLoading}
              text={emptyStateText}
            />
          </Animated.View>

          {features.showInputBar && (
            <KeyboardInputBar style={keyboard.barStyle}>
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
            bottomInset={keyboard.barOffset}
            inputBarHeight={keyboard.barHeight}
            isNearEnd={isNearEnd}
            expanded={fabExpanded}
            hiddenForRecording={fabHiddenForRecording}
            isLoading={isLoadingFab}
            unreadCount={unread.count}
            onPress={handleFabPress}
          />
        </View>
      </ChatViewContext.Provider>
    );
  }),
);

JsChatView.displayName = "JsChatView";

/** Длительность половины кросс-фейда при смене темы (мс). */
const CROSSFADE_MS = 125;

/** Пустой массив-константа: смена ссылки заставила бы список пересчитать sticky. */
const NO_STICKY_INDICES: number[] = [];

const ss = StyleSheet.create({
  // И вью, и коллекция, и панель ввода прозрачные — фон чата рисует хост.
  // Оверлеи не должны вылезать за границы чата.
  root: { flex: 1, backgroundColor: "transparent", overflow: "hidden" },
  listWrap: { flex: 1 },
  topSpinner: { position: "absolute", left: 0, right: 0, alignItems: "center" },
});
