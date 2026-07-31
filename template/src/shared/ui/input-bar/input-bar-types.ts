/** Порт InputBarMode. */
export type ChatInputMode =
  | { type: "normal" }
  | {
      type: "reply";
      messageId: string;
      senderName?: string;
      text?: string;
      hasImage: boolean;
    }
  | { type: "edit"; messageId: string; text: string };

/** Порт RecordingState. */
export type ChatRecordingState = "idle" | "recording" | "locked";
