import {
  IKeyboardFloatingViewProps,
  KeyboardFloatingView,
} from "@shared/lib/keyboard";
import React, { forwardRef } from "react";
import { View } from "react-native";

/**
 * Панель ввода, приклеенная к клавиатуре.
 *
 * Тонкая обёртка над `KeyboardFloatingView` из `shared/lib/keyboard`:
 * само поведение (порт `keyboardLayoutGuide` + `followsUndockedKeyboard`)
 * общее для любых плавающих панелей и живёт в модуле клавиатуры, а здесь
 * остаётся привычное имя в пространстве `input-bar`.
 */
export type IKeyboardInputBarProps = IKeyboardFloatingViewProps;

export const KeyboardInputBar = forwardRef<View, IKeyboardInputBarProps>(
  (props, ref) => <KeyboardFloatingView ref={ref} {...props} />,
);

KeyboardInputBar.displayName = "KeyboardInputBar";
