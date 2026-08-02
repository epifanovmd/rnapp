import { useCallback, useEffect, useRef, useState } from "react";

import { IParsedChatMessage, planChatUpdate, shouldDeferUpdate } from "../data";
import { ChatUnreadManager } from "../services";
import { IChatCommands } from "./useChatCommands";
import { IChatScrollController } from "./useChatScroll";
import { IChatScrollAnchorController } from "./useChatScrollAnchor";

/**
 * Применение обновлений списка — порт `MessageUpdateHandler`.
 *
 * Стратегия обновления определяет поведение скролла, и решение принимается по
 * состоянию **до** применения данных — поэтому снимок (`wasAtBottom`, якоря)
 * берётся первым делом:
 *
 * - `initial` / `clear` — позицией занимается `useChatInitialScroll`;
 * - `prepend` / `content` — держит `maintainVisibleContentPosition` списка;
 * - `append` — вниз, только если были внизу и это похоже на новое сообщение,
 *   а не на догрузку хвоста; остальное уходит в непрочитанные;
 * - `structural` — восстановление по лучшему из видимых якорей.
 */

/** Сколько сообщений считаем «своей отправкой», а не догрузкой истории. */
const APPEND_AUTOSCROLL_LIMIT = 2;

/** Пауза, за которую проигрывается эффект распада. Порт задержки 0.15 с. */
const DISINTEGRATION_DELAY = 150;

export interface IChatMessageUpdatesOptions {
  /** Разобранные входные сообщения (проп). */
  parsed: IParsedChatMessage[];
  scroll: IChatScrollController;
  anchor: IChatScrollAnchorController;
  commands: IChatCommands;
  unreadManager: ChatUnreadManager;
  /** Включён ли эффект распада при удалении. */
  isDisintegrationEnabled: () => boolean;
  /** Проиграть распад для удалённых пузырей; вернуть `true` если было что играть. */
  playDisintegration: (
    deletedIds: Set<string>,
    previous: IParsedChatMessage[],
  ) => boolean;
}

export interface IChatMessageUpdates {
  /** Сообщения, реально отображаемые списком. */
  displayed: IParsedChatMessage[];
  /**
   * Применить отложенное структурное обновление. Вызывать по остановке
   * скролла. Порт `flushPendingMessages()`.
   */
  flushDeferred: () => void;
}

export const useChatMessageUpdates = ({
  parsed,
  scroll,
  anchor,
  commands,
  unreadManager,
  isDisintegrationEnabled,
  playDisintegration,
}: IChatMessageUpdatesOptions): IChatMessageUpdates => {
  // Отображаемые отстают от входных на время эффекта распада.
  const [displayed, setDisplayed] = useState(parsed);

  const previousRef = useRef(parsed);
  /** Отложенное обновление — ждёт остановки скролла. Порт `pendingMessages`. */
  const deferredRef = useRef<IParsedChatMessage[] | null>(null);
  /** Позиция, которую нужно восстановить после коммита данных. */
  const restoreRef = useRef<(() => void) | null>(null);

  const applyUpdate = useCallback(
    (next: IParsedChatMessage[]) => {
      const previous = previousRef.current;
      const plan = planChatUpdate(previous, next);
      const state = scroll.state.current;

      // Порт updateMessages: структурные правки во время перетаскивания
      // откладываем — они сдвинут контент под пальцем.
      if (
        (state.isUserDragging || state.isProgrammaticScroll) &&
        shouldDeferUpdate(plan)
      ) {
        deferredRef.current = next;

        return;
      }

      previousRef.current = next;

      const wasAtBottom = scroll.isNearBottom();
      const wantScroll = state.pendingScrollToBottom;

      switch (plan.strategy) {
        case "initial":
        case "clear":
        case "prepend":
        case "content":
          // Позицию держит сам список (MVCP data/size) либо начальный скролл.
          break;

        case "append": {
          // Порт applyAppend: вниз едем, только если были внизу и это
          // похоже на новое сообщение, а не на догрузку хвоста истории.
          const autoScroll =
            wantScroll ||
            (wasAtBottom &&
              plan.addedCount <= APPEND_AUTOSCROLL_LIMIT &&
              !state.isLoadingNewerActive);

          if (autoScroll) {
            state.pendingScrollToBottom = false;
            restoreRef.current = () => commands.scrollToBottom(true);
          } else {
            unreadManager.trackAppended(next, previous.length);
          }
          break;
        }

        case "structural": {
          if (wantScroll) {
            state.pendingScrollToBottom = false;
            restoreRef.current = () => commands.scrollToBottom(false);
            break;
          }

          // Порт restoreBestAnchor: снимаем якоря ДО применения данных,
          // после коммита выбираем тот, что ещё существует.
          const anchors = anchor.visible();

          if (anchors.length > 0) {
            restoreRef.current = () => commands.restoreBestAnchor(anchors);
          }

          if (!wasAtBottom) {
            unreadManager.trackAppended(next, previous.length);
          }
          break;
        }
      }

      // Порт animateDisintegrationThen: сначала распад, потом данные.
      if (
        isDisintegrationEnabled() &&
        plan.deletedIds.size > 0 &&
        playDisintegration(plan.deletedIds, previous)
      ) {
        setTimeout(() => setDisplayed(next), DISINTEGRATION_DELAY);

        return;
      }

      setDisplayed(next);
    },
    [
      scroll,
      anchor,
      commands,
      unreadManager,
      isDisintegrationEnabled,
      playDisintegration,
    ],
  );

  useEffect(() => {
    if (previousRef.current === parsed) return;

    applyUpdate(parsed);
  }, [parsed, applyUpdate]);

  // Восстановление позиции — после того как список закоммитил новые строки.
  useEffect(() => {
    const restore = restoreRef.current;

    if (!restore) return;

    restoreRef.current = null;
    // Кадр нужен, чтобы список успел измерить новые строки: до этого
    // positionAtIndex вернёт устаревшие координаты.
    const frame = requestAnimationFrame(restore);

    return () => cancelAnimationFrame(frame);
  }, [displayed]);

  // Порт flushPendingMessages: скролл остановился — применяем отложенное.
  // Вызывается из `onSettled` списка, а не из эффекта: обновление должно
  // приходить ровно один раз на остановку, а не на каждый рендер.
  const flushDeferred = useCallback(() => {
    const deferred = deferredRef.current;

    if (!deferred) return;

    deferredRef.current = null;
    applyUpdate(deferred);
  }, [applyUpdate]);

  // Отложенный скролл вниз, поставленный до прихода данных (отправка
  // сообщения в пустой чат). Порт pendingScrollToBottom в applyInitial.
  useEffect(() => {
    if (!scroll.state.current.pendingScrollToBottom) return;
    if (displayed.length === 0) return;

    scroll.state.current.pendingScrollToBottom = false;

    const frame = requestAnimationFrame(() => commands.scrollToBottom(true));

    return () => cancelAnimationFrame(frame);
  }, [displayed, scroll, commands]);

  return { displayed, flushDeferred };
};
