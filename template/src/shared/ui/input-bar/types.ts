import { ViewProps, ViewStyle } from "react-native";

import type {
  NativeInputBarAction,
  NativeInputBarAttachmentPressEventData,
  NativeInputBarCancelInputActionEventData,
  NativeInputBarEditMessageEventData,
  NativeInputBarHeightChangeEventData,
  NativeInputBarInputTypingEventData,
  NativeInputBarProps,
  NativeInputBarRecordingStateChangeEventData,
  NativeInputBarSendMessageEventData,
  NativeInputBarVoiceRecordingCompleteEventData,
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
export type InputBarVoiceRecordingCompleteEventData =
  NativeInputBarVoiceRecordingCompleteEventData;
export type InputBarInputTypingEventData = NativeInputBarInputTypingEventData;
export type InputBarRecordingStateChangeEventData =
  NativeInputBarRecordingStateChangeEventData;
export type InputBarHeightChangeEventData = NativeInputBarHeightChangeEventData;

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
  /** Запись голосового завершена — файл, длительность, волна. */
  onVoiceRecordingComplete?: (
    event: InputBarVoiceRecordingCompleteEventData,
  ) => void;
  /** Набор текста. */
  onInputTyping?: (event: InputBarInputTypingEventData) => void;
  /** Изменение состояния записи. */
  onRecordingStateChange?: (
    event: InputBarRecordingStateChangeEventData,
  ) => void;
  /** Собственная высота панели изменилась (RN задаёт размер сам). */
  onHeightChange?: (event: InputBarHeightChangeEventData) => void;
}
