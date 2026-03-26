import { disposer, InitializeDispose } from "@common/ioc";
import { INavigationService, NavigationService } from "@core/navigation";
import { ISocketTransport } from "@socket";
import { makeAutoObservable, reaction } from "mobx";

import { IAuthStore } from "../auth";
import { IAppDataStore } from "./AppData.types";

@IAppDataStore()
export class AppDataStore implements IAppDataStore {
  constructor(
    @IAuthStore() public authStore: IAuthStore,
    @ISocketTransport() private _socketTransport: ISocketTransport,
    @INavigationService() private _navigationService: NavigationService,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    const disposers = new Set<InitializeDispose>();

    return [
      reaction(
        () => this.authStore.isAuthenticated,
        isAuthenticated => {
          if (isAuthenticated) {
            disposers.add(this._socketTransport.initialize());
          } else {
            disposer(Array.from(disposers));
            disposers.clear();

            this._navigationService.navigateTo("SignIn");
          }
        },
      ),
      () => {
        disposer(Array.from(disposers));
        disposers.clear();
      },
    ];
  }
}
