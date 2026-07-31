import {
  FlashList,
  FlashListProps,
  FlashListRef,
  ListRenderItemInfo,
} from "@shopify/flash-list";
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
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ChatInputBar,
  IChatInputBarDelegate,
  IChatInputBarRef,
} from "../input-bar/ChatInputBar";
import { ChatInputMode } from "../input-bar/input-bar-types";
import { ChatOverlayStore } from "./components/chat-overlay-store";
import {
  ChatCellStore,
  ChatViewContext,
  IChatCellDelegate,
  IChatViewContextValue,
} from "./components/chat-view-context";
import { ChatFab } from "./components/ChatFab";
import { DateSeparatorRow } from "./components/DateSeparatorRow";
import { DisintegrationOverlay } from "./components/DisintegrationOverlay";
import { EmptyStateOverlay } from "./components/EmptyStateOverlay";
import { FloatingDateOverlay } from "./components/FloatingDateOverlay";
import { LoadingRow } from "./components/LoadingRow";
import { MessageCell } from "./components/MessageCell";
import { IResolvedReply } from "./components/ReplyPreview";
import {
  buildChatRows,
  ChatRow,
  chatRowKey,
  ChatUnreadManager,
  chatVoicePlayer,
  deletedMessageIds,
  getSectionTitle,
  IParsedChatMessage,
  isAppendOnly,
  parseChatMessage,
  resolveChatFeatures,
  resolveChatLayout,
  resolveChatTheme,
} from "./model";
import { ChatViewProps, IChatViewRef } from "./types";

type ViewabilityPairs = NonNullable<
  FlashListProps<ChatRow>["viewabilityConfigCallbackPairs"]
>;

/**
 * React Native-реализация ChatView — порт ChatViewController (IOSChatView)
 * на @shopify/flash-list: диff-стратегии через стабильные ключи
 * (localId → pending→real), maintainVisibleContentPosition (prepend/append),
 * пагинация, видимость (throttle/debounce), якорь скролла, FAB, плавающая
 * дата, разделители дат, пустое состояние, контекстное меню, панель ввода,
 * эффект распада при удалении.
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
      theme: themeName = "light",
      style,
      collectionInsetTop = 0,
      collectionInsetBottom = 0,
      visibilityThreshold = 0.8,
      unreadVisibilityThreshold = 0.5,
      unreadCount = -1,
      features: featuresProp,
      layout: layoutProp,
      emojiReactions,
      showSenderName,
      showFloatingDate,
      topThreshold,
      bottomThreshold,
      scrollToBottomThreshold,
    } = props;

    const propsRef = useRef(props);

    propsRef.current = props;

    // ─── Конфигурация ────────────────────────────────────────────────────────

    const theme = useMemo(() => resolveChatTheme(themeName), [themeName]);
    const layout = useMemo(() => resolveChatLayout(layoutProp), [layoutProp]);
    const features = useMemo(
      () =>
        resolveChatFeatures({
          features: featuresProp,
          emojiReactions,
          showSenderName,
          showFloatingDate,
          topThreshold,
          bottomThreshold,
          scrollToBottomThreshold,
        }),
      [
        featuresProp,
        emojiReactions,
        showSenderName,
        showFloatingDate,
        topThreshold,
        bottomThreshold,
        scrollToBottomThreshold,
      ],
    );

    const featuresRef = useRef(features);

    featuresRef.current = features;

    const layoutRef = useRef(layout);

    layoutRef.current = layout;

    // ─── Данные ──────────────────────────────────────────────────────────────

    const parsedMessages = useMemo(() => {
      const source = getActionsForMessage
        ? messages.map(msg => ({ ...msg, actions: getActionsForMessage(msg) }))
        : messages;

      return source
        .map(parseChatMessage)
        .sort((a, b) => a.timestamp - b.timestamp);
    }, [messages, getActionsForMessage]);

    // Отображаемые сообщения — отстают от пропа на время эффекта распада.
    const [displayedMessages, setDisplayedMessages] = useState(parsedMessages);

    const displayedRef = useRef(displayedMessages);

    displayedRef.current = displayedMessages;

    const messageIndex = useMemo(() => {
      const map = new Map<string, IParsedChatMessage>();

      for (const msg of displayedMessages) {
        map.set(msg.id, msg);
      }

      return map;
    }, [displayedMessages]);

    const messageIndexRef = useRef(messageIndex);

    messageIndexRef.current = messageIndex;

    const rows = useMemo(
      () =>
        buildChatRows({
          messages: displayedMessages,
          showDateSeparators: features.showDateSeparators,
          showBottomLoading:
            isLoadingBottom && features.showBottomLoadingIndicator,
        }),
      [
        displayedMessages,
        features.showDateSeparators,
        isLoadingBottom,
        features.showBottomLoadingIndicator,
      ],
    );

    const rowsRef = useRef(rows);

    rowsRef.current = rows;

    const rowIndexById = useMemo(() => {
      const map = new Map<string, number>();

      rows.forEach((row, i) => {
        if (row.type === "message") map.set(row.message.id, i);
      });

      return map;
    }, [rows]);

    const rowIndexByIdRef = useRef(rowIndexById);

    rowIndexByIdRef.current = rowIndexById;

    const dateSeparators = useMemo(() => {
      const result: { rowIndex: number; groupDate: string }[] = [];

      rows.forEach((row, i) => {
        if (row.type === "dateSeparator") {
          result.push({ rowIndex: i, groupDate: row.groupDate });
        }
      });

      return result;
    }, [rows]);

    const dateSeparatorsRef = useRef(dateSeparators);

    dateSeparatorsRef.current = dateSeparators;

    // ─── Сторы и ссылки ──────────────────────────────────────────────────────

    const listRef = useRef<FlashListRef<ChatRow>>(null);
    const rootRef = useRef<View>(null);
    const inputBarRef = useRef<IChatInputBarRef>(null);

    const cellStoreRef = useRef<ChatCellStore | null>(null);

    if (!cellStoreRef.current) cellStoreRef.current = new ChatCellStore();

    const overlayStoreRef = useRef<ChatOverlayStore | null>(null);

    if (!overlayStoreRef.current)
      overlayStoreRef.current = new ChatOverlayStore();

    const cellStore = cellStoreRef.current;
    const overlayStore = overlayStoreRef.current;

    const unreadManagerRef = useRef<ChatUnreadManager | null>(null);

    if (!unreadManagerRef.current) {
      unreadManagerRef.current = new ChatUnreadManager();
      unreadManagerRef.current.onCountChanged = count =>
        overlayStore.set({ unreadCount: count });
    }

    const unreadManager = unreadManagerRef.current;

    // ─── Состояние скролла (refs — без ре-рендеров) ──────────────────────────

    const [listSize, setListSize] = useState({ width: 0, height: 0 });
    const listSizeRef = useRef(listSize);

    listSizeRef.current = listSize;

    const scrollYRef = useRef(0);
    const contentHeightRef = useRef(0);
    const scrollDirectionRef = useRef<"up" | "down" | "none">("none");
    const isUserDraggingRef = useRef(false);
    const isProgrammaticScrollRef = useRef(false);
    const isInitialScrollProtectedRef = useRef(true);
    const pendingScrollToBottomRef = useRef(false);
    const isLoadingNewerActiveRef = useRef(false);
    const lastScrollEventTimeRef = useRef(0);
    const anchorThrottleTimeRef = useRef(0);
    const lastTypingTimeRef = useRef(0);

    const distanceFromBottom = useCallback(() => {
      return Math.max(
        0,
        contentHeightRef.current -
          scrollYRef.current -
          listSizeRef.current.height,
      );
    }, []);

    const isNearBottom = useCallback(() => {
      if (contentHeightRef.current <= 0) return true;

      return (
        distanceFromBottom() <= featuresRef.current.scrollToBottomThreshold
      );
    }, [distanceFromBottom]);

    // ─── FAB ─────────────────────────────────────────────────────────────────

    const updateFabVisibility = useCallback(() => {
      if (propsRef.current.isLoadingFab) return;
      overlayStore.set({
        fabVisible: !isNearBottom() && displayedRef.current.length > 0,
      });
    }, [overlayStore, isNearBottom]);

    useEffect(() => {
      overlayStore.set({ fabLoading: isLoadingFab });
      if (isLoadingFab) {
        overlayStore.set({ fabVisible: true });
      } else {
        updateFabVisibility();
      }
    }, [isLoadingFab, overlayStore, updateFabVisibility]);

    useEffect(() => {
      if (!features.showVoiceRecording) {
        overlayStore.set({ fabExpanded: true });
      }
    }, [features.showVoiceRecording, overlayStore]);

    // ─── Пустое состояние ────────────────────────────────────────────────────

    useEffect(() => {
      overlayStore.set({
        emptyVisible: displayedMessages.length === 0,
        emptyLoading: isLoading,
        emptyText: emptyStateText ?? null,
      });
    }, [displayedMessages.length, isLoading, emptyStateText, overlayStore]);

    // ─── Непрочитанные (внешнее управление) ──────────────────────────────────

    useEffect(() => {
      if (unreadCount >= 0) {
        unreadManager.setExternalCount(unreadCount);
      }
    }, [unreadCount, unreadManager]);

    useEffect(() => {
      if (!isLoadingBottom) {
        isLoadingNewerActiveRef.current = false;
      }
    }, [isLoadingBottom]);

    // ─── Плавающая дата ──────────────────────────────────────────────────────

    const floatingHideTimer = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const currentFloatingDate = useRef<string | null>(null);

    const updateFloatingDate = useCallback(() => {
      if (
        !featuresRef.current.showFloatingDate ||
        displayedRef.current.length === 0
      ) {
        overlayStore.set({ floatingDateVisible: false });

        return;
      }

      const list = listRef.current;

      if (!list) return;

      const L = layoutRef.current;
      const pillRestY = L.sectionSpacing;
      const spacing = L.sectionSpacing;
      const scrollY = scrollYRef.current;

      let foundDate: string | null = null;

      for (const sep of dateSeparatorsRef.current) {
        const rect = list.getLayout(sep.rowIndex);

        if (!rect) continue;

        const maxY = rect.y + rect.height - scrollY;

        if (maxY < pillRestY - spacing + L.collectionTopPadding) {
          foundDate = sep.groupDate;
        }
      }

      if (!foundDate) {
        currentFloatingDate.current = null;
        overlayStore.set({ floatingDateVisible: false });

        return;
      }

      if (foundDate !== currentFloatingDate.current) {
        currentFloatingDate.current = foundDate;
        overlayStore.set({ floatingDateTitle: getSectionTitle(foundDate) });
      }

      overlayStore.set({ floatingDateVisible: true });

      if (floatingHideTimer.current) clearTimeout(floatingHideTimer.current);
      floatingHideTimer.current = setTimeout(() => {
        overlayStore.set({ floatingDateVisible: false });
      }, L.floatingDateHideDelay * 1000);
    }, [overlayStore]);

    useEffect(
      () => () => {
        if (floatingHideTimer.current) clearTimeout(floatingHideTimer.current);
      },
      [],
    );

    // ─── Якорь скролла ───────────────────────────────────────────────────────

    const computeScrollAnchor = useCallback(() => {
      const displayed = displayedRef.current;

      if (displayed.length === 0) return null;

      if (isNearBottom()) {
        return {
          messageId: displayed[displayed.length - 1].id,
          offset: 0,
          wasAtBottom: true,
        };
      }

      const list = listRef.current;

      if (!list) return null;

      const { startIndex, endIndex } = list.computeVisibleIndices();

      if (startIndex < 0 || endIndex < 0) return null;

      const visibleBottom = scrollYRef.current + listSizeRef.current.height;
      const currentRows = rowsRef.current;

      for (let i = endIndex; i >= startIndex; i--) {
        const row = currentRows[i];

        if (!row || row.type !== "message") continue;

        const rect = list.getLayout(i);

        if (!rect) continue;

        const cellBottom = rect.y + rect.height;

        return {
          messageId: row.message.id,
          offset: visibleBottom - cellBottom,
          wasAtBottom: false,
        };
      }

      return null;
    }, [isNearBottom]);

    const reportScrollAnchorIfNeeded = useCallback(() => {
      if (isInitialScrollProtectedRef.current) return;
      if (isProgrammaticScrollRef.current) return;
      if (!isUserDraggingRef.current) return;

      const now = Date.now();

      if (now - anchorThrottleTimeRef.current < 300) return;
      anchorThrottleTimeRef.current = now;

      const anchor = computeScrollAnchor();

      if (anchor) {
        propsRef.current.onScrollAnchorChanged?.(anchor);
      }
    }, [computeScrollAnchor]);

    const reportScrollAnchorOnSettled = useCallback(() => {
      if (isInitialScrollProtectedRef.current) return;
      if (isProgrammaticScrollRef.current) return;

      anchorThrottleTimeRef.current = 0;

      const anchor = computeScrollAnchor();

      if (anchor) {
        propsRef.current.onScrollAnchorChanged?.(anchor);
      }
    }, [computeScrollAnchor]);

    // ─── Скролл + пагинация (порт scrollViewDidScroll) ───────────────────────

    const handleScroll = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
        const y = contentOffset.y;
        const prevY = scrollYRef.current;

        if (y > prevY + 1) {
          scrollDirectionRef.current = "down";
        } else if (y < prevY - 1) {
          scrollDirectionRef.current = "up";
        }
        scrollYRef.current = y;
        contentHeightRef.current = contentSize.height;

        const now = Date.now();
        const throttleMs = layoutRef.current.scrollThrottleInterval * 1000;

        if (now - lastScrollEventTimeRef.current >= throttleMs) {
          lastScrollEventTimeRef.current = now;
          propsRef.current.onScroll?.({
            x: contentOffset.x,
            y,
            isAtBottom: isNearBottom(),
          });
        }

        if (
          displayedRef.current.length === 0 ||
          isInitialScrollProtectedRef.current
        ) {
          updateFabVisibility();
          updateFloatingDate();

          return;
        }

        const f = featuresRef.current;

        if (
          scrollDirectionRef.current !== "down" &&
          y < f.topLoadThreshold &&
          propsRef.current.hasMore &&
          !propsRef.current.isLoadingTop
        ) {
          propsRef.current.onReachTop?.({ distanceFromTop: y });
        }

        const distanceToBottom =
          contentSize.height - y - layoutMeasurement.height;

        if (
          scrollDirectionRef.current !== "up" &&
          distanceToBottom < f.bottomLoadThreshold &&
          propsRef.current.hasNewer &&
          !propsRef.current.isLoadingBottom &&
          !isLoadingNewerActiveRef.current
        ) {
          isLoadingNewerActiveRef.current = true;
          propsRef.current.onReachBottom?.({
            distanceFromBottom: distanceToBottom,
          });
        }

        updateFabVisibility();
        updateFloatingDate();
        reportScrollAnchorIfNeeded();
      },
      [
        isNearBottom,
        updateFabVisibility,
        updateFloatingDate,
        reportScrollAnchorIfNeeded,
      ],
    );

    const handleScrollBeginDrag = useCallback(() => {
      isUserDraggingRef.current = true;
      pendingScrollToBottomRef.current = false;
    }, []);

    const handleScrollEndDrag = useCallback(() => {
      isUserDraggingRef.current = false;
      reportScrollAnchorOnSettled();
    }, [reportScrollAnchorOnSettled]);

    const handleMomentumScrollEnd = useCallback(() => {
      isProgrammaticScrollRef.current = false;
      reportScrollAnchorOnSettled();
    }, [reportScrollAnchorOnSettled]);

    // ─── Видимость сообщений (throttle) и непрочитанные (debounce) ───────────

    const latestVisibleIDsRef = useRef<string[]>([]);
    const lastFiredVisibleIDsRef = useRef<string>("");
    const lastVisibleThrottleTimeRef = useRef(0);
    const visibleThrottleTimer = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const pendingUnreadIDsRef = useRef<Set<string>>(new Set());
    const unreadDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    const fireVisibleSnapshot = useCallback(() => {
      const ids = latestVisibleIDsRef.current;

      if (ids.length === 0) return;

      const key = ids.join("|");

      if (key === lastFiredVisibleIDsRef.current) return;
      lastFiredVisibleIDsRef.current = key;
      propsRef.current.onVisibleMessagesChange?.({
        messageIds: ids,
        isAtBottom: isNearBottom(),
      });
    }, [isNearBottom]);

    const notifyVisibleMessages = useCallback(() => {
      const now = Date.now();
      const interval =
        (propsRef.current.visibleMessagesThrottleInterval ?? 0.3) * 1000;

      if (now - lastVisibleThrottleTimeRef.current >= interval) {
        lastVisibleThrottleTimeRef.current = now;
        fireVisibleSnapshot();
      } else if (!visibleThrottleTimer.current) {
        const remaining = interval - (now - lastVisibleThrottleTimeRef.current);

        visibleThrottleTimer.current = setTimeout(() => {
          lastVisibleThrottleTimeRef.current = Date.now();
          visibleThrottleTimer.current = null;
          fireVisibleSnapshot();
        }, remaining);
      }
    }, [fireVisibleSnapshot]);

    const notifyUnreadMessages = useCallback((newUnread: Set<string>) => {
      for (const id of newUnread) {
        pendingUnreadIDsRef.current.add(id);
      }
      if (unreadDebounceTimer.current) {
        clearTimeout(unreadDebounceTimer.current);
      }
      unreadDebounceTimer.current = setTimeout(
        () => {
          if (pendingUnreadIDsRef.current.size === 0) return;

          const batch = Array.from(pendingUnreadIDsRef.current);

          pendingUnreadIDsRef.current.clear();
          propsRef.current.onUnreadMessagesAppear?.({ messageIds: batch });
        },
        (propsRef.current.unreadMessagesDebounceInterval ?? 0.3) * 1000,
      );
    }, []);

    const seenUnreadIDsRef = useRef<Set<string>>(new Set());

    const viewabilityPairs = useRef<ViewabilityPairs>([
      {
        viewabilityConfig: {
          itemVisiblePercentThreshold: visibilityThreshold * 100,
          minimumViewTime: 0,
        },
        onViewableItemsChanged: info => {
          const ids: { index: number; id: string }[] = [];

          for (const token of info.viewableItems) {
            if (!token.isViewable || token.index == null) continue;

            const row = token.item;

            if (row?.type === "message") {
              ids.push({ index: token.index, id: row.message.id });
            }
          }
          ids.sort((a, b) => a.index - b.index);
          latestVisibleIDsRef.current = ids.map(v => v.id);
          if (latestVisibleIDsRef.current.length > 0) {
            notifyVisibleMessages();
          }
        },
      },
      {
        viewabilityConfig: {
          itemVisiblePercentThreshold: unreadVisibilityThreshold * 100,
          minimumViewTime: 0,
        },
        onViewableItemsChanged: info => {
          const newUnread = new Set<string>();

          for (const token of info.viewableItems) {
            if (!token.isViewable) continue;

            const row = token.item;

            if (
              row?.type === "message" &&
              row.message.ownership === "theirs" &&
              row.message.status !== "read" &&
              !seenUnreadIDsRef.current.has(row.message.id)
            ) {
              seenUnreadIDsRef.current.add(row.message.id);
              newUnread.add(row.message.id);
            }
          }

          if (newUnread.size > 0) {
            unreadManagerRef.current?.markAsRead(newUnread);
            notifyUnreadMessages(newUnread);
          }
        },
      },
    ]);

    useEffect(
      () => () => {
        if (visibleThrottleTimer.current) {
          clearTimeout(visibleThrottleTimer.current);
        }
        if (unreadDebounceTimer.current) {
          clearTimeout(unreadDebounceTimer.current);
        }
      },
      [],
    );

    // ─── Обновления сообщений (порт MessageUpdateHandler) ────────────────────

    const prevParsedRef = useRef<IParsedChatMessage[]>(parsedMessages);
    const burstKeyRef = useRef(0);

    useEffect(() => {
      const old = prevParsedRef.current;
      const next = parsedMessages;

      if (old === next) return;

      prevParsedRef.current = next;

      const wasAtBottom = isNearBottom();

      // Отслеживание непрочитанных при append не внизу
      if (
        old.length > 0 &&
        isAppendOnly(old, next) &&
        !wasAtBottom &&
        !pendingScrollToBottomRef.current
      ) {
        unreadManager.trackAppended(next, old.length);
      }

      // Эффект распада при удалениях
      const deleted =
        featuresRef.current.disintegrationEnabled && old.length > 0
          ? deletedMessageIds(old, next)
          : new Set<string>();

      if (deleted.size > 0) {
        const rootNode = rootRef.current;
        const bubbles: { id: string; msg: IParsedChatMessage }[] = [];

        for (const id of deleted) {
          const msg = old.find(m => m.id === id);

          if (msg && cellStore.bubbleRefs.has(id)) {
            bubbles.push({ id, msg });
          }
        }

        if (bubbles.length > 0 && rootNode) {
          rootNode.measureInWindow((rootX, rootY) => {
            for (const { id, msg } of bubbles) {
              const bubbleRef = cellStore.bubbleRefs.get(id);

              if (!bubbleRef) continue;

              bubbleRef.measureInWindow((x, y, width, height) => {
                if (width <= 0 || height <= 0) return;

                burstKeyRef.current += 1;

                let color = theme.incomingBubble;

                if (msg.ownership === "mine") color = theme.outgoingBubble;
                else if (msg.ownership === "system") color = theme.systemText;
                else if (msg.ownership === "pinned") color = theme.pinnedBubble;

                overlayStore.addBurst({
                  key: burstKeyRef.current,
                  frame: { x: x - rootX, y: y - rootY, width, height },
                  color,
                });
              });
            }
          });
          cellStore.hideBubbles(deleted);
          setTimeout(() => {
            cellStore.showBubbles(deleted);
            setDisplayedMessages(next);
          }, 150);

          return;
        }
      }

      setDisplayedMessages(next);
    }, [
      parsedMessages,
      unreadManager,
      cellStore,
      overlayStore,
      theme,
      isNearBottom,
    ]);

    // Отложенный скролл вниз после отправки собственного сообщения
    useEffect(() => {
      if (!pendingScrollToBottomRef.current) return;
      if (displayedMessages.length === 0) return;

      pendingScrollToBottomRef.current = false;
      isProgrammaticScrollRef.current = true;
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }, [displayedMessages]);

    useEffect(() => {
      updateFabVisibility();
    }, [displayedMessages, updateFabVisibility]);

    // ─── Начальный скролл ────────────────────────────────────────────────────

    const initialAnchorRef = useRef(initialScrollAnchor);

    const initialScrollIndex = useMemo(() => {
      const anchor = initialAnchorRef.current;

      if (!anchor || anchor.wasAtBottom) return undefined;

      const index = rowIndexById.get(anchor.messageId);

      return index;
      // Только при маунте — rows первого рендера
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLoad = useCallback(() => {
      const anchor = initialAnchorRef.current;

      if (
        anchor &&
        !anchor.wasAtBottom &&
        rowIndexByIdRef.current.has(anchor.messageId)
      ) {
        const index = rowIndexByIdRef.current.get(anchor.messageId)!;

        listRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 1,
          viewOffset: -anchor.offset,
        });
      }
      isInitialScrollProtectedRef.current = false;
    }, []);

    // ─── Императивные команды ────────────────────────────────────────────────

    const scrollToMessage = useCallback<IChatViewRef["scrollToMessage"]>(
      (messageId, options = {}) => {
        const {
          position = "center",
          animated = true,
          highlight = true,
        } = options;
        const index = rowIndexByIdRef.current.get(messageId);

        if (index == null) return;

        isProgrammaticScrollRef.current = true;

        const viewPosition =
          position === "top" ? 0 : position === "bottom" ? 1 : 0.5;

        listRef.current?.scrollToIndex({ index, animated, viewPosition });
        if (!animated) isProgrammaticScrollRef.current = false;

        if (highlight) {
          setTimeout(
            () => cellStore.highlight(messageId),
            animated ? 350 : 100,
          );
        }
      },
      [cellStore],
    );

    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom() {
          pendingScrollToBottomRef.current = true;
          if (displayedRef.current.length === 0) return;
          pendingScrollToBottomRef.current = false;
          isProgrammaticScrollRef.current = true;
          listRef.current?.scrollToEnd({ animated: true });
        },
        scrollToMessage,
        clearUnread() {
          unreadManagerRef.current?.clearAll();
        },
      }),
      [scrollToMessage],
    );

    // ─── Делегат ячеек (порт ChatViewController+MessageActions) ──────────────

    const cellDelegate = useMemo<IChatCellDelegate>(
      () => ({
        onTapMessage: (messageId, attachmentIndex) =>
          propsRef.current.onMessagePress?.(
            attachmentIndex != null
              ? { messageId, attachmentIndex }
              : { messageId },
          ),
        onEmojiSelect: (emoji, messageId) =>
          propsRef.current.onEmojiReactionSelect?.({ emoji, messageId }),
        onActionSelect: (actionId, messageId) =>
          propsRef.current.onActionPress?.({ actionId, messageId }),
        onReplyTap: replyToId => {
          scrollToMessage(replyToId, {
            position: "center",
            animated: true,
            highlight: true,
          });
          propsRef.current.onReplyMessagePress?.({ messageId: replyToId });
        },
        onReactionTap: (messageId, emoji) =>
          propsRef.current.onReactionTap?.({ emoji, messageId }),
        onThreadTap: (messageId, threadId) =>
          propsRef.current.onThreadTap?.({ messageId, threadId }),
        onLinkTap: (url, messageId) =>
          propsRef.current.onLinkTap?.({ url, messageId }),
        onPhoneNumberTap: (phoneNumber, messageId) =>
          propsRef.current.onPhoneNumberTap?.({ phoneNumber, messageId }),
        onPollOptionTap: (messageId, pollId, optionId) =>
          propsRef.current.onPollOptionPress?.({ messageId, pollId, optionId }),
        onPollDetailTap: (messageId, pollId) =>
          propsRef.current.onPollDetailPress?.({ messageId, pollId }),
        onContextMenuWillShow: () => {
          Keyboard.dismiss();
        },
      }),
      [scrollToMessage],
    );

    const cellDelegateRef = useRef(cellDelegate);

    cellDelegateRef.current = cellDelegate;

    // ─── Панель ввода ────────────────────────────────────────────────────────

    const inputMode = useMemo<ChatInputMode>(() => {
      if (
        !inputAction ||
        inputAction.type === "none" ||
        !inputAction.messageId
      ) {
        return { type: "normal" };
      }

      const msg = messageIndex.get(inputAction.messageId);

      if (!msg) return { type: "normal" };

      if (inputAction.type === "reply") {
        return {
          type: "reply",
          messageId: inputAction.messageId,
          senderName: msg.senderName,
          text: msg.body.text,
          hasImage: msg.body.media != null,
        };
      }

      return {
        type: "edit",
        messageId: inputAction.messageId,
        text: msg.body.text ?? "",
      };
    }, [inputAction, messageIndex]);

    const inputBarDelegate = useMemo<IChatInputBarDelegate>(
      () => ({
        onSend: (text, replyToId) => {
          pendingScrollToBottomRef.current = true;
          overlayStore.set({ fabExpanded: false });
          propsRef.current.onSendMessage?.({ text, replyToId });
        },
        onEdit: (text, messageId) =>
          propsRef.current.onEditMessage?.({ text, messageId }),
        onCancelMode: type => {
          if (type !== "none") {
            propsRef.current.onCancelInputAction?.({ type });
          }
        },
        onTapAttachment: () => propsRef.current.onAttachmentPress?.({}),
        onVoiceRecordingComplete: result => {
          pendingScrollToBottomRef.current = true;
          propsRef.current.onVoiceRecordingComplete?.(result);
        },
        onChangeText: text => {
          const hasText = text.trim().length > 0;

          if (featuresRef.current.showVoiceRecording) {
            overlayStore.set({ fabExpanded: hasText });
          }

          const throttleMs = propsRef.current.inputTypingThrottle ?? 500;
          const now = Date.now();

          if (now - lastTypingTimeRef.current >= throttleMs) {
            lastTypingTimeRef.current = now;
            propsRef.current.onInputTyping?.({ text });
          }
        },
        onRecordingStateChanged: isRecording => {
          if (isRecording) {
            chatVoicePlayer.pauseIfPlaying();
            overlayStore.set({ fabVisible: false });
          } else {
            updateFabVisibility();
          }
        },
      }),
      [overlayStore, updateFabVisibility],
    );

    const handleInputBarHeight = useCallback(
      (height: number) => overlayStore.set({ inputBarHeight: height }),
      [overlayStore],
    );

    // ─── Клавиатура и safe area ──────────────────────────────────────────────
    // Порт keyboardLayoutGuide: панель ввода прижата к клавиатуре, а при
    // скрытой клавиатуре — к нижней safe area. На Android высоту клавиатуры
    // обрабатывает adjustResize, поэтому отслеживается только видимость.

    const safeArea = useSafeAreaInsets();
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
      const showEvent =
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
      const hideEvent =
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

      const showSub = Keyboard.addListener(showEvent, e =>
        setKeyboardHeight(e.endCoordinates.height),
      );
      const hideSub = Keyboard.addListener(hideEvent, () =>
        setKeyboardHeight(0),
      );

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, []);

    const rootBottomPad =
      keyboardHeight > 0
        ? Platform.OS === "ios"
          ? keyboardHeight
          : 0
        : safeArea.bottom;

    // ─── Контекст ────────────────────────────────────────────────────────────

    const contextValue = useMemo<IChatViewContextValue>(
      () => ({
        theme,
        layout,
        features,
        listWidth: listSize.width,
        delegate: cellDelegateRef,
        cellStore,
      }),
      [theme, layout, features, listSize.width, cellStore],
    );

    // ─── Рендер строк ────────────────────────────────────────────────────────

    const firstSeparatorIndex = dateSeparators[0]?.rowIndex ?? -1;

    const renderItem = useCallback(
      ({ item, index }: ListRenderItemInfo<ChatRow>) => {
        switch (item.type) {
          case "message": {
            const msg = item.message;

            let resolvedReply: IResolvedReply | undefined;

            if (msg.reply) {
              const original = messageIndexRef.current.get(msg.reply.id);

              if (original) {
                resolvedReply = {
                  senderName: original.senderName ?? "Неизвестный",
                  text: original.body.text ?? "",
                  hasImage: original.body.media != null,
                };
              }
            }

            const currentRows = rowsRef.current;
            let avatarAnchor = true;

            for (let i = index + 1; i < currentRows.length; i++) {
              const nextRow = currentRows[i];

              if (nextRow.type === "dateSeparator") continue;
              if (nextRow.type === "loading") break;

              avatarAnchor = !(
                nextRow.message.ownership === "theirs" &&
                msg.ownership === "theirs" &&
                nextRow.message.senderName === msg.senderName
              );
              break;
            }

            return (
              <MessageCell
                message={msg}
                resolvedReply={resolvedReply}
                avatarAnchor={avatarAnchor}
              />
            );
          }
          case "dateSeparator":
            return (
              <DateSeparatorRow
                groupDate={item.groupDate}
                hidden={
                  propsRef.current.isLoadingTop === true &&
                  index === firstSeparatorIndex
                }
              />
            );
          case "loading":
            return <LoadingRow />;
        }
      },
      [firstSeparatorIndex],
    );

    const keyExtractor = useCallback((item: ChatRow) => chatRowKey(item), []);
    const getItemType = useCallback((item: ChatRow) => item.type, []);

    const handleRootLayout = useCallback(
      (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
        const { width, height } = e.nativeEvent.layout;

        setListSize(prev =>
          prev.width === width && prev.height === height
            ? prev
            : { width, height },
        );
      },
      [],
    );

    const maintainVisibleContentPosition = useMemo(
      () => ({
        autoscrollToBottomThreshold: features.autoScrollOnNewMessage ? 0.2 : 0,
        animateAutoScrollToBottom: true,
        startRenderingFromBottom: true,
      }),
      [features.autoScrollOnNewMessage],
    );

    const contentContainerStyle = useMemo(
      () => ({
        paddingTop: layout.collectionTopPadding + collectionInsetTop,
        paddingBottom: layout.collectionBottomPadding + collectionInsetBottom,
      }),
      [layout, collectionInsetTop, collectionInsetBottom],
    );

    const extraData = useMemo(
      () => ({ theme, layout, features, isLoadingTop, width: listSize.width }),
      [theme, layout, features, isLoadingTop, listSize.width],
    );

    return (
      <ChatViewContext.Provider value={contextValue}>
        <View
          ref={rootRef}
          collapsable={false}
          style={[ss.root, style]}
          onLayout={handleRootLayout}
        >
          <View
            style={[
              ss.content,
              rootBottomPad > 0 ? { paddingBottom: rootBottomPad } : null,
            ]}
          >
            <View style={ss.listWrap}>
              {listSize.width > 0 && (
                <FlashList
                  ref={listRef}
                  data={rows}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  getItemType={getItemType}
                  extraData={extraData}
                  drawDistance={500}
                  maintainVisibleContentPosition={
                    maintainVisibleContentPosition
                  }
                  initialScrollIndex={initialScrollIndex}
                  contentContainerStyle={contentContainerStyle}
                  showsVerticalScrollIndicator
                  keyboardDismissMode={
                    Platform.OS === "ios" ? "interactive" : "on-drag"
                  }
                  keyboardShouldPersistTaps="handled"
                  scrollEventThrottle={16}
                  viewabilityConfigCallbackPairs={viewabilityPairs.current}
                  onLoad={handleLoad}
                  onScroll={handleScroll}
                  onScrollBeginDrag={handleScrollBeginDrag}
                  onScrollEndDrag={handleScrollEndDrag}
                  onMomentumScrollEnd={handleMomentumScrollEnd}
                />
              )}

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
            </View>

            {features.showInputBar && (
              <ChatInputBar
                ref={inputBarRef}
                mode={inputMode}
                delegate={inputBarDelegate}
                onHeightChange={handleInputBarHeight}
              />
            )}
          </View>

          <ChatFab
            store={overlayStore}
            bottomInset={rootBottomPad}
            onPress={() => propsRef.current.onFabPress?.({})}
          />
        </View>
      </ChatViewContext.Provider>
    );
  }),
);

JsChatView.displayName = "JsChatView";

const ss = StyleSheet.create({
  // Порт ChatViewController: и view, и коллекция, и панель ввода прозрачные —
  // фон чата рисует хост, а не сам компонент.
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
  },
  listWrap: {
    flex: 1,
  },
  topSpinner: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
