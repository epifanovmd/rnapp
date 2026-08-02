import React, { FC } from "react";
import { Platform } from "react-native";

import { JsContextMenuView } from "./JsContextMenuView";
import { ContextMenuHost } from "./menu";
import { NativeContextMenuView } from "./native";
import { IContextMenuViewProps } from "./types";

/**
 * Единственная публичная точка входа контекстного меню: iOS — нативная
 * реализация, остальные платформы — JS. `ContextMenuView.Host` монтируется
 * один раз в App.tsx: сам оверлей общий на всё приложение.
 */
const ContextMenuViewImpl: FC<IContextMenuViewProps> =
  Platform.OS === "ios"
    ? props => <NativeContextMenuView {...props} />
    : props => <JsContextMenuView {...props} />;

export const ContextMenuView = Object.assign(ContextMenuViewImpl, {
  Host: ContextMenuHost,
});
