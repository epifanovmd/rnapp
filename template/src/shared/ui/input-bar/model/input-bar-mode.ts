import type { IVoiceRecorderResult } from "../services";

/** Доменные типы панели ввода. */

/** Режим панели: обычный ввод, ответ на сообщение или редактирование. */
export type InputBarMode =
  | { type: "normal" }
  | {
      type: "reply";
      messageId: string;
      senderName?: string;
      text?: string;
      hasImage: boolean;
    }
  | { type: "edit"; messageId: string; text: string };

/** Состояние записи голосового: свободно / идёт / зафиксировано замком. */
export type RecordingState = "idle" | "recording" | "locked";

/** Наружный контракт панели. */
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

/** Императивный API ядра: очистка поля, фокус и снятие фокуса. */
export interface IInputBarViewRef {
  clearInput(): void;
  focus(): void;
  blur(): void;
}
