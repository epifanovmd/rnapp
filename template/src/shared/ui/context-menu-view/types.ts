import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";

import type {
  NativeContextMenuAction,
  NativeContextMenuActionSelectData,
  NativeContextMenuDismissData,
  NativeContextMenuEmojiSelectData,
  NativeContextMenuWillShowData,
} from "./native/NativeContextMenuViewSpec";

export type ContextMenuTheme = "light" | "dark";

export type ContextMenuAction = NativeContextMenuAction;

export type ContextMenuWillShowEvent = NativeContextMenuWillShowData;
export type ContextMenuEmojiSelectEvent = NativeContextMenuEmojiSelectData;
export type ContextMenuActionSelectEvent = NativeContextMenuActionSelectData;
export type ContextMenuDismissEvent = NativeContextMenuDismissData;

export interface IContextMenuViewProps {
  /** Идентификатор — возвращается во всех колбэках как menuId. */
  menuId?: string;
  /** Эмодзи-реакции: ["❤️", "👍", "😂"]. */
  emojis?: string[];
  /** Пункты меню действий. */
  actions?: ContextMenuAction[];
  /** Тема меню: "light" | "dark". */
  theme?: ContextMenuTheme;
  /** Минимальное время нажатия, в секундах (по умолчанию 0.35). */
  minimumPressDuration?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Перед показом меню. */
  onWillShow?: (event: ContextMenuWillShowEvent) => void;
  /** Выбрана эмодзи (onDismiss не вызывается). */
  onEmojiSelect?: (event: ContextMenuEmojiSelectEvent) => void;
  /** Выбрано действие (onDismiss не вызывается). */
  onActionSelect?: (event: ContextMenuActionSelectEvent) => void;
  /** Меню закрыто без выбора. */
  onDismiss?: (event: ContextMenuDismissEvent) => void;
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
  menuId: string;
  sourceFrame: IContextMenuRect;
  emojis: string[];
  actions: ContextMenuAction[];
}

export type ContextMenuCloseResult =
  | { type: "dismiss" }
  | { type: "emoji"; emoji: string }
  | { type: "action"; actionId: string };
