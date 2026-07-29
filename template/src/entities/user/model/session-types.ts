import { SessionDto } from "@shared/api/gen/model";
import { createInjectDecorator } from "@shared/lib/di";
import { CollectionHolder, MutationHolder } from "@shared/lib/holders";

export const ISessionStore =
  createInjectDecorator<ISessionStore>("ISessionStore");

export interface ISessionStore {
  sessionsHolder: CollectionHolder<SessionDto>;
  terminateMutation: MutationHolder<string>;

  sessions: SessionDto[];
  isLoading: boolean;

  load(): Promise<void>;
  terminateSession(sessionId: string): Promise<void>;
  terminateOtherSessions(): Promise<void>;

  handleNewSession(session: SessionDto): void;
  handleSessionTerminated(sessionId: string): void;
}
