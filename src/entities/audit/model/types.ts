import type { AuditEventDto } from "@shared/api/gen/main/model";
import { createInjectDecorator, type SupportInitialize } from "@shared/lib/di";
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
  /** Новое событие (сокет) — в начало загруженной ленты; повтор — без дубля. */
  prepend(event: AuditEventDto): void;
  reset(): void;
}

export const IAuditRealtime =
  createInjectDecorator<IAuditRealtime>("IAuditRealtime");

/** Подписка на свои новые события журнала (`audit:created`) на время сессии. */
export type IAuditRealtime = SupportInitialize;
