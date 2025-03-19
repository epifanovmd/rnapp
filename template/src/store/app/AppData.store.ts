import { disposer, InitializeDispose, Interval } from "@force-dev/utils";
import { makeAutoObservable, reaction } from "mobx";

import { IApiService } from "~@api";
import { ISocketService } from "~@service";

import { INavigationService, NavigationService } from "../../navigation";
import { IProfileDataStore } from "../profile";
import { ISessionDataStore } from "../session";
import { IAppDataStore } from "./AppData.types";

@IAppDataStore()
export class AppDataStore implements IAppDataStore {
  private _interval = new Interval({ timeout: 6000 });

  constructor(
    @IApiService() private _apiService: IApiService,
    @IProfileDataStore() private _profileDataStore: IProfileDataStore,
    @ISocketService() private _socketService: ISocketService,
    @ISessionDataStore() private _sessionDataStore: ISessionDataStore,
    @INavigationService() private _navigationService: NavigationService,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    const disposers = new Set<InitializeDispose>();

    this._apiService.onError(async ({ status }) => {
      if (status === 401 && this._sessionDataStore.isAuthorized) {
        this._navigationService.navigateTo("Authorization");
      }

      if (status === 403) {
        await this.restoreToken();
      }
    });

    return [
      reaction(
        () => this._profileDataStore.profile,
        profile => {
          if (profile) {
            disposers.add(this._socketService.initialize());

            this._interval.start(async () => {
              await this.restoreToken();
            });
          } else {
            disposer(Array.from(disposers));
            disposers.clear();
            this._interval.stop();
          }
        },
      ),
      () => this._sessionDataStore.initialize(),
      () => this._interval.stop(),
      () => {
        disposer(Array.from(disposers));
        disposers.clear();
      },
    ];
  }

  restoreToken() {
    return this._profileDataStore.updateToken();
  }
}
