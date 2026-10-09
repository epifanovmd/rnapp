import type { IAgentEventDto } from "./iAgentEventDto";

/**
 * Страница по курсору: ленты, где записи добавляются во время чтения
 * (сообщения, события). Курсор непрозрачен для клиента.
 */
export interface ICursorPageDtoIAgentEventDto {
  items: IAgentEventDto[];
  /**
   * Курсор следующей страницы; `null` — страниц больше нет.
   * @nullable
   */
  nextCursor: string | null;
}
