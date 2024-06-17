import { iocHook } from "@force-dev/react-mobile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable, reaction, runInAction } from "mobx";

import { INavigationService, NavigationService } from "../../navigation";
import { ISessionDataStore } from "./SessionData.types";

export const useSessionDataStore = iocHook(ISessionDataStore);

@ISessionDataStore({ inSingleton: true })
export class SessionDataStore implements ISessionDataStore {
  private _token: string = "";
  private _authorized: boolean = false;

  constructor(@INavigationService() private _nav: NavigationService) {
    AsyncStorage.getItem("access_token").then(token => {
      if (token)
        runInAction(() => {
          this._token = token;
        });
    });

    makeAutoObservable(this, {}, { autoBind: true });

    reaction(
      () => this.token,
      token => {
        console.log("access_token", token);
        if (!token) {
          this.setAuthorized(false);
          // this._nav.replaceTo('ScreenAuthorization', {});
        }
      },
    );
  }

  get token() {
    return this._token;
  }

  get isAuthorized() {
    return this._authorized && !!this.token;
  }

  setAuthorized(status: boolean) {
    this._authorized = status;
  }

  setToken(token?: string) {
    if (!token) {
      AsyncStorage.removeItem("token").then();
    } else {
      AsyncStorage.setItem("token", token).then();
    }
    this._token = token ?? "";
  }

  clearToken() {
    this.setToken("");
  }
}
