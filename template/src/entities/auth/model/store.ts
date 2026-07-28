import { IApiService } from "@shared/api";
import {
  I2FARequiredDto,
  ISignInRequestDto,
  ISignInResponseDto,
  ITokensDto,
  TSignUpRequestDto,
} from "@shared/api/gen/model";
import { createEnumModelBase } from "@shared/lib/models";
import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

import { IAuthSessionService } from "../api/types";
import { AuthStatus, IAuthStore } from "./types";

const AuthStatusModel = createEnumModelBase<typeof AuthStatus>(AuthStatus);

/** Стор аутентификации и сессии: состояние, переходы и вызовы auth-эндпоинтов API. */
@injectable()
class AuthStore implements IAuthStore {
  private statusModel = new AuthStatusModel(() => this.status);
  public status = AuthStatus.Idle;

  public twoFactorToken: string | null = null;
  public twoFactorHint?: string;
  public verifyError?: string;

  constructor(
    @IApiService() private _api: IApiService,
    @IAuthSessionService() private _session: IAuthSessionService,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });

    // При форсированном завершении сессии (refresh не удался) — signOut
    this._session.onSessionExpired(() => this.signOut());
  }

  get error() {
    return this.verifyError ?? undefined;
  }

  get isTwoFactorRequired() {
    return this.twoFactorToken !== null;
  }

  get isIdle() {
    return this.statusModel.isIdle;
  }

  get isAuthenticated() {
    return this.statusModel.isAuthenticated;
  }

  get isLoading() {
    return this.statusModel.isLoading;
  }

  get isReady() {
    return !this.isIdle && !this.isLoading;
  }

  async signIn(params: ISignInRequestDto) {
    this._setStatus(AuthStatus.Loading);
    this.twoFactorToken = null;
    this.twoFactorHint = undefined;
    this.verifyError = undefined;

    const res = await this._api.signIn(params);

    if (res.error) {
      this.verifyError = res.error.message;
      this._setStatus(AuthStatus.Unauthenticated);

      return;
    }

    if (!res.data) {
      this.verifyError = "Unknown error";
      this._setStatus(AuthStatus.Unauthenticated);

      return;
    }

    if (this._isTwoFactorResponse(res.data)) {
      this.twoFactorToken = res.data.twoFactorToken;
      this.twoFactorHint = res.data.twoFactorHint;
      this._setStatus(AuthStatus.Unauthenticated);

      return;
    }

    const { tokens } = res.data;

    this._session.setTokens(tokens.accessToken, tokens.refreshToken);
    this._setStatus(AuthStatus.Authenticated);
  }

  async verify2FA(password: string) {
    if (!this.twoFactorToken) return;

    this._setStatus(AuthStatus.Loading);
    this.verifyError = undefined;

    const res = await this._api.verify2FA({
      twoFactorToken: this.twoFactorToken,
      password,
    });

    if (res.error) {
      this.verifyError = res.error.message;
      this._setStatus(AuthStatus.Unauthenticated);

      return;
    }

    if (!res.data) {
      this.verifyError = "Unknown error";
      this._setStatus(AuthStatus.Unauthenticated);

      return;
    }

    const { tokens } = res.data;

    this._session.setTokens(tokens.accessToken, tokens.refreshToken);
    this.twoFactorToken = null;
    this.twoFactorHint = undefined;
    this._setStatus(AuthStatus.Authenticated);
  }

  async signUp(params: TSignUpRequestDto) {
    this._setStatus(AuthStatus.Loading);

    const res = await this._api.signUp(params);

    if (res.error || !res.data) {
      this._setStatus(AuthStatus.Unauthenticated);

      return;
    }

    const { tokens } = res.data;

    this._session.setTokens(tokens.accessToken, tokens.refreshToken);
    this._setStatus(AuthStatus.Authenticated);
  }

  async restore(tokens?: ITokensDto) {
    this._setStatus(AuthStatus.Loading);

    let ok: boolean;

    if (tokens) {
      this._session.setTokens(tokens.accessToken, tokens.refreshToken);
      ok = true;
    } else {
      ok = await this._session.restoreSession();
    }

    this._setStatus(ok ? AuthStatus.Authenticated : AuthStatus.Unauthenticated);
  }

  signOut() {
    this._session.clearTokens();
    this.twoFactorToken = null;
    this.twoFactorHint = undefined;
    this.verifyError = undefined;
    this._setStatus(AuthStatus.Unauthenticated);
  }

  private _setStatus(status: AuthStatus) {
    this.status = status;
  }

  private _isTwoFactorResponse(
    data: ISignInResponseDto,
  ): data is I2FARequiredDto {
    return (data as I2FARequiredDto).require2FA === true;
  }
}

export { AuthStore };
