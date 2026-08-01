/** Порт InputBarMode. */
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

/** Порт RecordingState. */
export type RecordingState = "idle" | "recording" | "locked";
