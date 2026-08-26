import { ViewStyle } from "react-native";

export type InputBarInputActionType = "reply" | "edit" | "none";

/** Текущее действие панели: ответ на сообщение или его редактирование. */
export type InputBarInputAction = {
  type: InputBarInputActionType;
  messageId?: string;
  senderName?: string;
  text?: string;
  hasImage?: boolean;
};

/** Результат записи голосового сообщения. */
export type InputBarVoiceRecording = {
  /** file:// путь к записанному аудиофайлу. */
  fileUrl: string;
  /** Длительность записи в секундах. */
  duration: number;
  /** Значения амплитуды для волновой формы. */
  waveform?: number[];
};

/** Императивный интерфейс панели. */
export interface IInputBarRef {
  /** Очистить поле ввода. */
  clearInput(): void;
  /** Показать клавиатуру. */
  focus(): void;
  /** Скрыть клавиатуру. */
  blur(): void;
}

export interface InputBarProps {
  /** Текущее действие: ответ/редактирование. */
  inputAction?: InputBarInputAction | null;
  style?: ViewStyle;

  /** Отправка сообщения. */
  onSendMessage?: (text: string, replyToId?: string) => void;
  /** Подтверждение редактирования. */
  onEditMessage?: (text: string, messageId: string) => void;
  /** Отмена действия ввода. */
  onCancelInputAction?: (type: InputBarInputActionType) => void;
  /** Нажатие на кнопку вложений. */
  onAttachmentPress?: () => void;
  /** Запись голосового завершена — файл, длительность, волна. */
  onVoiceRecordingComplete?: (recording: InputBarVoiceRecording) => void;
  /** Набор текста. */
  onInputTyping?: (text: string) => void;
  /** Изменение состояния записи. */
  onRecordingStateChange?: (isRecording: boolean) => void;
  /** Собственная высота панели изменилась (RN задаёт размер сам). */
  onHeightChange?: (height: number) => void;
}
