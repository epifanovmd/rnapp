import type { AuditEventDto } from "./auditEventDto";

/**
 * Страница по курсору: ленты, где записи добавляются во время чтения
 * (сообщения, события). Курсор непрозрачен для клиента.
 */
export interface ICursorPageDtoAuditEventDto {
  items: AuditEventDto[];
  /**
   * Курсор следующей страницы; `null` — страниц больше нет.
   * @nullable
   */
  nextCursor: string | null;
}
