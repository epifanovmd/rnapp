import { IUserSocketService } from "@shared/lib/socket";
import { injectable } from "inversify";

import { ISessionStore } from "./session-types";
import { IUserRealtime, IUserStore } from "./types";

@injectable()
export class UserRealtime implements IUserRealtime {
  constructor(
    @IUserSocketService() private _userSocket: IUserSocketService,
    @IUserStore() private _userStore: IUserStore,
    @ISessionStore() private _sessionStore: ISessionStore,
  ) {}

  initialize() {
    return this._userSocket.subscribe({
      onProfileUpdated: profile => {
        if (profile.userId !== this._userStore.user?.id) return;
        this._userStore.patchProfile(profile);
      },
      onUsernameChanged: ({ username }) => {
        this._userStore.patchUser({ username });
      },
      onEmailVerified: ({ verified }) => {
        this._userStore.patchUser({ emailVerified: verified });
      },
      onPrivilegesChanged: () => {
        this._userStore.refresh();
      },
      onPrivacyChanged: settings => {
        this._userStore.patchPrivacy(settings);
      },
      onNewSession: session => {
        this._sessionStore.handleNewSession(session);
      },
      onSessionTerminated: ({ sessionId }) => {
        this._sessionStore.handleSessionTerminated(sessionId);
      },
    });
  }
}
