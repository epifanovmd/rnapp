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
  requireNativeComponent,
  StyleSheet,
  UIManager,
} from "react-native";

import type {
  IInputBarRef,
  InputBarAttachmentPressEventData,
  InputBarCancelInputActionEventData,
  InputBarEditMessageEventData,
  InputBarHeightChangeEventData,
  InputBarInputTypingEventData,
  InputBarProps,
  InputBarRecordingStateChangeEventData,
  InputBarSendMessageEventData,
  InputBarVoiceRecordingCompleteEventData,
  NativeInputBarAction,
  NativeInputBarProps,
} from "../types";
import type { NativeInputBarCommands } from "./NativeInputBarSpec";

const COMPONENT_NAME = "RNInputBar";

const RNInputBar = (() => {
  try {
    const spec = require("./NativeInputBarSpec").default;

    return spec as HostComponent<NativeInputBarProps>;
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
  const { Commands } = require("./NativeInputBarSpec");

  if (Commands?.[commandName] && nativeRef.current) {
    Commands[commandName](nativeRef.current, ...args);

    return;
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
 * Обёртка над нативной панелью ввода: на iOS это InputBarView,
 * на Android — Kotlin-реализация того же компонента.
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
      onVoiceRecordingComplete,
      onInputTyping,
      onRecordingStateChange,
      onHeightChange,
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
    const handleVoiceRecordingComplete = useCallback(
      (e: NativeSyntheticEvent<InputBarVoiceRecordingCompleteEventData>) =>
        onVoiceRecordingComplete?.(e.nativeEvent),
      [onVoiceRecordingComplete],
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
    const handleHeightChange = useCallback(
      (e: NativeSyntheticEvent<InputBarHeightChangeEventData>) =>
        onHeightChange?.(e.nativeEvent),
      [onHeightChange],
    );

    const nativeInputAction: NativeInputBarAction = inputAction ?? {
      type: "none",
    };

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
        onVoiceRecordingComplete={handleVoiceRecordingComplete}
        onInputTyping={handleInputTyping}
        onRecordingStateChange={handleRecordingStateChange}
        onHeightChange={handleHeightChange}
      />
    );
  },
);

NativeInputBar.displayName = "NativeInputBar";

const styles = StyleSheet.create({
  container: {},
});
