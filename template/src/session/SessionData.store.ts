import {makeAutoObservable, reaction} from 'mobx';
import {iocDecorator} from '@force-dev/utils';
import {iocHook} from '@force-dev/react-mobile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {INavigationService, NavigationService} from '../navigation';

export const ISessionDataStore = iocDecorator<SessionDataStore>();
export const useSessionDataStore = iocHook(ISessionDataStore);

@ISessionDataStore({inSingleton: true})
export class SessionDataStore {
  private _token: string = '';
  private _authorized: boolean = false;

  constructor(@INavigationService() private _nav: NavigationService) {
    makeAutoObservable(this, {}, {autoBind: true});

    AsyncStorage.getItem('token').then(res => {
      if (res) {
        this.setToken(res);
      }
    });

    reaction(
      () => this.token,
      token => {
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
      AsyncStorage.removeItem('token').then();
    } else {
      AsyncStorage.setItem('token', token).then();
    }
    this._token = token ?? '';
  }

  clearToken() {
    this.setToken('');
  }
}
