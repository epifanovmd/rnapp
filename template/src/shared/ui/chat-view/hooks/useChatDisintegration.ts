import { RefObject, useCallback, useRef } from "react";
import { View } from "react-native";

import { ChatOverlayStore } from "../components/chat-overlay-store";
import { ChatCellStore } from "../components/chat-view-context";
import { DISINTEGRATION_REMOVE_MS } from "../components/disintegration-overlay/disintegration-particles";
import { IChatViewTheme } from "../config";
import { IParsedChatMessage } from "../data";

/**
 * Эффект распада при удалении.
 *
 * Пузырь удаляемого сообщения замеряется на экране, его прямоугольник уходит в
 * стор оверлеев, а ячейка начинает схлопываться (высота + прозрачность к нулю).
 * Данные применяются после паузы — к моменту, когда анимация удаления
 * закончилась, а не раньше.
 */

export interface IChatDisintegrationOptions {
  rootRef: RefObject<View | null>;
  cellStore: ChatCellStore;
  overlayStore: ChatOverlayStore;
  getTheme: () => IChatViewTheme;
}

/** Цвет частиц берётся из цвета пузыря. */
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
   * тогда вызывающий откладывает применение данных.
   */
  return useCallback(
    (deletedIds: Set<string>, previous: IParsedChatMessage[]): boolean => {
      const root = rootRef.current;

      if (!root) return false;

      const byId = new Map(previous.map(msg => [msg.id, msg]));
      const targets: {
        id: string;
        message: IParsedChatMessage;
        view: View;
        cell: View;
      }[] = [];

      for (const id of deletedIds) {
        const message = byId.get(id);
        const view = cellStore.bubbleRefs.get(id);
        const cell = cellStore.cellRefs.get(id);

        if (message && view && cell) targets.push({ id, message, view, cell });
      }

      if (targets.length === 0) return false;

      const theme = getTheme();

      // Координаты пузырей приводим к системе координат корня чата:
      // оверлей рисуется внутри него.
      root.measureInWindow((rootX, rootY) => {
        for (const { message, view, cell } of targets) {
          view.measureInWindow((x, y, width, height) => {
            if (width <= 0 || height <= 0) return;

            burstKeyRef.current += 1;
            overlayStore.addBurst({
              key: burstKeyRef.current,
              frame: { x: x - rootX, y: y - rootY, width, height },
              color: burstColorOf(message, theme),
            });
          });

          // Высота всей ячейки (не только пузыря) — с неё начинается
          // схлопывание; пузырь тем временем уходит конфетти-эффектом.
          cell.measureInWindow((_x, _y, _width, cellHeight) => {
            if (cellHeight <= 0) return;

            cellStore.beginRemove(message.id, cellHeight);
          });
        }
      });

      // К моменту, когда строка уйдёт из данных, анимация закончена —
      // состояние схлопывания больше не нужно.
      setTimeout(
        () => cellStore.clearRemoving(deletedIds),
        DISINTEGRATION_REMOVE_MS + 100,
      );

      return true;
    },
    [rootRef, cellStore, overlayStore, getTheme],
  );
};
