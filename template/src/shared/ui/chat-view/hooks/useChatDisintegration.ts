import { RefObject, useCallback, useRef } from "react";
import { View } from "react-native";

import { ChatOverlayStore } from "../components/chat-overlay-store";
import { ChatCellStore } from "../components/chat-view-context";
import { IChatViewTheme } from "../config";
import { IParsedChatMessage } from "../data";

/**
 * Эффект распада при удалении — порт `DisintegrationAnimator` +
 * `animateDisintegrationThen`.
 *
 * Пузырь удаляемого сообщения замеряется на экране, его прямоугольник уходит в
 * стор оверлеев, сам пузырь прячется, а данные применяются после паузы — иначе
 * строка исчезнет раньше, чем начнётся анимация.
 */

export interface IChatDisintegrationOptions {
  rootRef: RefObject<View | null>;
  cellStore: ChatCellStore;
  overlayStore: ChatOverlayStore;
  getTheme: () => IChatViewTheme;
}

/** Цвет частиц берётся из цвета пузыря. Порт выбора цвета в аниматоре. */
const burstColorOf = (
  message: IParsedChatMessage,
  theme: IChatViewTheme,
): string => {
  switch (message.ownership) {
    case "mine":
      return theme.outgoingBubble;
    case "system":
      return theme.systemText;
    case "pinned":
      return theme.pinnedBubble;
    default:
      return theme.incomingBubble;
  }
};

export const useChatDisintegration = ({
  rootRef,
  cellStore,
  overlayStore,
  getTheme,
}: IChatDisintegrationOptions) => {
  const burstKeyRef = useRef(0);

  /**
   * Возвращает `true`, если хотя бы один пузырь удалось замерить —
   * тогда вызывающий откладывает применение данных. Порт возврата
   * `hadVisibleAnimation`.
   */
  return useCallback(
    (deletedIds: Set<string>, previous: IParsedChatMessage[]): boolean => {
      const root = rootRef.current;

      if (!root) return false;

      const byId = new Map(previous.map(msg => [msg.id, msg]));
      const targets: { id: string; message: IParsedChatMessage; view: View }[] =
        [];

      for (const id of deletedIds) {
        const message = byId.get(id);
        const view = cellStore.bubbleRefs.get(id);

        if (message && view) targets.push({ id, message, view });
      }

      if (targets.length === 0) return false;

      const theme = getTheme();

      // Координаты пузырей приводим к системе координат корня чата:
      // оверлей рисуется внутри него.
      root.measureInWindow((rootX, rootY) => {
        for (const { message, view } of targets) {
          view.measureInWindow((x, y, width, height) => {
            if (width <= 0 || height <= 0) return;

            burstKeyRef.current += 1;
            overlayStore.addBurst({
              key: burstKeyRef.current,
              frame: { x: x - rootX, y: y - rootY, width, height },
              color: burstColorOf(message, theme),
            });
          });
        }
      });

      cellStore.hideBubbles(deletedIds);
      // Пузыри вернутся видимыми к моменту, когда строки уже уйдут из данных —
      // так переиспользованные ячейки не окажутся скрытыми.
      setTimeout(() => cellStore.showBubbles(deletedIds), 150);

      return true;
    },
    [rootRef, cellStore, overlayStore, getTheme],
  );
};
