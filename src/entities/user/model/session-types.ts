import { SessionDto } from "@shared/api/gen/main/model";
import { createInjectDecorator } from "@shared/lib/di";
import { CollectionHolder, MutationHolder } from "@shared/lib/holders";
import { ApiError, ApiResponse } from "@shared/lib/http";

export const ISessionStore =
  createInjectDecorator<ISessionStore>("ISessionStore");

export interface ISessionStore {
  sessionsHolder: CollectionHolder<SessionDto>;
  terminateMutation: MutationHolder<string>;

  sessions: SessionDto[];
  isLoading: boolean;

  load(): Promise<void>;
  terminateSession(sessionId: string): Promise<void>;
  /** Завершить все сессии, кроме текущей; ошибку показывает потребитель. */
  terminateOtherSessions(): Promise<ApiResponse<void, ApiError>>;

  /** Сбросить список сессий (выход: следующий вход — возможно, другой человек). */
  reset(): void;

  handleNewSession(session: SessionDto): void;
  handleSessionTerminated(sessionId: string): void;
}
