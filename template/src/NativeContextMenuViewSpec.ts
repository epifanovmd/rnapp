// NativeContextMenuViewSpec.ts
// Codegen spec для кастомного контекстного меню.
// Самостоятельный компонент — используется независимо от ChatView.
//
// Использование в RN:
//   <ContextMenuView
//     menuId="msg_123"
//     emojis={[{ emoji: "❤️" }, { emoji: "👍" }]}
//     actions={[
//       { id: "reply", title: "Reply", systemImage: "arrowshape.turn.up.left" },
//       { id: "delete", title: "Delete", isDestructive: true },
//     ]}
//     onEmojiSelect={({ emoji, menuId }) => ...}
//     onActionSelect={({ actionId, menuId }) => ...}
//   >
//     <MessageBubble ... />
//   </ContextMenuView>

import type { HostComponent, ViewProps } from "react-native";
import type {
  DirectEventHandler,
  Double,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type NativeContextMenuEmoji = {
  emoji: string;
};

export type NativeContextMenuAction = {
  id: string;
  title: string;
  systemImage?: string;
  isDestructive?: boolean;
};

// ─── Event payloads ───────────────────────────────────────────────────────────

export type NativeContextMenuEmojiSelectData = {
  emoji: string;
  menuId: string;
};

export type NativeContextMenuActionSelectData = {
  actionId: string;
  menuId: string;
};

export type NativeContextMenuDismissData = {
  menuId: string;
};

export type NativeContextMenuWillShowData = {
  menuId: string;
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NativeContextMenuViewProps extends ViewProps {
  /** Уникальный ID, прокидывается в колбэки */
  menuId?: string;

  /** Список эмодзи для панели */
  emojis?: NativeContextMenuEmoji[];

  /** Список действий в меню */
  actions?: NativeContextMenuAction[];

  /** Тема меню */
  menuTheme?: WithDefault<string, "light">;

  /** Минимальное время удержания для активации (сек) */
  minimumPressDuration?: WithDefault<Double, 0.35>;

  // Events
  onEmojiSelect?: DirectEventHandler<NativeContextMenuEmojiSelectData>;
  onActionSelect?: DirectEventHandler<NativeContextMenuActionSelectData>;
  onDismiss?: DirectEventHandler<NativeContextMenuDismissData>;
  onWillShow?: DirectEventHandler<NativeContextMenuWillShowData>;
}

export default codegenNativeComponent<NativeContextMenuViewProps>(
  "RNContextMenuView",
) as HostComponent<NativeContextMenuViewProps>;
