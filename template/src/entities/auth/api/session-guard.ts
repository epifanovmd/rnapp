import { IMainSession } from "@shared/api";
import { IAuthSessionGuard } from "@shared/lib/contracts";
import type { ITokenSession } from "@shared/lib/session";
import { parseJwt } from "@shared/lib/session";
import { injectable } from "inversify";

import { IAuthStore } from "../model/types";

@injectable()
export class AuthSessionGuard implements IAuthSessionGuard {
  constructor(
    @IAuthStore() private _authStore: IAuthStore,
    @IMainSession() private _session: ITokenSession,
  ) {}

  isCurrentSession(sessionId: string): boolean {
    const payload = parseJwt(this._session.accessToken);

    return (payload?.sessionId as string | undefined) === sessionId;
  }

  signOut(): void {
    this._authStore.signOut();
  }
}
