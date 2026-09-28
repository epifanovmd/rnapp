import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";

/** Пункт меню действий. */
export type ContextMenuAction = {
  /** Идентификатор действия — возвращается в onActionSelect как actionId. */
  id: string;
  /** Заголовок пункта меню. */
  title: string;
  /** Имя SF Symbol для иконки. */
  systemImage?: string;
  /** Красный (деструктивный) стиль пункта. */
  isDestructive?: boolean;
};

export interface IContextMenuViewProps {
  /** Эмодзи-реакции: ["❤️", "👍", "😂"]. */
  emojis?: string[];
  /** Пункты меню действий. */
  actions?: ContextMenuAction[];
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Перед показом меню. */
  onWillShow?: () => void;
  /** Выбрана эмодзи (onDismiss не вызывается). */
  onEmojiSelect?: (emoji: string) => void;
  /** Выбрано действие (onDismiss не вызывается). */
  onActionSelect?: (actionId: string) => void;
  /** Меню закрыто без выбора. */
  onDismiss?: () => void;
}

export interface IContextMenuSize {
  width: number;
  height: number;
}

export interface IContextMenuRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IContextMenuInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface IContextMenuSession {
  sourceFrame: IContextMenuRect;
  emojis: string[];
  actions: ContextMenuAction[];
}

export type ContextMenuCloseResult =
  | { type: "dismiss" }
  | { type: "emoji"; emoji: string }
  | { type: "action"; actionId: string };
