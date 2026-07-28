import { ITokenSource } from "@shared/api";
import { injectable } from "inversify";

import { IAuthSessionService } from "./types";

@injectable()
export class AuthTokenSource implements ITokenSource {
  constructor(@IAuthSessionService() private _session: IAuthSessionService) {}

  get accessToken(): string {
    return this._session.accessToken;
  }

  ensureFreshToken(): Promise<void> {
    return this._session.ensureFreshToken();
  }

  refreshToken(): Promise<void> {
    return this._session.refreshToken();
  }
}
