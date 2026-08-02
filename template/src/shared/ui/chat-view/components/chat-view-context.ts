import { createContext, RefObject, useContext } from "react";
import { View } from "react-native";

import {
  CHAT_DEFAULT_FEATURES,
  CHAT_DEFAULT_LAYOUT,
  CHAT_LIGHT_THEME,
  createChatStyles,
  IChatStyles,
  IChatViewFeatures,
  IChatViewLayout,
  IChatViewTheme,
} from "../config";

/**
 * Маршрутизация действий ячеек.
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
 * Точечные обновления ячеек без ре-рендера списка: подсветка `scrollToMessage`
 * и анимированное схлопывание удаляемого пузыря под эффект распада.
 */
export class ChatCellStore {
  private _highlightId: string | null = null;
  private _highlightToken = 0;
  /** id → измеренная высота ячейки: пока запись есть, ячейка схлопывается. */
  private _removing = new Map<string, number>();
  private readonly _listeners = new Set<() => void>();

  /** Пузыри сообщений — для замера кадра конфетти-эффекта. */
  readonly bubbleRefs = new Map<string, View>();
  /** Корни ячеек — для замера высоты схлопывания. */
  readonly cellRefs = new Map<string, View>();

  get highlightId(): string | null {
    return this._highlightId;
  }

  /** Токен меняется на каждый вызов — повторная подсветка того же id сработает. */
  get highlightToken(): number {
    return this._highlightToken;
  }

  /** Высота схлопывания удаляемого сообщения либо `null`, если оно не удаляется. */
  removingHeightOf(id: string): number | null {
    return this._removing.get(id) ?? null;
  }

  highlight(id: string) {
    this._highlightId = id;
    this._highlightToken += 1;
    this._notify();
  }

  clearHighlight(id: string) {
    if (this._highlightId !== id) return;
    this._highlightId = null;
    this._notify();
  }

  /** Начать анимацию удаления: ячейка схлопнется с этой высоты до нуля. */
  beginRemove(id: string, height: number) {
    this._removing.set(id, height);
    this._notify();
  }

  /** Сбросить состояние удаления (после того как строка ушла из данных). */
  clearRemoving(ids: Iterable<string>) {
    let changed = false;

    for (const id of ids) {
      changed = this._removing.delete(id) || changed;
    }
    if (changed) this._notify();
  }

  registerBubble(id: string, ref: View | null) {
    if (ref) {
      this.bubbleRefs.set(id, ref);
    } else {
      this.bubbleRefs.delete(id);
    }
  }

  registerCell(id: string, ref: View | null) {
    if (ref) {
      this.cellRefs.set(id, ref);
    } else {
      this.cellRefs.delete(id);
    }
  }

  subscribe = (listener: () => void) => {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  };

  private _notify() {
    this._listeners.forEach(listener => listener());
  }
}

export interface IChatViewContextValue {
  theme: IChatViewTheme;
  layout: IChatViewLayout;
  features: IChatViewFeatures;
  /** Готовые стили под текущую пару (тема, лейаут). */
  styles: IChatStyles;
  /** Ширина списка — для расчёта максимальной ширины пузыря. */
  listWidth: number;
  delegate: RefObject<IChatCellDelegate>;
  cellStore: ChatCellStore;
}

export const ChatViewContext = createContext<IChatViewContextValue>({
  theme: CHAT_LIGHT_THEME,
  layout: CHAT_DEFAULT_LAYOUT,
  features: CHAT_DEFAULT_FEATURES,
  styles: createChatStyles(CHAT_LIGHT_THEME, CHAT_DEFAULT_LAYOUT),
  listWidth: 0,
  delegate: { current: null as unknown as IChatCellDelegate },
  cellStore: new ChatCellStore(),
});

export const useChatViewContext = () => useContext(ChatViewContext);
