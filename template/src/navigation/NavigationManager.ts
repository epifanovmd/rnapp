import {iocDecorator, iocHook} from '@force-dev/utils';
import {createNavigationContainerRef} from '@react-navigation/native';
import {ScreenName, ScreenParamsTypes} from './navigation.types';
import {makeAutoObservable} from 'mobx';
import {Route} from '@react-navigation/routers/src/types';

export const navigationRef = createNavigationContainerRef<ScreenParamsTypes>();

export const INavigationManager = iocDecorator<NavigationManager>();
export const useNavigationManager = iocHook(INavigationManager);

@INavigationManager()
export class NavigationManager<SN extends ScreenName = ScreenName> {
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
      return this._navigationRef.getCurrentRoute() as Route<
        SN,
        ScreenParamsTypes[SN]
      >;
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
