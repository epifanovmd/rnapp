import type { IVoiceRecorderResult } from "./voice-recorder";

/**
 * Делегат InputBarView — порт InputBarDelegate из пода.
 */
export interface IInputBarViewDelegate {
  onSend(text: string, replyToId: string | undefined): void;
  onEdit(text: string, messageId: string): void;
  onCancelMode(type: "reply" | "edit" | "none"): void;
  onTapAttachment(): void;
  onVoiceRecordingComplete(result: IVoiceRecorderResult): void;
  onVoiceRecordingCancelled?(): void;
  onChangeText(text: string): void;
  onRecordingStateChanged(isRecording: boolean): void;
}

/** Императивный API ядра (порт clearInput/activateKeyboard/dismissKeyboard). */
export interface IInputBarViewRef {
  clearInput(): void;
  focus(): void;
  blur(): void;
}
