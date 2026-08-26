import { createContext, RefObject, useContext } from "react";
import { makeMutable, SharedValue } from "react-native-reanimated";

import { CHAT_SKIN, IChatColors, IChatStyles } from "../config";
import {
  ChatContentInteraction,
  ChatContentRegistry,
  EMPTY_CHAT_CONTENT_REGISTRY,
} from "../content";
import { ChatAdaptiveRenderStore } from "./chat-adaptive-render-store";
import { ChatHighlightStore } from "./chat-highlight-store";

/**
 * Обработчики действий ячейки.
 * Хранятся в ref, чтобы ячейки оставались мемоизированными.
 */
export interface IChatCellActions {
  onTapMessage(messageId: string): void;
  onEmojiSelect(emoji: string, messageId: string): void;
  onActionSelect(actionId: string, messageId: string): void;
  onReplyTap(replyToId: string): void;
  onReactionTap(messageId: string, emoji: string): void;
  onThreadTap(messageId: string, threadId: string): void;
  onLinkTap(url: string, messageId: string): void;
  onPhoneNumberTap(phoneNumber: string, messageId: string): void;
  /** Событие от блока контента — единый канал для всех типов. */
  onContentInteraction(event: ChatContentInteraction): void;
  onContextMenuWillShow(messageId: string): void;
  onContextMenuDismiss(messageId: string): void;
}

/**
 * Состояние прилипшей плашки даты — целиком на UI-потоке.
 *
 * `activeIndex` ведёт сам список (проп `sharedValues`), `opacity` гасит плашку
 * в покое. Ни то, ни другое не проходит через React: иначе каждый кадр скролла
 * стоил бы ре-рендера.
 */
export interface IChatStickyDate {
  /** Индекс строки-разделителя, прилипшей к верхней кромке; -1 — никакой. */
  activeIndex: SharedValue<number>;
  /** Прозрачность прилипшей плашки: 1 при скролле, 0 через паузу. */
  opacity: SharedValue<number>;
}

export interface IChatViewContextValue {
  colors: IChatColors;
  /** Готовые стили под текущую палитру. */
  styles: IChatStyles;
  /** Реестр типов контента: по нему ячейка выбирает компонент блока. */
  contentTypes: ChatContentRegistry;
  actions: RefObject<IChatCellActions>;
  highlight: ChatHighlightStore;
  adaptiveRender: ChatAdaptiveRenderStore;
  stickyDate: IChatStickyDate;
}

export const ChatViewContext = createContext<IChatViewContextValue>({
  colors: CHAT_SKIN.light.colors,
  styles: CHAT_SKIN.light.styles,
  contentTypes: EMPTY_CHAT_CONTENT_REGISTRY,
  actions: { current: null as unknown as IChatCellActions },
  highlight: new ChatHighlightStore(),
  adaptiveRender: new ChatAdaptiveRenderStore(),
  stickyDate: { activeIndex: makeMutable(-1), opacity: makeMutable(0) },
});

export const useChatViewContext = () => useContext(ChatViewContext);
