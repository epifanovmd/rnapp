import { IApiService } from "@api";
import type {
  IProfileUpdateRequestDto,
  PrivacySettingsDto,
  ProfileDto,
  PublicProfileDto,
  UpdatePrivacySettingsPayload,
} from "@api/api-gen/data-contracts";
import { EntityHolder } from "@store";
import { makeAutoObservable } from "mobx";

import { IAuthStore } from "../auth/Auth.types";
import { IProfileStore } from "./ProfileStore.types";

@IProfileStore({ inSingleton: true })
export class ProfileStore implements IProfileStore {
  public profileHolder = new EntityHolder<ProfileDto>({
    onFetch: () => this._api.getMyProfile(),
  });

  public privacyHolder = new EntityHolder<PrivacySettingsDto>({
    onFetch: () => this._api.getPrivacySettings(),
  });

  constructor(
    @IApiService() private _api: IApiService,
    @IAuthStore() private _auth: IAuthStore,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async loadMyProfile() {
    await this.profileHolder.load();
  }

  async updateProfile(data: IProfileUpdateRequestDto) {
    const res = await this._api.updateMyProfile(data);

    if (res.data) {
      this.profileHolder.setData(res.data);
      // Also update profile in auth user holder
      await this._auth.load();
    }

    return res.data;
  }

  async loadPrivacy() {
    await this.privacyHolder.load();
  }

  async updatePrivacy(data: UpdatePrivacySettingsPayload) {
    const res = await this._api.updatePrivacySettings(data);

    if (res.data) {
      this.privacyHolder.setData(res.data);
    }

    return res.data;
  }

  async setUsername(username: string) {
    const res = await this._api.setUsername({ username });

    if (res.data) {
      // Reload auth user to pick up new username
      await this._auth.load();
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
    const res = await this._api.verifyEmail({ code });

    if (res.data) {
      await this._auth.load();
    }

    return res;
  }

  handleProfileUpdated(profile: PublicProfileDto) {
    const data = this.profileHolder.data;

    if (data) {
      this.profileHolder.setData({
        ...data,
        ...profile,
      });
    }
  }

  handleUsernameChanged(username: string | null) {
    this._auth.handleUsernameChanged(username);
  }

  handlePrivacyChanged(settings: PrivacySettingsDto) {
    this.privacyHolder.setData(settings);
  }
}
