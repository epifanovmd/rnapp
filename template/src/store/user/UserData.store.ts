import { IApiService } from "@api";
import { UserDto } from "@api/api-gen/data-contracts";
import { DataHolder } from "@force-dev/utils";
import { makeAutoObservable } from "mobx";

import { IUserDataStore } from "./UserData.types";

@IUserDataStore({ inSingleton: true })
class UserDataStore implements IUserDataStore {
  public holder = new DataHolder<UserDto>();

  constructor(@IApiService() private _apiService: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get user() {
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

  async getUser() {
    this.holder.setLoading();

    const res = await this._apiService.getMyUser();

    if (res.error) {
      this.holder.setError(res.error.message);
    } else if (res.data) {
      this.holder.setData(res.data);

      return res.data;
    }

    return undefined;
  }
}
