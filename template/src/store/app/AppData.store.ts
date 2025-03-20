import { disposer, InitializeDispose, Interval } from "@force-dev/utils";
import { makeAutoObservable, reaction } from "mobx";

import { IApiService } from "~@api";
import { ISocketService } from "~@service";

import { INavigationService, NavigationService } from "../../navigation";
import { ISessionDataStore } from "../session";
import { IAppDataStore } from "./AppData.types";

@IAppDataStore()
export class AppDataStore implements IAppDataStore {
  private _interval = new Interval({ timeout: 6000 });

  constructor(
    @ISessionDataStore() public sessionDataStore: ISessionDataStore,
    @IApiService() private _apiService: IApiService,
    @ISocketService() private _socketService: ISocketService,
    @INavigationService() private _navigationService: NavigationService,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    const disposers = new Set<InitializeDispose>();

    this._apiService.onError(async ({ status }) => {
      if (status === 401 && this.sessionDataStore.isAuthorized) {
        this.sessionDataStore.clear();

        this._navigationService.navigateTo("Authorization");
      }

      if (status === 403) {
        const { accessToken } = await this.sessionDataStore.updateToken();

        if (!accessToken) {
          this._navigationService.navigateTo("Authorization");
        }
      }
    });

    disposers.add(this.sessionDataStore.initialize());

    return [
      reaction(
        () => this.sessionDataStore.isAuthorized,
        isAuthorized => {
          if (isAuthorized) {
            // disposers.add(this._socketService.initialize());

            this._interval.start(async () => {
              await this.sessionDataStore.updateToken();
            });
          } else {
            this._interval.stop();

            disposer(Array.from(disposers));
            disposers.clear();
          }
        },
      ),
      () => this._interval.stop(),
      () => {
        disposer(Array.from(disposers));
        disposers.clear();
      },
    ];
  }
}
