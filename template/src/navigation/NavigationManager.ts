import {iocDecorator, iocHook} from '@force-dev/utils';
import {createNavigationContainerRef} from '@react-navigation/native';
import {ScreenParamsTypes} from './navigation.types';
import {makeAutoObservable} from 'mobx';

export const navigationRef = createNavigationContainerRef<ScreenParamsTypes>();

export const INavigationManager = iocDecorator<NavigationManager>();
export const useNavigationManager = iocHook(INavigationManager);

@INavigationManager()
export class NavigationManager {
  private _navigationRef = navigationRef;

  constructor() {
    makeAutoObservable(this, {}, {autoBind: true});
  }

  get isReady() {
    return this._navigationRef.isReady();
  }

  get canGoBack() {
    return this.isReady && this._navigationRef.canGoBack();
  }

  get currentRoute() {
    if (this.isReady) {
      return this._navigationRef.getCurrentRoute();
    }
  }

  goBack() {
    if (this.canGoBack) {
      this._navigationRef.goBack();
    }
  }

  navigateTo: typeof navigationRef.navigate = (...args: any) => {
    if (this.isReady) {
      this._navigationRef.navigate(...args);
    }
  };
}
