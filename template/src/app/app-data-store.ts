import { IAuthStore } from "@entities/auth";
import { IUserRealtime, IUserStore } from "@entities/user";
import { ISocketTransport } from "@shared/lib/socket";
import { disposer, InitializeDispose } from "@shared/lib/utils";
import { injectable } from "inversify";
import { makeAutoObservable, reaction } from "mobx";

import { IAppDataStore } from "./app-data-types";

@injectable()
export class AppDataStore implements IAppDataStore {
  constructor(
    @IAuthStore() private _authStore: IAuthStore,
    @ISocketTransport() private _socketTransport: ISocketTransport,
    @IUserStore() private _userStore: IUserStore,
    @IUserRealtime() private _userRealtime: IUserRealtime,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    const socketDisposers = new Set<InitializeDispose>();

    return [
      reaction(
        () => this._authStore.isAuthenticated,
        isAuthenticated => {
          if (isAuthenticated) {
            this._userStore.load();
            socketDisposers.add(this._socketTransport.initialize());
            socketDisposers.add(this._userRealtime.initialize());
          } else {
            disposer(Array.from(socketDisposers));
            socketDisposers.clear();
          }
        },
      ),
      () => {
        disposer(Array.from(socketDisposers));
        socketDisposers.clear();
      },
    ];
  }
}
