import { createContext, RefObject, useContext } from "react";
import { View } from "react-native";

import {
  CHAT_DEFAULT_FEATURES,
  CHAT_DEFAULT_LAYOUT,
  CHAT_LIGHT_THEME,
  IChatViewFeatures,
  IChatViewLayout,
  IChatViewTheme,
} from "../model";

/**
 * Маршрутизация действий ячеек — порт ChatViewController+MessageActions.
 * Хранится в ref, чтобы ячейки оставались мемоизированными.
 */
export interface IChatCellDelegate {
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
 * Мини-стор для точечных обновлений ячеек (подсветка scrollToMessage,
 * скрытие пузыря на время эффекта распада) без ре-рендера списка.
 */
export class ChatCellStore {
  private _highlightId: string | null = null;
  private _highlightToken = 0;
  private _hiddenBubbleIds = new Set<string>();
  private _version = 0;
  private readonly _listeners = new Set<() => void>();

  readonly bubbleRefs = new Map<string, View>();

  get version(): number {
    return this._version;
  }

  get highlightId(): string | null {
    return this._highlightId;
  }

  /** Токен меняется на каждый вызов — повторная подсветка того же id сработает. */
  get highlightToken(): number {
    return this._highlightToken;
  }

  isBubbleHidden(id: string): boolean {
    return this._hiddenBubbleIds.has(id);
  }

  highlight(id: string) {
    this._highlightId = id;
    this._highlightToken += 1;
    this.bump();
  }

  clearHighlight(id: string) {
    if (this._highlightId !== id) return;
    this._highlightId = null;
    this.bump();
  }

  hideBubbles(ids: Iterable<string>) {
    for (const id of ids) {
      this._hiddenBubbleIds.add(id);
    }
    this.bump();
  }

  showBubbles(ids: Iterable<string>) {
    let changed = false;

    for (const id of ids) {
      changed = this._hiddenBubbleIds.delete(id) || changed;
    }
    if (changed) this.bump();
  }

  registerBubble(id: string, ref: View | null) {
    if (ref) {
      this.bubbleRefs.set(id, ref);
    } else {
      this.bubbleRefs.delete(id);
    }
  }

  subscribe = (listener: () => void) => {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  };

  private bump() {
    this._version += 1;
    this._listeners.forEach(listener => listener());
  }
}

export interface IChatViewContextValue {
  theme: IChatViewTheme;
  layout: IChatViewLayout;
  features: IChatViewFeatures;
  /** Ширина списка — для расчёта максимальной ширины пузыря. */
  listWidth: number;
  delegate: RefObject<IChatCellDelegate>;
  cellStore: ChatCellStore;
}

export const ChatViewContext = createContext<IChatViewContextValue>({
  theme: CHAT_LIGHT_THEME,
  layout: CHAT_DEFAULT_LAYOUT,
  features: CHAT_DEFAULT_FEATURES,
  listWidth: 0,
  delegate: { current: null as unknown as IChatCellDelegate },
  cellStore: new ChatCellStore(),
});

export const useChatViewContext = () => useContext(ChatViewContext);
