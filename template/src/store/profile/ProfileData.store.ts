import { DataHolder } from "@force-dev/utils";
import { makeAutoObservable } from "mobx";

import { IProfile, IProfileService } from "~@service";

import { IProfileDataStore } from "./ProfileData.types";

@IProfileDataStore({ inSingleton: true })
export class ProfileDataStore implements IProfileDataStore {
  public holder = new DataHolder<IProfile>();

  constructor(@IProfileService() private _profileService: IProfileService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get profile() {
    return this.holder.d;
  }

  get isLoading() {
    return this.holder.isLoading;
  }

  get isError() {
    return this.holder.isError;
  }

  get isEmpty() {
    return this.holder.isEmpty;
  }

  async getProfile() {
    this.holder.setLoading();

    const res = await this._profileService.getProfile();

    if (res.error) {
      this.holder.setError({ msg: res.error.message });
    } else if (res.data) {
      this.holder.setData(res.data);

      return res.data;
    }

    return undefined;
  }
}
