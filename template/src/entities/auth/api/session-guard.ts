import { IAuthSessionGuard } from "@shared/lib/contracts";
import { injectable } from "inversify";

import { IAuthStore } from "../model/types";
import { IAuthJwtService } from "./jwt-types";
import { IAuthSessionService } from "./types";

@injectable()
export class AuthSessionGuard implements IAuthSessionGuard {
  constructor(
    @IAuthStore() private _authStore: IAuthStore,
    @IAuthSessionService() private _session: IAuthSessionService,
    @IAuthJwtService() private _jwt: IAuthJwtService,
  ) {}

  isCurrentSession(sessionId: string): boolean {
    const token = this._session.accessToken;

    if (!token) return false;

    const payload = this._jwt.parse(token);

    return (payload?.sessionId as string | undefined) === sessionId;
  }

  signOut(): void {
    this._authStore.signOut();
  }
}
