import { ViewProps, ViewStyle } from "react-native";

import type {
  NativeInputBarAction,
  NativeInputBarAttachmentPressEventData,
  NativeInputBarCancelInputActionEventData,
  NativeInputBarEditMessageEventData,
  NativeInputBarInputTypingEventData,
  NativeInputBarProps,
  NativeInputBarRecordingStateChangeEventData,
  NativeInputBarSendMessageEventData,
  NativeInputBarVoiceRecordingCancelEventData,
  NativeInputBarVoiceRecordingEndEventData,
  NativeInputBarVoiceRecordingStartEventData,
} from "./native/NativeInputBarSpec";

// ─── Доменные типы (эталон — codegen-спек RNInputBar) ────────────────────────

export type InputBarTheme = "light" | "dark";
export type InputBarInputActionType = "reply" | "edit" | "none";

export type InputBarInputAction = {
  type: InputBarInputActionType;
  messageId?: string;
  senderName?: string;
  text?: string;
  hasImage?: boolean;
};

export type { NativeInputBarAction, NativeInputBarProps };

export type InputBarSendMessageEventData = NativeInputBarSendMessageEventData;
export type InputBarEditMessageEventData = NativeInputBarEditMessageEventData;
export type InputBarCancelInputActionEventData =
  NativeInputBarCancelInputActionEventData;
export type InputBarAttachmentPressEventData =
  NativeInputBarAttachmentPressEventData;
export type InputBarVoiceRecordingStartEventData =
  NativeInputBarVoiceRecordingStartEventData;
export type InputBarVoiceRecordingEndEventData =
  NativeInputBarVoiceRecordingEndEventData;
export type InputBarVoiceRecordingCancelEventData =
  NativeInputBarVoiceRecordingCancelEventData;
export type InputBarInputTypingEventData = NativeInputBarInputTypingEventData;
export type InputBarRecordingStateChangeEventData =
  NativeInputBarRecordingStateChangeEventData;

// ─── Императивный интерфейс ──────────────────────────────────────────────────

export interface IInputBarRef {
  /** Очистить поле ввода. */
  clearInput(): void;
  /** Показать клавиатуру. */
  focus(): void;
  /** Скрыть клавиатуру. */
  blur(): void;
}

// ─── Пропсы ──────────────────────────────────────────────────────────────────

export interface InputBarProps extends ViewProps {
  /** Тема оформления: "light" | "dark". */
  theme?: InputBarTheme;
  /** Текст плейсхолдера поля ввода. */
  placeholder?: string;
  /** Текущее действие: ответ/редактирование. */
  inputAction?: InputBarInputAction | null;
  style?: ViewStyle;

  /** Отправка сообщения. */
  onSendMessage?: (event: InputBarSendMessageEventData) => void;
  /** Подтверждение редактирования. */
  onEditMessage?: (event: InputBarEditMessageEventData) => void;
  /** Отмена действия ввода. */
  onCancelInputAction?: (event: InputBarCancelInputActionEventData) => void;
  /** Нажатие на кнопку вложений. */
  onAttachmentPress?: (event: InputBarAttachmentPressEventData) => void;
  /** Началась запись голосового. */
  onVoiceRecordingStart?: (event: InputBarVoiceRecordingStartEventData) => void;
  /** Запись завершена (отправка). */
  onVoiceRecordingEnd?: (event: InputBarVoiceRecordingEndEventData) => void;
  /** Запись отменена. */
  onVoiceRecordingCancel?: (
    event: InputBarVoiceRecordingCancelEventData,
  ) => void;
  /** Набор текста. */
  onInputTyping?: (event: InputBarInputTypingEventData) => void;
  /** Изменение состояния записи. */
  onRecordingStateChange?: (
    event: InputBarRecordingStateChangeEventData,
  ) => void;
}
