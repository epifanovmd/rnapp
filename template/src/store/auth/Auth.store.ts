import { IApiService } from "@api";
import {
  I2FARequiredDto,
  ISignInRequestDto,
  ISignInResponseDto,
  ITokensDto,
  IUserWithTokensDto,
  KnownPermission,
  KnownRole,
  TSignUpRequestDto,
  UserDto,
} from "@api/api-gen/data-contracts";
import { IAuthSessionService } from "@core/auth";
import {
  canAccess,
  computeEffectivePermissions,
  isAdminRole,
} from "@core/permissions";
import { EntityHolder } from "@store";
import { ProfileModel } from "@store/models";
import { createEnumModelBase } from "@store/models";
import { makeAutoObservable } from "mobx";

import { AuthStatus, IAuthStore } from "./Auth.types";

const AuthStatusModel = createEnumModelBase<typeof AuthStatus>(AuthStatus);

@IAuthStore({ inSingleton: true })
class AuthStore implements IAuthStore {
  private statusModel = new AuthStatusModel(() => this.status);
  public status = AuthStatus.Idle;

  private _userHolder = new EntityHolder<UserDto>({
    onFetch: () => this._api.getMyUser(),
  });
  private _signHolder = new EntityHolder<
    IUserWithTokensDto,
    ISignInRequestDto
  >();
  private _signUpHolder = new EntityHolder<IUserWithTokensDto>();

  constructor(
    @IApiService() private _api: IApiService,
    @IAuthSessionService() private _session: IAuthSessionService,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get user() {
    return this._userHolder.data;
  }

  get roles(): KnownRole[] {
    return this.user?.roles.map(r => r.name) ?? [];
  }

  get directPermissions(): KnownPermission[] {
    return this.user?.directPermissions.map(p => p.name) ?? [];
  }

  get permissions(): KnownPermission[] {
    const rolePerms =
      this.user?.roles.flatMap(r => r.permissions.map(p => p.name)) ?? [];

    return computeEffectivePermissions(rolePerms, this.directPermissions);
  }

  get isAdmin(): boolean {
    return isAdminRole(this.roles);
  }

  hasPermission(required: KnownPermission): boolean {
    return canAccess(this.roles, this.permissions, required);
  }

  get profile() {
    return this.user?.profile
      ? new ProfileModel({
          user: this.user,
          ...this.user.profile,
        })
      : null;
  }

  get error() {
    return (
      this._signHolder.error?.message ??
      this._signUpHolder.error?.message ??
      this._userHolder.error?.message
    );
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

  public load() {
    if (this.user) {
      return this._userHolder.refresh();
    }

    return this._userHolder.load();
  }

  async signIn(
    params: ISignInRequestDto,
  ): Promise<ISignInResponseDto | undefined> {
    this._setStatus(AuthStatus.Loading);

    const res = await this._api.signIn(params);

    if (res.error) {
      this._signHolder.setError(res.error.message);
      this._setStatus(AuthStatus.Unauthenticated);

      return undefined;
    }

    if (res.data) {
      const data = res.data;

      // 2FA required — return as-is, don't authenticate
      if ((data as I2FARequiredDto).require2FA) {
        this._setStatus(AuthStatus.Unauthenticated);

        return data;
      }

      const { tokens, ...userDto } = data as IUserWithTokensDto;

      this._session.setTokens(tokens.accessToken, tokens.refreshToken);
      this._userHolder.setData(userDto);
      await this.load();
      this._setStatus(AuthStatus.Authenticated);

      return data;
    }

    return undefined;
  }

  async signUp(params: TSignUpRequestDto) {
    this._setStatus(AuthStatus.Loading);

    const res = await this._signUpHolder.fromApi(() =>
      this._api.signUp(params),
    );

    if (res.error) {
      this._setStatus(AuthStatus.Unauthenticated);

      return;
    }

    if (res.data) {
      const { tokens, ...userDto } = res.data;

      this._session.setTokens(tokens.accessToken, tokens.refreshToken);
      this._userHolder.setData(userDto);
      this._setStatus(AuthStatus.Authenticated);
    }
  }

  async restore(tokens?: ITokensDto) {
    this._setStatus(AuthStatus.Loading);

    if (tokens) {
      this._session.setTokens(tokens.accessToken, tokens.refreshToken);
    } else {
      const ok = await this._session.restoreSession();

      if (!ok) {
        this._setStatus(AuthStatus.Unauthenticated);

        return;
      }
    }

    const { data } = await this.load();

    this._setStatus(
      data ? AuthStatus.Authenticated : AuthStatus.Unauthenticated,
    );
  }

  signOut() {
    this._session.clearTokens();
    this._userHolder.reset();
    this._signHolder.reset();
    this._signUpHolder.reset();
    this._setStatus(AuthStatus.Unauthenticated);
  }

  async deleteMyAccount() {
    await this._api.deleteMyUser();
    this.signOut();
  }

  // ── Password Reset ────────────────────────────────────────────────

  async requestResetPassword(login: string) {
    return this._api.requestResetPassword({ login });
  }

  async resetPassword(token: string, password: string) {
    return this._api.resetPassword({ token, password });
  }

  // ── 2FA ────────────────────────────────────────────────────────────

  async enable2Fa(password: string, hint?: string) {
    return this._api.enable2Fa({ password, hint });
  }

  async disable2Fa(password: string) {
    return this._api.disable2Fa({ password });
  }

  async verify2Fa(twoFactorToken: string, password: string) {
    const res = await this._api.verify2Fa({ twoFactorToken, password });

    if (res.data) {
      const { tokens, ...userDto } = res.data;

      this._session.setTokens(tokens.accessToken, tokens.refreshToken);
      this._userHolder.setData(userDto);
      this._setStatus(AuthStatus.Authenticated);
    }

    return res;
  }

  // ── Socket handlers ────────────────────────────────────────────────

  handleEmailVerified() {
    const user = this._userHolder.data;

    if (user) {
      this._userHolder.setData({ ...user, emailVerified: true });
    }
  }

  handlePasswordChanged() {
    this.signOut();
  }

  handlePrivilegesChanged() {
    this.load();
  }

  handle2faChanged(_enabled: boolean) {
    this.load();
  }

  handleUsernameChanged(username: string | null) {
    const user = this._userHolder.data;

    if (user) {
      this._userHolder.setData({ ...user, username });
    }
  }

  private _setStatus(status: AuthStatus) {
    this.status = status;
  }
}
