import React, { forwardRef } from "react";
import { Platform } from "react-native";

import { JsInputBar } from "./JsInputBar";
import { NativeInputBar } from "./native";
import { IInputBarRef, InputBarProps } from "./types";

/**
 * Единственная публичная точка входа InputBar: iOS — нативный RNInputBar
 * (InputBarView), остальные платформы — JS-реализация.
 */
export const InputBar = forwardRef<IInputBarRef, InputBarProps>((props, ref) =>
  Platform.OS === "ios" ? (
    <NativeInputBar ref={ref} {...props} />
  ) : (
    <JsInputBar ref={ref} {...props} />
  ),
);

InputBar.displayName = "InputBar";
