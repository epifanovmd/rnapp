import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import { IChatFeatures } from "../config";
import { ChatContentRegistry } from "../content";
import {
  buildChatData,
  CHAT_MAX_ANIMATED_REMOVALS,
  ChatMessageParser,
  ChatRemovalTracker,
  ChatRowsBuilder,
  IChatData,
} from "../data";
import { ChatAction, ChatMessage } from "../types";

export interface IChatDataOptions {
  messages: ChatMessage[];
  /** Реестр типов контента. Фиксируется при первом разборе и дальше неизменен. */
  contentTypes: ChatContentRegistry;
  getActionsForMessage?: (message: ChatMessage) => ChatAction[];
  features: IChatFeatures;
  showBottomLoading: boolean;
  hideFirstSeparator: boolean;
  /** Длительность исчезновения удалённой строки (сек); `0` — без анимации. */
  removeDuration: number;
}

/** Запас поверх анимации: строка снимается заведомо после её завершения. */
const REMOVE_TIMER_SLACK = 120;

/**
 * Входные сообщения → строки списка с сохранением идентичности: не изменившиеся
 * объекты возвращаются те же, поэтому перерисовывается ровно изменившееся.
 * Того же требует и от хоста — он обязан сохранять идентичность `messages`.
 *
 * Удалённое сообщение задерживается на время анимации исчезновения. Сверка идёт
 * в рендере, а не в эффекте: строка обязана остаться в тех же данных, которыми
 * список отрисует удаление, иначе рывок случится до первого кадра анимации.
 */
export const useChatData = ({
  messages,
  contentTypes,
  getActionsForMessage,
  features,
  showBottomLoading,
  hideFirstSeparator,
  removeDuration,
}: IChatDataOptions): IChatData => {
  const toolsRef = useRef<{
    parser: ChatMessageParser;
    builder: ChatRowsBuilder;
    removals: ChatRemovalTracker;
  } | null>(null);

  toolsRef.current ??= {
    parser: new ChatMessageParser(contentTypes),
    builder: new ChatRowsBuilder(contentTypes),
    removals: new ChatRemovalTracker(),
  };

  const { parser, builder, removals } = toolsRef.current;

  const [removalVersion, bumpRemovalVersion] = useReducer(
    (version: number) => version + 1,
    0,
  );

  const parsed = useMemo(
    () => parser.parse(messages, getActionsForMessage),
    [parser, messages, getActionsForMessage],
  );

  // Сверка идёт и с выключенной анимацией: иначе трекер запомнил бы вход
  // времён выключения и принял бы за удаление всё, что разошлось с тех пор.
  const removed = useMemo(
    () =>
      removals.sync(
        parsed,
        removeDuration > 0 ? CHAT_MAX_ANIMATED_REMOVALS : 0,
      ),
    // `removalVersion` — снятие доигравшей строки: вход тот же, результат другой.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [removals, parsed, removeDuration, removalVersion],
  );

  // Анимацию доигрывает сама строка, поэтому снятие идёт по времени: строки
  // за пределами окна отрисовки не смонтированы и сообщить о завершении не могут.
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const finishRemoval = useCallback(
    (key: string) => {
      timersRef.current.delete(key);

      if (removals.finish(key)) bumpRemovalVersion();
    },
    [removals],
  );

  useEffect(() => {
    const timers = timersRef.current;
    const keys = removed.removingKeys;

    if (!keys) return;

    for (const key of keys) {
      if (timers.has(key)) continue;

      timers.set(
        key,
        setTimeout(
          () => finishRemoval(key),
          removeDuration * 1000 + REMOVE_TIMER_SLACK,
        ),
      );
    }
  }, [removed.removingKeys, removeDuration, finishRemoval]);

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  return useMemo(
    () =>
      buildChatData(builder, parsed, {
        features,
        showBottomLoading,
        hideFirstSeparator,
        rowMessages: removed.messages,
        removingKeys: removed.removingKeys,
      }),
    [builder, parsed, removed, features, showBottomLoading, hideFirstSeparator],
  );
};
