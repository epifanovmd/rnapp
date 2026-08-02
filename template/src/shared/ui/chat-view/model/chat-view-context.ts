import { createContext, RefObject, useContext } from "react";
import { makeMutable, SharedValue } from "react-native-reanimated";

import { IInputBarLayout, INPUT_BAR_DEFAULT_LAYOUT } from "../../input-bar";
import {
  CHAT_DEFAULT_FEATURES,
  CHAT_DEFAULT_LAYOUT,
  CHAT_LIGHT_THEME,
  createChatStyles,
  IChatFeatures,
  IChatLayout,
  IChatStyles,
  IChatViewTheme,
} from "../config";
import { ChatHighlightStore } from "./chat-highlight-store";

/**
 * Обработчики действий ячейки.
 * Хранятся в ref, чтобы ячейки оставались мемоизированными.
 */
export interface IChatCellActions {
  onTapMessage(messageId: string, attachmentIndex?: number): void;
  onEmojiSelect(emoji: string, messageId: string): void;
  onActionSelect(actionId: string, messageId: string): void;
  onReplyTap(replyToId: string): void;
  onReactionTap(messageId: string, emoji: string): void;
  onThreadTap(messageId: string, threadId: string): void;
  onLinkTap(url: string, messageId: string): void;
  onPhoneNumberTap(phoneNumber: string, messageId: string): void;
  onPollOptionTap(messageId: string, pollId: string, optionId: string): void;
  onPollDetailTap(messageId: string, pollId: string): void;
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
  theme: IChatViewTheme;
  layout: IChatLayout;
  /** Метрики панели ввода: от них считается позиция FAB. */
  inputBarLayout: IInputBarLayout;
  features: IChatFeatures;
  /** Готовые стили под текущую пару (тема, лейаут). */
  styles: IChatStyles;
  actions: RefObject<IChatCellActions>;
  highlight: ChatHighlightStore;
  stickyDate: IChatStickyDate;
}

export const ChatViewContext = createContext<IChatViewContextValue>({
  theme: CHAT_LIGHT_THEME,
  layout: CHAT_DEFAULT_LAYOUT,
  inputBarLayout: INPUT_BAR_DEFAULT_LAYOUT,
  features: CHAT_DEFAULT_FEATURES,
  styles: createChatStyles(CHAT_LIGHT_THEME, CHAT_DEFAULT_LAYOUT),
  actions: { current: null as unknown as IChatCellActions },
  highlight: new ChatHighlightStore(),
  stickyDate: { activeIndex: makeMutable(-1), opacity: makeMutable(0) },
});

export const useChatViewContext = () => useContext(ChatViewContext);
