import { IApiService } from "@shared/api";
import type { SessionDto } from "@shared/api/gen/model";
import { IAuthSessionGuard } from "@shared/lib/contracts";
import { CollectionHolder, MutationHolder } from "@shared/lib/holders";
import { createModelMapper } from "@shared/lib/models";
import { injectable } from "inversify";
import { action, makeAutoObservable } from "mobx";

import { SessionModel } from "./session-model";
import { ISessionStore } from "./session-types";

@injectable()
export class SessionStore implements ISessionStore {
  public sessionsHolder = new CollectionHolder<SessionDto>({
    keyExtractor: s => s.id,
  });
  public terminateMutation = new MutationHolder<string, void>();

  private _toModels = createModelMapper<SessionDto, SessionModel>(
    s => s.id,
    s => new SessionModel(s),
  );

  constructor(
    @IApiService() private _api: IApiService,
    @IAuthSessionGuard() private _authGuard: IAuthSessionGuard,
  ) {
    makeAutoObservable(
      this,
      { handleSessionTerminated: action },
      { autoBind: true },
    );
  }

  get sessions() {
    return this.sessionsHolder.items;
  }

  get sessionModels() {
    return this._toModels(this.sessionsHolder.items);
  }

  get isLoading() {
    return this.sessionsHolder.isLoading;
  }

  async load() {
    await this.sessionsHolder.fromApi(() => this._api.getSessions());
  }

  async terminateSession(sessionId: string) {
    await this.terminateMutation.execute(sessionId, async id => {
      const res = await this._api.terminateSession(id);

      if (!res.error) {
        this.sessionsHolder.removeItem(id);
      }

      return res;
    });
  }

  async terminateOtherSessions() {
    await this._api.terminateOtherSessions();
    await this.load();
  }

  handleNewSession(session: SessionDto) {
    this.sessionsHolder.appendIfNotExists(session.id, session);
  }

  handleSessionTerminated(sessionId: string) {
    this.sessionsHolder.removeItem(sessionId);

    // If the terminated session is the current one → force logout
    if (this._authGuard.isCurrentSession(sessionId)) {
      this._authGuard.signOut();
    }
  }
}
