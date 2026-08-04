import { ChatMessage } from "../types";
import { ChatContentBlock, ChatContentTypeId } from "./content-types";
import { AnyChatContentType } from "./define-content";

/**
 * Реестр типов контента: разбор сообщения и поиск дескриптора по id.
 *
 * Собирается один раз и дальше неизменен — ссылка на реестр живёт в контексте
 * чата, и её смена инвалидировала бы мемоизацию всех ячеек.
 */
export class ChatContentRegistry {
  private readonly _byId = new Map<string, AnyChatContentType>();
  /** Порядок разбора: по убыванию приоритета. */
  private readonly _ordered: AnyChatContentType[];

  constructor(types: readonly AnyChatContentType[]) {
    for (const type of types) {
      if (__DEV__ && this._byId.has(type.id)) {
        console.warn(
          `[chat-view] Тип контента "${type.id}" объявлен повторно — ` +
            "используется последний дескриптор.",
        );
      }

      this._byId.set(type.id, type);
    }

    this._ordered = [...this._byId.values()].sort(
      (a, b) => b.priority - a.priority,
    );
  }

  /** Дескриптор по id разобранного блока. */
  get(id: ChatContentTypeId): AnyChatContentType | undefined {
    return this._byId.get(id);
  }

  /** Контент сообщения: первый по приоритету тип, распознавший сообщение. */
  parse(message: ChatMessage): ChatContentBlock | undefined {
    for (const type of this._ordered) {
      const content = type.parse(message);

      if (content !== undefined) {
        return { ...content, type: type.id } as ChatContentBlock;
      }
    }

    return undefined;
  }
}

export const createChatContentRegistry = (
  types: readonly AnyChatContentType[],
): ChatContentRegistry => new ChatContentRegistry(types);

/** Заглушка для значения контекста по умолчанию — реальный реестр даёт провайдер. */
export const EMPTY_CHAT_CONTENT_REGISTRY = new ChatContentRegistry([]);
