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
  Dimensions,
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
import { ChatFab, ChatList, EmptyStateOverlay } from "./components";
import { EMPTY_CHAT_DATA, IChatData } from "./data";
import {
  useChatCellActions,
  useChatConfig,
  useChatData,
  useChatInputBar,
  useChatScrollControl,
  useChatScrollReport,
  useChatStickyDate,
  useChatUnread,
  useChatViewability,
} from "./hooks";
import {
  ChatHighlightStore,
  ChatViewContext,
  IChatViewContextValue,
} from "./model";
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
 * - `model/` — контекст и стор подсветки;
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
      showBottomLoading:
        isLoadingBottom &&
        features.showBottomLoadingIndicator &&
        messages.length > 0,
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

    const scrollControl = useChatScrollControl({
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
      getBottomInset: keyboard.getContentInset,
    });

    // Высота вьюпорта нужна, чтобы перевести пороги из пикселей в доли экрана.
    // Стартовое значение — высота окна, а не 0: до первого layout нулевая
    // высота давала бы долю 0.5, то есть «полэкрана» и для пагинации, и для
    // прижатия к низу — на первом же кадре это дёргает позицию и шлёт лишние
    // запросы на догрузку.
    const [viewportHeight, setViewportHeight] = useState(
      () => Dimensions.get("window").height,
    );

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

    const asFraction = (px: number) => px / viewportHeight;

    // Верхний паддинг контента. Участвует и в разметке списка, и в расчёте
    // начальной позиции — поэтому одна переменная, а не два выражения.
    const contentPaddingTop = layout.collectionTopPadding + collectionInsetTop;

    // ─── Начальная позиция ───────────────────────────────────────────────
    // Берётся один раз на монтировании: дальше позицией управляет пользователь.

    const initialScrollIndex = useMemo(() => {
      const anchor = initialScrollAnchor;

      if (!anchor || anchor.wasAtBottom) return undefined;

      const index = dataRef.current.rowIndexOf(anchor.messageId);

      if (index == null) return undefined;

      // Якорь описывает расстояние от нижнего края **видимой** области до
      // нижнего края строки. Нижняя зона у нас — распорка в конце контента, а
      // не `contentInset`, поэтому список о ней не знает: её высоту добавляем
      // сами (нативная реализация делает это слагаемым `+ contentInset.bottom`).
      // Величина берётся та же, что при сохранении якоря, — иначе теряется
      // нижний safe area, и чат открывается на его высоту мимо.
      //
      // Второе слагаемое — верхний паддинг контента. При `viewPosition: 1`
      // список считает смещение так:
      //
      //   result = position − viewOffset + topOffsetAdjustment
      //          + itemSize + trailingInset − scrollLength
      //
      // где `topOffsetAdjustment = stylePaddingTop + headerSize + …`. В якоре
      // этого слагаемого нет — `positionAtIndex` паддинг не включает, — и без
      // компенсации каждое открытие уводило позицию ровно на `paddingTop`.
      // Ошибка накапливалась: восстановленная позиция становится следующей
      // сохранённой.
      return {
        index,
        viewPosition: 1,
        viewOffset:
          -(anchor.offset + keyboard.getContentInset()) + contentPaddingTop,
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Декларативный `initialScrollIndex` считается по оценочным высотам строк,
    // поэтому подводит близко, но не точно. Когда список отрисовал первый кадр
    // и знает реальные высоты — доуточняем позицию по тому же якорю. Ровно так
    // же поступает нативная реализация: она скроллит после `layoutIfNeeded()`.
    const didAlignRef = useRef(false);

    const handleLoad = useCallback(() => {
      if (didAlignRef.current) return;

      const anchor = initialScrollAnchor;

      didAlignRef.current = true;

      if (!anchor || anchor.wasAtBottom) return;

      scrollControl.alignMessageToBottom(anchor.messageId, anchor.offset);
      // Якорь читается один раз, на монтировании: дальше позицией управляет
      // пользователь, и повторное выравнивание вырвало бы её из-под пальца.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scrollControl]);

    // ─── Императивный интерфейс ──────────────────────────────────────────

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

    // ─── Действия ячейки и панель ввода ──────────────────────────────────

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
        actions: cellActions,
        highlight,
        stickyDate,
      }),
      [
        theme,
        layout,
        inputBarLayout,
        features,
        styles,
        cellActions,
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
              contentPaddingTop={contentPaddingTop}
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
              onLoad={handleLoad}
              onScroll={handleScroll}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              onStartReached={handleStartReached}
              onEndReached={handleEndReached}
              onLayout={handleLayout}
              onContentSizeChange={handleContentSizeChange}
              extraData={listExtraData}
            />

            {isLoadingTop &&
              features.showTopLoadingIndicator &&
              data.messages.length > 0 && (
                <View style={[ss.topSpinner, { top: 12 + collectionInsetTop }]}>
                  <ActivityIndicator size="small" />
                </View>
              )}

            <EmptyStateOverlay
              visible={data.messages.length === 0}
              loading={isLoading}
              text={emptyStateText}
              bottomInset={keyboard.contentInset}
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
            hasMessages={data.messages.length > 0}
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
