import { SessionDto } from "@api/api-gen/data-contracts";
import { createServiceDecorator } from "@di";
import { CollectionHolder, MutationHolder } from "@store/holders";

export const ISessionStore = createServiceDecorator<ISessionStore>();

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
