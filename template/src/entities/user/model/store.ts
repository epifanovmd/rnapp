import { IApiService } from "@shared/api";
import {
  IProfileUpdateRequestDto,
  KnownPermission,
  KnownRole,
  PrivacySettingsDto,
  ProfileDto,
  UpdatePrivacySettingsBody,
  UserDto,
} from "@shared/api/gen/model";
import { EntityHolder } from "@shared/lib/holders";
import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

import {
  canAccess,
  computeEffectivePermissions,
  isAdminRole,
} from "../lib/permissions";
import { ProfileModel } from "./profile-model";
import { IUserStore } from "./types";
import { UserModel } from "./user-model";

@injectable()
class UserStore implements IUserStore {
  private _holder = new EntityHolder<UserDto>({
    onFetch: () => this._api.getMyUser(),
  });

  public privacyHolder = new EntityHolder<PrivacySettingsDto>({
    onFetch: () => this._api.getPrivacySettings(),
  });

  constructor(@IApiService() private _api: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get user() {
    return this._holder.data;
  }

  get model() {
    return this.user ? new UserModel(this.user) : null;
  }

  get profile() {
    return this.user?.profile
      ? new ProfileModel({ user: this.user, ...this.user.profile })
      : null;
  }

  get roles(): KnownRole[] {
    return this.user?.roles.map(r => r.name as KnownRole) ?? [];
  }

  get directPermissions(): KnownPermission[] {
    return (
      this.user?.directPermissions.map(p => p.name as KnownPermission) ?? []
    );
  }

  get permissions(): KnownPermission[] {
    const rolePerms =
      this.user?.roles.flatMap(r =>
        r.permissions.map(p => p.name as KnownPermission),
      ) ?? [];

    return computeEffectivePermissions(rolePerms, this.directPermissions);
  }

  get isAdmin(): boolean {
    return isAdminRole(this.roles);
  }

  get privacy() {
    return this.privacyHolder.data;
  }

  get error() {
    return this._holder.error?.message;
  }

  get isLoading() {
    return this._holder.isLoading;
  }

  get isReady() {
    return this._holder.isReady;
  }

  can(permission: KnownPermission): boolean {
    return canAccess(this.roles, this.permissions, permission);
  }

  hasRole(role: KnownRole): boolean {
    return this.roles.includes(role);
  }

  seed(user: UserDto) {
    this._holder.setData(user);
  }

  /** Точечно обновить поля текущего пользователя (например, из socket-события). */
  patchUser(patch: Partial<UserDto>) {
    const user = this._holder.data;

    if (!user) return;

    this._holder.setData({ ...user, ...patch });
  }

  /** Точечно обновить профиль текущего пользователя. */
  patchProfile(patch: Partial<ProfileDto>) {
    const user = this._holder.data;

    if (!user?.profile) return;

    this._holder.setData({
      ...user,
      profile: { ...user.profile, ...patch },
    });
  }

  /** Точечно обновить privacy-настройки (например, из socket-события). */
  patchPrivacy(settings: PrivacySettingsDto) {
    this.privacyHolder.setData(settings);
  }

  load() {
    // Уже есть данные — обновляем «тихо», иначе полная загрузка со спиннером.
    return this._holder.isFilled ? this._holder.refresh() : this._holder.load();
  }

  refresh() {
    return this._holder.refresh();
  }

  async updateProfile(data: IProfileUpdateRequestDto) {
    const res = await this._api.updateMyProfile(data);
    const user = this._holder.data;

    if (res.data && user) {
      this._holder.setData({ ...user, profile: res.data });
    }

    return res;
  }

  async loadPrivacy() {
    await this.privacyHolder.load();
  }

  async updatePrivacy(data: UpdatePrivacySettingsBody) {
    const res = await this._api.updatePrivacySettings(data);

    if (res.data) {
      this.privacyHolder.setData(res.data);
    }

    return res.data;
  }

  async setUsername(username: string) {
    const res = await this._api.setUsername({ username });

    if (res.data) {
      this.patchUser({ username });
    }

    return res;
  }

  async changePassword(password: string) {
    return this._api.changePassword({ password });
  }

  async requestVerifyEmail() {
    return this._api.requestVerifyEmail();
  }

  async verifyEmail(code: string) {
    const res = await this._api.verifyEmail(code);

    if (res.data) {
      this.patchUser({ emailVerified: true });
    }

    return res;
  }

  async deleteMyAccount() {
    await this._api.deleteMyUser();
    this.reset();
  }

  reset() {
    this._holder.reset();
  }
}

export { UserStore };
