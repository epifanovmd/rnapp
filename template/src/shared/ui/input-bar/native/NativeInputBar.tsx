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
} from "react-native";

import type {
  IInputBarRef,
  InputBarAttachmentPressEventData,
  InputBarCancelInputActionEventData,
  InputBarEditMessageEventData,
  InputBarInputTypingEventData,
  InputBarProps,
  InputBarRecordingStateChangeEventData,
  InputBarSendMessageEventData,
  InputBarVoiceRecordingCancelEventData,
  InputBarVoiceRecordingEndEventData,
  InputBarVoiceRecordingStartEventData,
  NativeInputBarAction,
  NativeInputBarProps,
} from "../types";
import type { NativeInputBarCommands } from "./NativeInputBarSpec";

const COMPONENT_NAME = "RNInputBar";

const RNInputBar = (() => {
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

/**
 * iOS-обёртка над нативным RNInputBar (InputBarView из IOSChatView pod).
 * Реализация-эталон; используется через публичную точку входа InputBar.
 */
export const NativeInputBar = forwardRef<IInputBarRef, InputBarProps>(
  (props, ref) => {
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

    if (!RNInputBar) return null;

    return (
      <RNInputBar
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
  },
);

NativeInputBar.displayName = "NativeInputBar";

const styles = StyleSheet.create({
  container: {},
});
