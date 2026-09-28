import type { AuditEventDto } from "@shared/api/gen/main/model";
import { createInjectDecorator } from "@shared/lib/di";
import type { CursorHolder } from "@shared/lib/holders";

export const IAuditStore = createInjectDecorator<IAuditStore>("IAuditStore");

/** Журнал безопасности текущего пользователя; страницы — по курсору сервера. */
export interface IAuditStore {
  readonly eventsHolder: CursorHolder<AuditEventDto>;
  readonly events: AuditEventDto[];

  /** Первая страница (новые события — первыми). */
  load(): Promise<void>;
  /** Следующая страница по `nextCursor`, если она есть. */
  loadMore(): Promise<void>;
  reset(): void;
}
