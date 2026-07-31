import type { HostComponent, ViewProps } from "react-native";
import { codegenNativeComponent } from "react-native";
import type {
  DirectEventHandler,
  Double,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";

export type NativeContextMenuAction = {
  /** Идентификатор действия — возвращается в onActionSelect как actionId. */
  id: string;
  /** Заголовок пункта меню. */
  title: string;
  /** Имя SF Symbol для иконки. */
  systemImage?: string;
  /** Красный (деструктивный) стиль пункта. */
  isDestructive?: boolean;
};

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

export interface NativeContextMenuViewProps extends ViewProps {
  menuId?: string;
  emojis?: string[];
  actions?: NativeContextMenuAction[];
  theme?: WithDefault<string, "light">;
  minimumPressDuration?: WithDefault<Double, 0.35>;

  onEmojiSelect?: DirectEventHandler<NativeContextMenuEmojiSelectData>;
  onActionSelect?: DirectEventHandler<NativeContextMenuActionSelectData>;
  onDismiss?: DirectEventHandler<NativeContextMenuDismissData>;
  onWillShow?: DirectEventHandler<NativeContextMenuWillShowData>;
}

export default codegenNativeComponent<NativeContextMenuViewProps>(
  "RNContextMenuView",
) as HostComponent<NativeContextMenuViewProps>;
