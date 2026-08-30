/**
 * Содержимое сообщения: разбор по виду.
 *
 * Новый вид добавляется здесь одной веткой союза, его представление — файлом в
 * `ui/contents` и строкой в реестре `MessageContentView`. Всё остальное —
 * список, цитаты, панель ответа — берёт вид из реестра и о нём не знает.
 */
export type MessageContent =
  | { kind: "text"; text: string }
  | { kind: "image"; url: string; caption?: string };

export type MessageKind = MessageContent["kind"];

/** Содержимое конкретного вида. */
export type MessageContentOf<TKind extends MessageKind> = Extract<
  MessageContent,
  { kind: TKind }
>;

/** Сообщение переписки. */
export interface IChatMessage {
  id: string;
  content: MessageContent;
  authorId: string;
  authorName: string;
  /** Отправлено текущим пользователем. */
  isOwn: boolean;
  /** Время отправки, мс epoch. */
  createdAt: number;
  /** Сообщение, на которое отвечает это. */
  replyToId?: string;
  /** Содержимое правилось после отправки. */
  isEdited?: boolean;
}
