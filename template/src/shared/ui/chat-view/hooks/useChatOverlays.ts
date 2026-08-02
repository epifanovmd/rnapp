import { useCallback, useEffect, useMemo, useRef } from "react";

import { ChatOverlayStore } from "../components/chat-overlay-store";
import { IParsedChatMessage } from "../data";
import { ChatUnreadManager } from "../services";

/**
 * FAB, пустое состояние и счётчик непрочитанных (сторона состояния).
 *
 * Все три пишут в один внешний стор оверлеев: их значения меняются на
 * каждом кадре скролла, и заводить под них React-состояние значило бы
 * перерисовывать список вместе с кнопкой.
 */

export interface IChatOverlaysOptions {
  store: ChatOverlayStore;
  unreadManager: ChatUnreadManager;
  isNearBottom: () => boolean;
  getDisplayed: () => IParsedChatMessage[];
  /** При загрузке FAB показан принудительно и не реагирует на скролл. */
  isFabLoading: () => boolean;
  isFabEnabled: () => boolean;
}

export interface IChatOverlaysController {
  /** Пересчитать видимость FAB по текущему состоянию. */
  updateFab: () => void;
  /** Развернуть / свернуть FAB. */
  setFabExpanded: (expanded: boolean) => void;
  /** Спрятать FAB на время записи голоса. */
  setFabHiddenForRecording: (hidden: boolean) => void;
}

export const useChatOverlays = ({
  store,
  unreadManager,
  isNearBottom,
  getDisplayed,
  isFabLoading,
  isFabEnabled,
}: IChatOverlaysOptions): IChatOverlaysController => {
  // Счётчик непрочитанных ведёт менеджер, а показывает бейдж — стор.
  useEffect(() => {
    unreadManager.onCountChanged = count => store.set({ unreadCount: count });

    return () => {
      unreadManager.onCountChanged = undefined;
    };
  }, [unreadManager, store]);

  const updateFab = useCallback(() => {
    if (!isFabEnabled()) {
      store.set({ fabVisible: false });

      return;
    }

    // Пока идёт загрузка, FAB не прячем.
    if (isFabLoading()) return;

    store.set({
      fabVisible: !isNearBottom() && getDisplayed().length > 0,
    });
  }, [isFabEnabled, isFabLoading, isNearBottom, getDisplayed, store]);

  const setFabExpanded = useCallback(
    (expanded: boolean) => store.set({ fabExpanded: expanded }),
    [store],
  );

  const setFabHiddenForRecording = useCallback(
    (hidden: boolean) => {
      if (hidden) {
        store.set({ fabVisible: false });
      } else {
        updateFab();
      }
    },
    [store, updateFab],
  );

  return useMemo(
    () => ({ updateFab, setFabExpanded, setFabHiddenForRecording }),
    [updateFab, setFabExpanded, setFabHiddenForRecording],
  );
};

/** Пустое состояние: запись видимости, загрузки и текста в стор оверлеев. */
export const useChatEmptyState = (
  store: ChatOverlayStore,
  isEmpty: boolean,
  isLoading: boolean,
  emptyText: string | undefined,
) => {
  useEffect(() => {
    store.set({
      emptyVisible: isEmpty,
      emptyLoading: isLoading,
      emptyText: emptyText ?? null,
    });
  }, [store, isEmpty, isLoading, emptyText]);
};

/** Внешнее управление счётчиком. */
export const useChatExternalUnread = (
  unreadManager: ChatUnreadManager,
  unreadCount: number,
) => {
  const appliedRef = useRef<number | null>(null);

  useEffect(() => {
    // -1 = внутреннее управление, менеджер считает сам.
    if (unreadCount < 0) return;
    if (appliedRef.current === unreadCount) return;

    appliedRef.current = unreadCount;
    unreadManager.setExternalCount(unreadCount);
  }, [unreadManager, unreadCount]);
};
