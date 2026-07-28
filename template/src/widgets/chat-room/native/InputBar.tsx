// InputBar.tsx
// Platform-aware wrapper: iOS uses native RNInputBar, Android returns null.

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import {
  findNodeHandle,
  type HostComponent,
  type NativeSyntheticEvent,
  Platform,
  requireNativeComponent,
  StyleSheet,
  UIManager,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import {
  NativeInputBarAction,
  NativeInputBarAttachmentPressEventData as InputBarAttachmentPressEventData,
  NativeInputBarCancelInputActionEventData as InputBarCancelInputActionEventData,
  NativeInputBarCommands,
  NativeInputBarEditMessageEventData as InputBarEditMessageEventData,
  NativeInputBarInputTypingEventData as InputBarInputTypingEventData,
  NativeInputBarProps,
  NativeInputBarRecordingStateChangeEventData as InputBarRecordingStateChangeEventData,
  NativeInputBarSendMessageEventData as InputBarSendMessageEventData,
  NativeInputBarVoiceRecordingCancelEventData as InputBarVoiceRecordingCancelEventData,
  NativeInputBarVoiceRecordingEndEventData as InputBarVoiceRecordingEndEventData,
  NativeInputBarVoiceRecordingStartEventData as InputBarVoiceRecordingStartEventData,
} from "./NativeInputBarSpec";

// ─── Public types ─────────────────────────────────────────────────────────────

type InputBarTheme = "light" | "dark";

type InputBarInputActionType = "reply" | "edit" | "none";
type InputBarInputAction = {
  type: InputBarInputActionType;
  messageId?: string;
  senderName?: string;
  text?: string;
  hasImage?: boolean;
};

export type {
  InputBarAttachmentPressEventData,
  InputBarCancelInputActionEventData,
  InputBarEditMessageEventData,
  InputBarInputAction,
  InputBarInputActionType,
  InputBarInputTypingEventData,
  InputBarRecordingStateChangeEventData,
  InputBarSendMessageEventData,
  InputBarTheme,
  InputBarVoiceRecordingCancelEventData,
  InputBarVoiceRecordingEndEventData,
  InputBarVoiceRecordingStartEventData,
};

// ─── Imperative handle ────────────────────────────────────────────────────────

export interface InputBar {
  clearInput(): void;
  focus(): void;
  blur(): void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface InputBarProps extends ViewProps {
  theme?: InputBarTheme;
  placeholder?: string;
  inputAction?: InputBarInputAction | null;
  style?: ViewStyle;

  onSendMessage?: (event: InputBarSendMessageEventData) => void;
  onEditMessage?: (event: InputBarEditMessageEventData) => void;
  onCancelInputAction?: (event: InputBarCancelInputActionEventData) => void;
  onAttachmentPress?: (event: InputBarAttachmentPressEventData) => void;
  onVoiceRecordingStart?: (event: InputBarVoiceRecordingStartEventData) => void;
  onVoiceRecordingEnd?: (event: InputBarVoiceRecordingEndEventData) => void;
  onVoiceRecordingCancel?: (
    event: InputBarVoiceRecordingCancelEventData,
  ) => void;
  onInputTyping?: (event: InputBarInputTypingEventData) => void;
  onRecordingStateChange?: (
    event: InputBarRecordingStateChangeEventData,
  ) => void;
}

// ─── Native component ─────────────────────────────────────────────────────────

const COMPONENT_NAME = "RNInputBar";

const NativeInputBar = (() => {
  if (Platform.OS === "android") {
    return null;
  }
  try {
    const Spec = require("./NativeInputBarSpec").default;

    return Spec as HostComponent<NativeInputBarProps>;
  } catch {
    return requireNativeComponent<NativeInputBarProps>(COMPONENT_NAME);
  }
})();

// ─── Command dispatcher ───────────────────────────────────────────────────────

function dispatchCommand(
  nativeRef: React.RefObject<React.ComponentRef<
    HostComponent<NativeInputBarProps>
  > | null>,
  commandName: keyof NativeInputBarCommands,
  args: unknown[],
): void {
  try {
    const { Commands } = require("./NativeInputBarSpec");

    if (Commands?.[commandName] && nativeRef.current) {
      Commands[commandName](nativeRef.current, ...args);

      return;
    }
  } catch {
    /* fall through */
  }
  const node = findNodeHandle(nativeRef.current);

  if (node) {
    UIManager.dispatchViewManagerCommand(
      node,
      UIManager.getViewManagerConfig(COMPONENT_NAME).Commands[commandName],
      args,
    );
  }
}

// ─── InputBar ────────────────────────────────────────────────────────────────

export const InputBar = forwardRef<InputBar, InputBarProps>((props, ref) => {
  const {
    theme = "light",
    placeholder,
    inputAction,
    style,
    onSendMessage,
    onEditMessage,
    onCancelInputAction,
    onAttachmentPress,
    onVoiceRecordingStart,
    onVoiceRecordingEnd,
    onVoiceRecordingCancel,
    onInputTyping,
    onRecordingStateChange,
  } = props;

  const nativeRef =
    useRef<React.ComponentRef<HostComponent<NativeInputBarProps>>>(null);

  useImperativeHandle(
    ref,
    () => ({
      clearInput() {
        dispatchCommand(nativeRef, "clearInput", []);
      },
      focus() {
        dispatchCommand(nativeRef, "focus", []);
      },
      blur() {
        dispatchCommand(nativeRef, "blur", []);
      },
    }),
    [],
  );

  // ─── Event bridges ───────────────────────────────────────────────────────

  const handleSendMessage = useCallback(
    (e: NativeSyntheticEvent<InputBarSendMessageEventData>) =>
      onSendMessage?.(e.nativeEvent),
    [onSendMessage],
  );
  const handleEditMessage = useCallback(
    (e: NativeSyntheticEvent<InputBarEditMessageEventData>) =>
      onEditMessage?.(e.nativeEvent),
    [onEditMessage],
  );
  const handleCancelInputAction = useCallback(
    (e: NativeSyntheticEvent<InputBarCancelInputActionEventData>) =>
      onCancelInputAction?.(e.nativeEvent),
    [onCancelInputAction],
  );
  const handleAttachmentPress = useCallback(
    (e: NativeSyntheticEvent<InputBarAttachmentPressEventData>) =>
      onAttachmentPress?.(e.nativeEvent),
    [onAttachmentPress],
  );
  const handleVoiceRecordingStart = useCallback(
    (e: NativeSyntheticEvent<InputBarVoiceRecordingStartEventData>) =>
      onVoiceRecordingStart?.(e.nativeEvent),
    [onVoiceRecordingStart],
  );
  const handleVoiceRecordingEnd = useCallback(
    (e: NativeSyntheticEvent<InputBarVoiceRecordingEndEventData>) =>
      onVoiceRecordingEnd?.(e.nativeEvent),
    [onVoiceRecordingEnd],
  );
  const handleVoiceRecordingCancel = useCallback(
    (e: NativeSyntheticEvent<InputBarVoiceRecordingCancelEventData>) =>
      onVoiceRecordingCancel?.(e.nativeEvent),
    [onVoiceRecordingCancel],
  );
  const handleInputTyping = useCallback(
    (e: NativeSyntheticEvent<InputBarInputTypingEventData>) =>
      onInputTyping?.(e.nativeEvent),
    [onInputTyping],
  );
  const handleRecordingStateChange = useCallback(
    (e: NativeSyntheticEvent<InputBarRecordingStateChangeEventData>) =>
      onRecordingStateChange?.(e.nativeEvent),
    [onRecordingStateChange],
  );

  const nativeInputAction: NativeInputBarAction = inputAction ?? {
    type: "none",
  };

  if (!NativeInputBar) return null;

  return (
    <NativeInputBar
      ref={nativeRef}
      style={[styles.container, style]}
      theme={theme}
      placeholder={placeholder}
      inputAction={nativeInputAction}
      onSendMessage={handleSendMessage}
      onEditMessage={handleEditMessage}
      onCancelInputAction={handleCancelInputAction}
      onAttachmentPress={handleAttachmentPress}
      onVoiceRecordingStart={handleVoiceRecordingStart}
      onVoiceRecordingEnd={handleVoiceRecordingEnd}
      onVoiceRecordingCancel={handleVoiceRecordingCancel}
      onInputTyping={handleInputTyping}
      onRecordingStateChange={handleRecordingStateChange}
    />
  );
});

InputBar.displayName = "InputBar";

const styles = StyleSheet.create({
  container: {},
});
