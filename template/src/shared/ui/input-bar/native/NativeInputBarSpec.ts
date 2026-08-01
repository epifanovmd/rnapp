// NativeInputBarSpec.ts
// Native InputBar specification with codegen types.

import React from "react";
import type { HostComponent, ViewProps } from "react-native";
import { codegenNativeCommands } from "react-native";
import { codegenNativeComponent } from "react-native";
import type {
  DirectEventHandler,
  Double,
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

export type NativeInputBarVoiceRecordingCompleteEventData = {
  /** file:// путь к записанному аудиофайлу */
  fileUrl: string;
  /** Длительность записи в секундах */
  duration: Double;
  /** Значения амплитуды для волновой формы */
  waveform?: Double[];
};

/** Собственная высота панели — RN задаёт размер, поэтому нужен обратный канал. */
export type NativeInputBarHeightChangeEventData = {
  height: Double;
};

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
  onVoiceRecordingComplete?: DirectEventHandler<NativeInputBarVoiceRecordingCompleteEventData>;
  onInputTyping?: DirectEventHandler<NativeInputBarInputTypingEventData>;
  onRecordingStateChange?: DirectEventHandler<NativeInputBarRecordingStateChangeEventData>;
  onHeightChange?: DirectEventHandler<NativeInputBarHeightChangeEventData>;
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
