import { useCallback, useSyncExternalStore } from "react";

import { ChatOverlayStore, IChatOverlayState } from "./chat-overlay-store";

/**
 * Подписка на **одно поле** стора оверлеев: подписка на весь снимок
 * перерисовывала бы каждый оверлей на изменение любого другого.
 *
 * Селектор обязан возвращать ссылочно стабильное значение — примитив либо поле
 * стора как есть: снимки сравниваются по ссылке. Нужно несколько полей —
 * вызывайте хук несколько раз.
 */
export const useOverlayValue = <T>(
  store: ChatOverlayStore,
  select: (state: IChatOverlayState) => T,
): T =>
  useSyncExternalStore(
    store.subscribe,
    useCallback(() => select(store.state), [store, select]),
  );
