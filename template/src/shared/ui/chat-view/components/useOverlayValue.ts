import { useCallback, useSyncExternalStore } from "react";

import { ChatOverlayStore, IChatOverlayState } from "./chat-overlay-store";

/**
 * Подписка на **одно поле** стора оверлеев.
 *
 * Стор обновляется на каждом кадре скролла (видимость FAB, плашка даты).
 * Подписка на весь снимок перерисовывала бы каждый оверлей на каждое
 * изменение любого другого — поэтому потребители берут ровно те поля,
 * которые рисуют.
 *
 * Селектор обязан возвращать ссылочно стабильное значение — примитив либо
 * поле стора как есть: `useSyncExternalStore` сравнивает снимки по ссылке и
 * на вычисленном объекте будет перерисовывать бесконечно. Нужно несколько
 * полей — вызывайте хук несколько раз.
 */
export const useOverlayValue = <T>(
  store: ChatOverlayStore,
  select: (state: IChatOverlayState) => T,
): T =>
  useSyncExternalStore(
    store.subscribe,
    useCallback(() => select(store.state), [store, select]),
  );
