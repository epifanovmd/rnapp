import {iocDecorator, iocHook} from '@force-dev/utils';
import {
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';
import {ScreenName, ScreenParamsTypes} from './navigation.types';
import {makeAutoObservable, runInAction} from 'mobx';
import {identity, pickBy} from 'lodash';
import {Route} from '@react-navigation/routers/src/types';

export const navigationRef = createNavigationContainerRef<ScreenParamsTypes>();

export const INavigationManager = iocDecorator<NavigationManager>();
export const useNavigationManager = iocHook(INavigationManager);

@INavigationManager({inSingleton: true})
export class NavigationManager<SN extends ScreenName = ScreenName> {
  history: {screen: ScreenName; params: ScreenParamsTypes[ScreenName]}[] = [];
  // params: ScreenParamsTypes[SN] = {};
  private _navigationRef = navigationRef;

  constructor() {
    makeAutoObservable(this, {}, {autoBind: true});

    this._navigationRef.addListener('state', e => {
      runInAction(() => {
        this.history = e.data.state?.routes.map(item =>
          pickBy(
            {
              screen: item.name,
              params: item.params,
            },
            identity,
          ),
        ) as {screen: ScreenName; params: ScreenParamsTypes[ScreenName]}[];
      });

      console.log('Nav History -> ', JSON.stringify(this.history));
    });
  }

  get isReady() {
    return this._navigationRef.isReady();
  }

  get canGoBack() {
    return this.isReady && this._navigationRef.canGoBack();
  }

  get route() {
    if (this.isReady) {
      return this._navigationRef.getCurrentRoute() as Route<
        SN,
        ScreenParamsTypes[SN]
      >;
    }
  }

  get params() {
    return this.route?.params;
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

  replaceTo = <T extends ScreenName>(name: T, params: ScreenParamsTypes[T]) => {
    if (this.isReady) {
      this._navigationRef.dispatch(StackActions.replace(name, params));
    }
  };

  pushTo = <T extends ScreenName>(name: T, params: ScreenParamsTypes[T]) => {
    if (this.isReady) {
      this._navigationRef.dispatch(StackActions.push(name, params));
    }
  };
}
