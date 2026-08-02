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
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useScrollViewOffset,
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
  ChatAvatarLayer,
  ChatAvatarStore,
  ChatCellStore,
  ChatFab,
  ChatList,
  ChatOverlayStore,
  ChatViewContext,
  DisintegrationOverlay,
  EmptyStateOverlay,
  FloatingDateOverlay,
  IChatViewContextValue,
} from "./components";
import { createChatStyles } from "./config";
import { EMPTY_CHAT_DATA, IChatData } from "./data";
import {
  useChatAvatars,
  useChatCellDelegate,
  useChatCommands,
  useChatConfig,
  useChatData,
  useChatDisintegration,
  useChatEmptyState,
  useChatExternalUnread,
  useChatFloatingDate,
  useChatGeometry,
  useChatInitialScroll,
  useChatInputBar,
  useChatMessageUpdates,
  useChatOverlays,
  useChatPagination,
  useChatScroll,
  useChatScrollAnchor,
  useChatVisibility,
  useParsedMessages,
} from "./hooks";
import { ChatUnreadManager } from "./services";
import { ChatViewProps, IChatViewRef } from "./types";

/**
 * React Native-реализация ChatView на `@legendapp/list`.
 *
 * Компонент намеренно тонкий: он только собирает независимые части и связывает
 * их проводами. Логика живёт рядом —
 *
 * - `config/` — тема, метрики, флаги и готовые стили ячеек;
 * - `data/` — разбор сообщений, строки, диффы, план обновления;
 * - `scroll/` — геометрия, якорь, видимость, плавающая дата, аватары;
 * - `services/` — плеер голосовых и счётчик непрочитанных;
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

    // Пропы читаются из ref всеми стабильными колбэками: обработчик скролла не
    // должен пересоздаваться из-за смены любого коллбэка хоста.
    const propsRef = useRef(props);

    propsRef.current = props;

    const { theme, layout, features, getTheme, getLayout, getFeatures } =
      useChatConfig(props);

    // ─── Долгоживущие объекты ────────────────────────────────────────────

    const listRef = useRef<LegendListRef>(null);
    const rootRef = useRef<View>(null);
    const inputBarRef = useRef<IInputBarViewRef>(null);

    const storesRef = useRef<{
      cell: ChatCellStore;
      overlay: ChatOverlayStore;
      avatar: ChatAvatarStore;
      unread: ChatUnreadManager;
    } | null>(null);

    if (!storesRef.current) {
      storesRef.current = {
        cell: new ChatCellStore(),
        overlay: new ChatOverlayStore(),
        avatar: new ChatAvatarStore(),
        unread: new ChatUnreadManager(),
      };
    }

    const {
      cell: cellStore,
      overlay: overlayStore,
      avatar: avatarStore,
      unread: unreadManager,
    } = storesRef.current;

    // Контейнер данных создаётся до потребителей: команды и якорь нужны раньше,
    // чем посчитаны строки, а им достаточно стабильной ссылки.
    const dataRef = useRef<IChatData>(EMPTY_CHAT_DATA);

    // Ширина списка нужна ячейкам для расчёта максимальной ширины пузыря —
    // единственная величина геометрии, попадающая в рендер.
    const [listWidth, setListWidth] = useState(0);

    // ─── Геометрия ───────────────────────────────────────────────────────

    const geometry = useChatGeometry(listRef);
    const readGeometry = geometry.read;

    const parsed = useParsedMessages(messages, getActionsForMessage);

    // ─── Клавиатура ──────────────────────────────────────────────────────
    // Одна зона на всех потребителей: панель ввода, FAB и нижний инсет списка.

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
      initialBarHeight: layout.inputBarMinHeight,
      onBlur: handleKeyboardBlur,
      onRefocus: handleKeyboardRefocus,
    });

    // Компенсация скролла — отдельный хук: получает инсеты от useKeyboardInset.
    const compensation = useKeyboardScrollCompensation(
      keyboard.contentInset,
      keyboard.reservedInset,
    );

    // Позиции sticky-аватаров считаются на UI-потоке от живого скролла,
    // поэтому нужен scrollY в shared value, а не из JS-обработчика.
    const avatarScrollY = useScrollViewOffset(compensation.scrollRef);
    const avatarViewportHeight = useSharedValue(0);

    const { barHeight, freeze, restore } = keyboard;

    // ─── Скролл, якорь, команды ──────────────────────────────────────────

    const getScrollToBottomThreshold = useCallback(
      () => getFeatures().scrollToBottomThreshold,
      [getFeatures],
    );

    // Остановка скролла — единая точка: финальный якорь плюс применение
    // отложенного структурного обновления. Обработчики появляются ниже,
    // поэтому связь через ref.
    const settleRef = useRef<() => void>(() => {});
    const handleSettled = useCallback(() => settleRef.current(), []);

    const scroll = useChatScroll({
      readGeometry,
      getScrollToBottomThreshold,
      onSettled: handleSettled,
    });

    const commands = useChatCommands({
      listRef,
      readGeometry,
      data: dataRef,
      scroll,
      cellStore,
      getBottomInset: keyboard.getContentInset,
    });

    const handleAnchorChange = useCallback(
      (
        anchor: Parameters<
          NonNullable<ChatViewProps["onScrollAnchorChanged"]>
        >[0],
      ) => {
        propsRef.current.onScrollAnchorChanged?.(anchor);
      },
      [],
    );

    const anchor = useChatScrollAnchor({
      readGeometry,
      data: dataRef,
      scroll,
      getScrollToBottomThreshold,
      onChange: handleAnchorChange,
    });

    // ─── Обновления данных ───────────────────────────────────────────────

    const playDisintegration = useChatDisintegration({
      rootRef,
      cellStore,
      overlayStore,
      getTheme,
    });

    const isDisintegrationEnabled = useCallback(
      () => getFeatures().disintegrationEnabled,
      [getFeatures],
    );

    const { displayed, flushDeferred } = useChatMessageUpdates({
      parsed,
      scroll,
      anchor,
      commands,
      unreadManager,
      isDisintegrationEnabled,
      playDisintegration,
    });

    const data = useChatData(displayed, {
      features,
      showBottomLoading: isLoadingBottom && features.showBottomLoadingIndicator,
      hideFirstSeparator: isLoadingTop,
    });

    dataRef.current = data;

    settleRef.current = () => {
      anchor.reportSettled();
      flushDeferred();
    };

    // ─── Оверлеи ─────────────────────────────────────────────────────────

    const isFabLoading = useCallback(
      () => propsRef.current.isLoadingFab === true,
      [],
    );
    const isFabEnabled = useCallback(
      () => getFeatures().showFab,
      [getFeatures],
    );
    const getDisplayed = useCallback(() => dataRef.current.parsed, []);

    const overlays = useChatOverlays({
      store: overlayStore,
      unreadManager,
      isNearBottom: scroll.isNearBottom,
      getDisplayed,
      isFabLoading,
      isFabEnabled,
    });

    useChatEmptyState(
      overlayStore,
      displayed.length === 0,
      isLoading,
      emptyStateText,
    );
    useChatExternalUnread(unreadManager, unreadCount);

    // При загрузке FAB показан принудительно.
    useEffect(() => {
      overlayStore.set({ fabLoading: isLoadingFab });

      if (isLoadingFab) {
        overlayStore.set({ fabVisible: true });
      } else {
        overlays.updateFab();
      }
    }, [isLoadingFab, overlayStore, overlays]);

    // Без записи голоса FAB всегда развёрнут.
    useEffect(() => {
      if (!features.showVoiceRecording) overlays.setFabExpanded(true);
    }, [features.showVoiceRecording, overlays]);

    // Хост ответил на нижнюю пагинацию — снимаем защёлку.
    useEffect(() => {
      if (!isLoadingBottom) scroll.state.current.isLoadingNewerActive = false;
    }, [isLoadingBottom, scroll]);

    // ─── Плавающая дата ──────────────────────────────────────────────────

    const getSeparators = useCallback(() => dataRef.current.dateSeparators, []);
    const isFloatingDateEnabled = useCallback(
      () => getFeatures().showFloatingDate,
      [getFeatures],
    );
    const hasMessages = useCallback(
      () => dataRef.current.parsed.length > 0,
      [],
    );
    const getTopInset = useCallback(
      () => propsRef.current.collectionInsetTop ?? 0,
      [],
    );

    const updateFloatingDate = useChatFloatingDate({
      readGeometry,
      getSeparators,
      getLayout,
      isEnabled: isFloatingDateEnabled,
      hasMessages,
      getTopInset,
      store: overlayStore,
    });

    // ─── Sticky-аватары ──────────────────────────────────────────────────

    const getAvatarGroups = useCallback(() => dataRef.current.avatarGroups, []);
    const isAvatarsEnabled = useCallback(
      () => getFeatures().showAvatars,
      [getFeatures],
    );
    const getAvatarSize = useCallback(
      () => getLayout().avatarSize,
      [getLayout],
    );

    const updateAvatars = useChatAvatars({
      store: avatarStore,
      readGeometry,
      getGroups: getAvatarGroups,
      isEnabled: isAvatarsEnabled,
      getAvatarSize,
      getTopInset,
      getBottomInset: keyboard.getContentInset,
    });

    // ─── Видимость ───────────────────────────────────────────────────────

    const getRows = useCallback(() => dataRef.current.rows, []);

    const getThresholds = useCallback(
      () => ({
        enterThreshold: propsRef.current.visibilityThreshold ?? 0.8,
        // Порог выхода (0.5 при входе 0.8): выход всегда ниже
        // входа — гистерезис гасит дребезг на границе порога.
        exitThreshold: (propsRef.current.visibilityThreshold ?? 0.8) * 0.625,
        unreadThreshold: propsRef.current.unreadVisibilityThreshold ?? 0.5,
        visibleThrottleMs:
          (propsRef.current.visibleMessagesThrottleInterval ?? 0.3) * 1000,
        unreadDebounceMs:
          (propsRef.current.unreadMessagesDebounceInterval ?? 0.3) * 1000,
      }),
      [],
    );

    // scroll.isNearBottom пересоздаётся, а колбэки видимости обязаны быть
    // стабильными — иначе трекер терял бы состояние гистерезиса.
    const isNearBottomRef = useRef(scroll.isNearBottom);

    isNearBottomRef.current = scroll.isNearBottom;

    const handleVisibleChange = useCallback((messageIds: string[]) => {
      propsRef.current.onVisibleMessagesChange?.({
        messageIds,
        isAtBottom: isNearBottomRef.current(),
      });
    }, []);

    const handleUnreadAppear = useCallback((messageIds: string[]) => {
      propsRef.current.onUnreadMessagesAppear?.({ messageIds });
    }, []);

    const handleMarkAsRead = useCallback(
      (ids: Set<string>) => unreadManager.markAsRead(ids),
      [unreadManager],
    );

    const visibility = useChatVisibility({
      readGeometry,
      getRows,
      getThresholds,
      onVisibleChange: handleVisibleChange,
      onUnreadAppear: handleUnreadAppear,
      onMarkAsRead: handleMarkAsRead,
    });

    // ─── Пагинация ───────────────────────────────────────────────────────

    const getPaginationFlags = useCallback(
      () => ({
        hasMore: propsRef.current.hasMore === true,
        hasNewer: propsRef.current.hasNewer === true,
        isLoadingTop: propsRef.current.isLoadingTop === true,
        isLoadingBottom: propsRef.current.isLoadingBottom === true,
        hasMessages: dataRef.current.parsed.length > 0,
      }),
      [],
    );

    const handleReachTop = useCallback((distanceFromTop: number) => {
      propsRef.current.onReachTop?.({ distanceFromTop });
    }, []);

    const handleReachBottom = useCallback((distanceFromBottom: number) => {
      propsRef.current.onReachBottom?.({ distanceFromBottom });
    }, []);

    const checkPagination = useChatPagination({
      scroll,
      getFeatures,
      getFlags: getPaginationFlags,
      onReachTop: handleReachTop,
      onReachBottom: handleReachBottom,
    });

    // ─── Обработчик скролла ──────────────────────────────────────────────

    const lastScrollEventAtRef = useRef(0);

    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } =
          event.nativeEvent;
        const y = contentOffset.y;

        scroll.trackDirection(y);

        // Троттлинг по layout.scrollThrottleInterval.
        const now = Date.now();

        if (
          now - lastScrollEventAtRef.current >=
          getLayout().scrollThrottleInterval * 1000
        ) {
          lastScrollEventAtRef.current = now;
          propsRef.current.onScroll?.({
            x: contentOffset.x,
            y,
            isAtBottom: scroll.isNearBottom(),
          });
        }

        checkPagination(y, contentSize.height, layoutMeasurement.height);

        overlays.updateFab();
        updateFloatingDate();
        updateAvatars();
        // Доля видимости меняется непрерывно — список сам об этом не сообщит.
        visibility.recompute();
        anchor.reportThrottled();
      },
      [
        scroll,
        getLayout,
        checkPagination,
        overlays,
        updateFloatingDate,
        updateAvatars,
        visibility,
        anchor,
      ],
    );

    const handleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;

        compensation.onLayout(event);
        geometry.setViewport(width, height);
        avatarViewportHeight.value = height;
        setListWidth(prev => (prev === width ? prev : width));
      },
      [compensation, geometry, avatarViewportHeight],
    );

    const handleContentSizeChange = useCallback(
      (width: number, height: number) => {
        compensation.onContentSizeChange(width, height);
      },
      [compensation],
    );

    // Компенсация обязана знать про палец на экране: пока идёт жест, позицию
    // она не трогает позицию, пока палец на экране.
    const handleScrollBeginDrag = useCallback(() => {
      compensation.onScrollBeginDrag();
      scroll.onBeginDrag();
    }, [compensation, scroll]);

    const handleScrollEndDrag = useCallback(() => {
      compensation.onScrollEndDrag();
      scroll.onEndDrag();
    }, [compensation, scroll]);

    // ─── Начальная позиция ───────────────────────────────────────────────

    const handleInitialReady = useCallback(() => {
      overlays.updateFab();
      updateFloatingDate();
      updateAvatars();
      visibility.recompute();
    }, [overlays, updateFloatingDate, updateAvatars, visibility]);

    const initialScroll = useChatInitialScroll({
      anchor: initialScrollAnchor,
      data: dataRef,
      scroll,
      onReady: handleInitialReady,
    });

    // Аватары зависят от строк, а не только от скролла: после обновления
    // данных группы смещаются даже при неподвижном списке.
    useEffect(() => updateAvatars(), [data, updateAvatars]);

    // ─── Императивный интерфейс ──────────────────────────────────────────

    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom: () => commands.scrollToBottom(true),
        scrollToMessage: commands.scrollToMessage,
        clearUnread: () => unreadManager.clearAll(),
      }),
      [commands, unreadManager],
    );

    // ─── Делегаты ────────────────────────────────────────────────────────

    const delegate = useChatCellDelegate({
      props: propsRef,
      commands,
      freezeKeyboard: freeze,
      restoreKeyboard: restore,
    });

    const inputBar = useChatInputBar({
      inputAction,
      messageIndex: data.messageIndex,
      props: propsRef,
      scroll,
      overlays,
      getFeatures,
      barHeight,
    });

    const handleFabPress = useCallback(() => {
      propsRef.current.onFabPress?.({});
    }, []);

    // ─── Контексты ───────────────────────────────────────────────────────

    const styles = useMemo(
      () => createChatStyles(theme, layout),
      [theme, layout],
    );

    const chatContext = useMemo<IChatViewContextValue>(
      () => ({
        theme,
        layout,
        features,
        styles,
        listWidth,
        delegate,
        cellStore,
      }),
      [theme, layout, features, styles, listWidth, delegate, cellStore],
    );

    // Ключи темы и метрик у панели ввода совпадают 1:1 (inputBackground,
    // inputButtonSize…), поэтому передаются те же объекты — панель просто
    // читает из них свои ключи.
    const inputBarContext = useMemo(
      () => ({
        theme,
        layout,
        features: INPUT_BAR_DEFAULT_FEATURES,
        styles: createInputBarStyles(theme, layout),
      }),
      [theme, layout],
    );

    const listExtraData = useMemo(
      () => ({ styles, features, listWidth }),
      [styles, features, listWidth],
    );

    // Смена темы или метрик проявляется через
    // короткий кросс-фейд, а не мгновенной перекраской списка.
    const crossfade = useSharedValue(1);
    const isFirstStyles = useRef(true);

    useEffect(() => {
      if (isFirstStyles.current) {
        isFirstStyles.current = false;

        return;
      }
      crossfade.value = withSequence(
        withTiming(0, { duration: 125 }),
        withTiming(1, { duration: 125 }),
      );
    }, [styles, crossfade]);

    const listWrapStyle = useAnimatedStyle(() => ({
      opacity: crossfade.value,
    }));

    return (
      <ChatViewContext.Provider value={chatContext}>
        <View ref={rootRef} collapsable={false} style={[ss.root, style]}>
          <Animated.View style={[ss.listWrap, listWrapStyle]}>
            <ChatList
              ref={listRef}
              rows={data.rows}
              scrollRef={compensation.scrollRef}
              bottomSpacerStyle={compensation.spacerStyle}
              contentPaddingTop={
                layout.collectionTopPadding + collectionInsetTop
              }
              initialScrollIndex={initialScroll.initialScrollIndex}
              initialScrollAtEnd={initialScroll.initialScrollAtEnd}
              estimatedItemSize={layout.estimatedRowHeight}
              drawDistance={layout.drawDistance}
              onLoad={initialScroll.onLoad}
              onScroll={handleScroll}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              onMomentumScrollEnd={scroll.onMomentumEnd}
              onLayout={handleLayout}
              onContentSizeChange={handleContentSizeChange}
              onViewableItemsChanged={visibility.onViewableItemsChanged}
              extraData={listExtraData}
            />

            <ChatAvatarLayer
              store={avatarStore}
              scrollY={avatarScrollY}
              viewportHeight={avatarViewportHeight}
              bottomInset={keyboard.contentInset}
            />

            {isLoadingTop && features.showTopLoadingIndicator && (
              <View style={[ss.topSpinner, { top: 12 + collectionInsetTop }]}>
                <ActivityIndicator size="small" />
              </View>
            )}

            <EmptyStateOverlay store={overlayStore} />
            <FloatingDateOverlay
              store={overlayStore}
              topInset={collectionInsetTop}
            />
            <DisintegrationOverlay store={overlayStore} />
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
            store={overlayStore}
            bottomInset={keyboard.barOffset}
            inputBarHeight={barHeight}
            onPress={handleFabPress}
          />
        </View>
      </ChatViewContext.Provider>
    );
  }),
);

JsChatView.displayName = "JsChatView";

const ss = StyleSheet.create({
  // И вью, и коллекция, и панель ввода прозрачные —
  // фон чата рисует хост. Оверлеи не должны вылезать за границы чата.
  root: { flex: 1, backgroundColor: "transparent", overflow: "hidden" },
  listWrap: { flex: 1 },
  topSpinner: { position: "absolute", left: 0, right: 0, alignItems: "center" },
});
