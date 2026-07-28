// NativeInputBarSpec.ts
// Native InputBar specification with codegen types.

import React from "react";
import type { HostComponent, ViewProps } from "react-native";
import { codegenNativeCommands } from "react-native";
import { codegenNativeComponent } from "react-native";
import type {
  DirectEventHandler,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type NativeInputBarAction = {
  type: string;
  messageId?: string;
  senderName?: string;
  text?: string;
  hasImage?: boolean;
};

// ─── Event payloads ───────────────────────────────────────────────────────────

export type NativeInputBarSendMessageEventData = {
  text: string;
  replyToId?: string;
};

export type NativeInputBarEditMessageEventData = {
  text: string;
  messageId: string;
};

export type NativeInputBarCancelInputActionEventData = {
  type: string;
};

export type NativeInputBarAttachmentPressEventData = {};

export type NativeInputBarVoiceRecordingStartEventData = {};
export type NativeInputBarVoiceRecordingEndEventData = {};
export type NativeInputBarVoiceRecordingCancelEventData = {};

export type NativeInputBarInputTypingEventData = {
  text: string;
};

export type NativeInputBarRecordingStateChangeEventData = {
  isRecording: boolean;
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NativeInputBarProps extends ViewProps {
  theme?: WithDefault<string, "light">;
  placeholder?: string;
  inputAction?: NativeInputBarAction | null;

  onSendMessage?: DirectEventHandler<NativeInputBarSendMessageEventData>;
  onEditMessage?: DirectEventHandler<NativeInputBarEditMessageEventData>;
  onCancelInputAction?: DirectEventHandler<NativeInputBarCancelInputActionEventData>;
  onAttachmentPress?: DirectEventHandler<NativeInputBarAttachmentPressEventData>;
  onVoiceRecordingStart?: DirectEventHandler<NativeInputBarVoiceRecordingStartEventData>;
  onVoiceRecordingEnd?: DirectEventHandler<NativeInputBarVoiceRecordingEndEventData>;
  onVoiceRecordingCancel?: DirectEventHandler<NativeInputBarVoiceRecordingCancelEventData>;
  onInputTyping?: DirectEventHandler<NativeInputBarInputTypingEventData>;
  onRecordingStateChange?: DirectEventHandler<NativeInputBarRecordingStateChangeEventData>;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

export interface NativeInputBarCommands {
  clearInput(
    viewRef: React.ComponentRef<HostComponent<NativeInputBarProps>>,
  ): void;
  focus(viewRef: React.ComponentRef<HostComponent<NativeInputBarProps>>): void;
  blur(viewRef: React.ComponentRef<HostComponent<NativeInputBarProps>>): void;
}

export const Commands = codegenNativeCommands<NativeInputBarCommands>({
  supportedCommands: ["clearInput", "focus", "blur"],
});

export default codegenNativeComponent<NativeInputBarProps>(
  "RNInputBar",
) as HostComponent<NativeInputBarProps>;
