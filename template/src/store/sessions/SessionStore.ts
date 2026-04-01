import { IApiService } from "@api";
import type { SessionDto } from "@api/api-gen/data-contracts";
import { IAuthTokenStore } from "@core/auth";
import { CollectionHolder, MutationHolder } from "@store/holders";
import { createModelMapper, SessionModel } from "@store/models";
import { action, makeAutoObservable } from "mobx";

import { IAuthStore } from "../auth/Auth.types";
import { ISessionStore } from "./SessionStore.types";

@ISessionStore({ inSingleton: true })
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
    @IAuthStore() private _authStore: IAuthStore,
    @IAuthTokenStore() private _tokenStore: IAuthTokenStore,
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
      const res = await this._api.terminateSession({ id });

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
    const currentSessionId = this._getCurrentSessionId();

    if (currentSessionId && currentSessionId === sessionId) {
      this._authStore.signOut();
    }
  }

  /** Extract sessionId from the current access token JWT payload. */
  private _getCurrentSessionId(): string | null {
    const token = this._tokenStore.accessToken;

    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      return payload.sessionId ?? null;
    } catch {
      return null;
    }
  }
}
