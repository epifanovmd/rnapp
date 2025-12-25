import { IApiService } from "@api";
import { disposer, InitializeDispose, Interval } from "@force-dev/utils";
import {
  INavigationService,
  ISocketService,
  NavigationService,
} from "@service";
import { makeAutoObservable, reaction } from "mobx";

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

            this._navigationService.navigateTo("SignIn", {});
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
