// ContextMenuView.tsx
// Публичный React Native wrapper для кастомного контекстного меню.
// Формат пропов приведён к стилю ChatView:
//   - emojis: string[]   (было: { emoji: string }[])
//   - theme: "light"|"dark"  (было: menuTheme)
//
// Пример использования:
//   <ContextMenuView
//     menuId={message.id}
//     emojis={["❤️", "👍", "😂", "😮", "😢", "🙏"]}
//     actions={[
//       { id: "reply",  title: "Reply",  systemImage: "arrowshape.turn.up.left" },
//       { id: "copy",   title: "Copy",   systemImage: "doc.on.doc" },
//       { id: "delete", title: "Delete", isDestructive: true },
//     ]}
//     theme="light"
//     onEmojiSelect={({ emoji, menuId }) => handleEmojiReaction(menuId, emoji)}
//     onActionSelect={({ actionId, menuId }) => handleAction(menuId, actionId)}
//   >
//     <MessageBubble message={message} />
//   </ContextMenuView>

import React from "react";
import {
  type HostComponent,
  type NativeSyntheticEvent,
  Platform,
  requireNativeComponent,
  View,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import type {
  NativeContextMenuAction,
  NativeContextMenuActionSelectData,
  NativeContextMenuDismissData,
  NativeContextMenuEmojiSelectData,
  NativeContextMenuViewProps,
  NativeContextMenuWillShowData,
} from "../../../NativeContextMenuViewSpec";

// ─── Public types ─────────────────────────────────────────────────────────────

export type ContextMenuAction = NativeContextMenuAction;

export type ContextMenuEmojiSelectEvent = NativeContextMenuEmojiSelectData;
export type ContextMenuActionSelectEvent = NativeContextMenuActionSelectData;
export type ContextMenuDismissEvent = NativeContextMenuDismissData;
export type ContextMenuWillShowEvent = NativeContextMenuWillShowData;

export type ContextMenuTheme = "light" | "dark";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ContextMenuViewProps extends ViewProps {
  /** Уникальный идентификатор — прокидывается в колбэки как menuId */
  menuId?: string;
  /** Список эмодзи. Пример: ["❤️", "👍", "😂"] */
  emojis?: string[];
  actions?: ContextMenuAction[];
  theme?: ContextMenuTheme;
  minimumPressDuration?: number;

  style?: ViewStyle;
  children?: React.ReactNode;

  /** Вызывается при выборе эмодзи */
  onEmojiSelect?: (event: ContextMenuEmojiSelectEvent) => void;

  /** Вызывается при выборе действия */
  onActionSelect?: (event: ContextMenuActionSelectEvent) => void;

  /** Вызывается при закрытии меню (без выбора) */
  onDismiss?: (event: ContextMenuDismissEvent) => void;

  /** Вызывается перед показом меню */
  onWillShow?: (event: ContextMenuWillShowEvent) => void;
}

// ─── Native component ─────────────────────────────────────────────────────────

const COMPONENT_NAME = "RNContextMenuView";

const NativeContextMenuView = (() => {
  try {
    const Spec = require("./NativeContextMenuViewSpec").default;

    return Spec as HostComponent<NativeContextMenuViewProps>;
  } catch {
    return requireNativeComponent<NativeContextMenuViewProps>(COMPONENT_NAME);
  }
})();

// ─── ContextMenuView ──────────────────────────────────────────────────────────

export const ContextMenuView: React.FC<ContextMenuViewProps> = ({
  menuId = "",
  emojis = [],
  actions = [],
  theme = "light",
  minimumPressDuration = 0.35,
  style,
  children,
  onEmojiSelect,
  onActionSelect,
  onDismiss,
  onWillShow,
  ...rest
}) => {
  // Android: нативный компонент реализован и работает.
  // iOS: нативный компонент реализован через UIContextMenuInteraction.
  // Фоллбэк на простой View только если платформа не поддерживается.
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return (
      <View style={style} {...rest}>
        {children}
      </View>
    );
  }

  const handleEmojiSelect = (
    e: NativeSyntheticEvent<ContextMenuEmojiSelectEvent>,
  ) => onEmojiSelect?.(e.nativeEvent);

  const handleActionSelect = (
    e: NativeSyntheticEvent<ContextMenuActionSelectEvent>,
  ) => onActionSelect?.(e.nativeEvent);

  const handleDismiss = (e: NativeSyntheticEvent<ContextMenuDismissEvent>) =>
    onDismiss?.(e.nativeEvent);

  const handleWillShow = (e: NativeSyntheticEvent<ContextMenuWillShowEvent>) =>
    onWillShow?.(e.nativeEvent);

  return (
    <NativeContextMenuView
      style={style}
      menuId={menuId}
      emojis={emojis}
      actions={actions}
      theme={theme}
      minimumPressDuration={minimumPressDuration}
      onEmojiSelect={handleEmojiSelect}
      onActionSelect={handleActionSelect}
      onDismiss={handleDismiss}
      onWillShow={handleWillShow}
      {...rest}
    >
      {children}
    </NativeContextMenuView>
  );
};

export default ContextMenuView;
