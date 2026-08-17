import React, { FC, memo, useCallback, useSyncExternalStore } from "react";

import { useChatViewContext } from "../../model";
import { HighlightFlash } from "./HighlightFlash";

/**
 * Вспышка поверх пузыря после `scrollToMessage({ highlight: true })`.
 *
 * Разделён на подписку и саму вспышку: подсветка — событие редкое, а ячеек на
 * экране много, поэтому shared value и анимированный стиль создаются только у
 * подсвечиваемой ячейки, а остальные платят лишь за чтение токена.
 */
interface IHighlightOverlayProps {
  messageId: string;
}

export const HighlightOverlay: FC<IHighlightOverlayProps> = memo(
  ({ messageId }) => {
    const { highlight } = useChatViewContext();

    const token = useSyncExternalStore(
      highlight.subscribe,
      useCallback(() => highlight.tokenOf(messageId), [highlight, messageId]),
    );

    if (token === 0) return null;

    return <HighlightFlash messageId={messageId} token={token} />;
  },
);

HighlightOverlay.displayName = "HighlightOverlay";
