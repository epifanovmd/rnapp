import { iocHook } from "@force-dev/react-mobile";
import { Interval } from "@force-dev/utils";
import { reaction } from "mobx";

import { IApiService } from "../../api";
import { navigationRef } from "../../navigation";
import { IProfileDataStore } from "../profile";
import { ISessionDataStore } from "./SessionData.types";

export const useSessionDataStore = iocHook(ISessionDataStore);

@ISessionDataStore()
export class SessionDataStore implements ISessionDataStore {
  private _interval = new Interval({ timeout: 60000 });

  constructor(
    @IApiService() private _apiService: IApiService,
    @IProfileDataStore() private _profileDataStore: IProfileDataStore,
  ) {}

  initialize = () => {
    this._apiService.onError(async ({ status, error }) => {
      console.log("status", status);
      console.log("error", error);

      if (status === 401) {
        navigationRef.navigate("Authorization", {});
      }

      if (status === 403) {
        await this._profileDataStore.restoreRefreshToken();
      }
    });

    return [
      reaction(
        () => this._profileDataStore.profile,
        profile => {
          if (profile) {
            this._interval.start(async () => {
              await this._profileDataStore.restoreRefreshToken();
            });
          } else {
            this._interval.stop();
          }
        },
        { fireImmediately: true },
      ),
      () => this._interval.stop(),
    ];
  };

  restore = async () => {
    const token = await this._profileDataStore.restoreRefreshToken();

    if (token) {
      await this._profileDataStore.getProfile();
    }

    return this._profileDataStore.profile;
  };
}
