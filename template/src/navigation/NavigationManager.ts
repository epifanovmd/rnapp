import {iocDecorator, iocHook} from '@force-dev/utils';
import {
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';
import {ScreenName, ScreenParamsTypes} from './navigation.types';
import {makeAutoObservable, runInAction} from 'mobx';
import {identity, pickBy} from 'lodash';

export const navigationRef = createNavigationContainerRef<ScreenParamsTypes>();

export const INavigationManager = iocDecorator<NavigationManager>();
export const useNavigationManager = iocHook(INavigationManager);

const routesHistoryReduce = (arr: any[]) => {
  const result = arr.reduce((acc, item) => {
    acc.push(
      pickBy(
        {
          screen: item.name,
          params: item.params,
        },
        identity,
      ),
    );

    if (item.state) {
      return [
        ...acc,
        ...routesHistoryReduce([item.state.routes[item.state.index]]),
      ];
    }

    return acc;
  }, []) as {
    screen: ScreenName;
    params: ScreenParamsTypes[ScreenName];
  }[];

  return result;
};

@INavigationManager({inSingleton: true})
export class NavigationManager {
  history: {screen: ScreenName; params: ScreenParamsTypes[ScreenName]}[] = [];
  private _navigationRef = navigationRef;

  constructor() {
    makeAutoObservable(this, {}, {autoBind: true});

    this._navigationRef.addListener('state', e => {
      runInAction(() => {
        this.history = routesHistoryReduce(e.data.state?.routes || []);
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
