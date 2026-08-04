import { AnyChatContentType } from "../define-content";
import { filesContent } from "./files";
import { imagesContent } from "./images";
import { pollContent } from "./poll";
import { voiceContent } from "./voice";

export * from "./files";
export * from "./images";
export * from "./poll";
export * from "./voice";

/**
 * Встроенные типы контента. Порядок разбора задаётся `priority` дескриптора,
 * а не порядком в массиве: poll (40) > files (30) > voice (20) > images (10).
 */
export const CHAT_BUILTIN_CONTENT: readonly AnyChatContentType[] = [
  pollContent,
  filesContent,
  voiceContent,
  imagesContent,
];
