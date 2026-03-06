// NativeContextMenuViewSpec.ts
// Codegen spec для кастомного контекстного меню.

import type { HostComponent, ViewProps } from "react-native";
import type {
  DirectEventHandler,
  Double,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

// ─── Domain types ─────────────────────────────────────────────────────────────

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
  menuId?: string;
  emojis?: string[];
  actions?: NativeContextMenuAction[];
  theme?: WithDefault<string, "light">;
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
