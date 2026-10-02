import {
  findRouteKeyByName,
  findRoutePath,
  INavigationStateLike,
  isPathFocused,
  resolveStackRouteKey,
} from "./route-path";
import { ITransitionTracker } from "./transition-tracker";

/** Чего ждать: активности экрана и конца анимации его открытия. */
export interface IScreenReadyConditions {
  /** Ждать, пока экран станет активным. По умолчанию `true`. */
  waitForFocus?: boolean;
  /** Ждать конца анимации открытия ближайшего экрана стека. По умолчанию `true`. */
  waitForTransition?: boolean;
}

export interface IScreenReadyOptions extends IScreenReadyConditions {
  /** Пауза после выполнения условий, мс. По умолчанию 0. */
  delay?: number;
  /**
   * Страховка, мс: анимация считается завершённой, даже если события не
   * пришло (стек без `screenTransitionListeners`). По умолчанию 1000.
   */
  timeout?: number;
}

/** Откуда сервис берёт состояние навигации и память об анимациях. */
export interface IScreenReadinessSource {
  getRootState: () => Partial<INavigationStateLike> | undefined;
  subscribeState: (listener: () => void) => () => void;
  tracker: ITransitionTracker;
}

export interface IScreenReadiness {
  /** Готов ли экран сейчас (без задержки и таймаута). */
  isReady: (routeKey: string, conditions?: IScreenReadyConditions) => boolean;
  /** Оповещение о любом изменении, способном поменять готовность. */
  subscribe: (listener: () => void) => () => void;
  /** Вызвать `callback` один раз, когда экран станет готов; возвращает отмену. */
  onReady: (
    routeKey: string,
    callback: () => void,
    options?: IScreenReadyOptions,
  ) => () => void;
  /** То же промисом — для кода вне React (сервисы, сторы). */
  whenReady: (routeKey: string, options?: IScreenReadyOptions) => Promise<void>;
  /**
   * Дождаться экрана по имени маршрута: он появится в дереве и станет готов;
   * `callback` получает его ключ. Из одноимённых — верхний.
   */
  onRouteReady: (
    name: string,
    callback: (routeKey: string) => void,
    options?: IScreenReadyOptions,
  ) => () => void;
  /** То же промисом; резолвится ключом экрана. */
  whenRouteReady: (
    name: string,
    options?: IScreenReadyOptions,
  ) => Promise<string>;
}

const DEFAULT_TIMEOUT = 1000;

/**
 * Готовность экрана вне React: экран активен и анимация открытия ближайшего
 * экрана стека закончилась. Экран, которого нет в дереве навигации, готов
 * сразу — ждать нечего.
 */
export const createScreenReadiness = (
  source: IScreenReadinessSource,
): IScreenReadiness => {
  const check = (
    routeKey: string,
    { waitForFocus = true, waitForTransition = true }: IScreenReadyConditions,
    transitionTimedOut: boolean,
  ) => {
    const path = findRoutePath(source.getRootState(), routeKey);

    if (!path) return true;
    if (waitForFocus && !isPathFocused(path)) return false;
    if (!waitForTransition || transitionTimedOut) return true;

    const stackRouteKey = resolveStackRouteKey(path);

    return stackRouteKey === null || source.tracker.isOpened(stackRouteKey);
  };

  const subscribe = (listener: () => void) => {
    const offTracker = source.tracker.subscribe(listener);
    const offState = source.subscribeState(listener);

    return () => {
      offTracker();
      offState();
    };
  };

  /**
   * Ожидание готовности экрана, ключ которого вычисляется на каждой проверке:
   * `null` — экрана ещё нет в дереве, ждать дальше.
   */
  const waitFor = (
    resolveKey: () => string | null,
    callback: (routeKey: string) => void,
    { delay = 0, timeout = DEFAULT_TIMEOUT, ...conditions }: IScreenReadyOptions,
  ) => {
    let done = false;
    let timedOut = false;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe = () => {};

    const cancel = () => {
      done = true;
      unsubscribe();
      clearTimeout(delayTimer);
      clearTimeout(timeoutTimer);
    };

    const finish = (routeKey: string) => {
      if (done) return;
      cancel();
      callback(routeKey);
    };

    const evaluate = () => {
      if (done || delayTimer !== undefined) return;

      const routeKey = resolveKey();

      if (routeKey === null || !check(routeKey, conditions, timedOut)) return;

      if (delay > 0) {
        delayTimer = setTimeout(() => finish(routeKey), delay);
      } else {
        finish(routeKey);
      }
    };

    unsubscribe = subscribe(evaluate);

    if (conditions.waitForTransition !== false) {
      timeoutTimer = setTimeout(() => {
        timedOut = true;
        evaluate();
      }, timeout);
    }

    evaluate();

    return cancel;
  };

  const onReady: IScreenReadiness["onReady"] = (
    routeKey,
    callback,
    options = {},
  ) => waitFor(() => routeKey, () => callback(), options);

  const onRouteReady: IScreenReadiness["onRouteReady"] = (
    name,
    callback,
    options = {},
  ) =>
    waitFor(
      () => findRouteKeyByName(source.getRootState(), name),
      callback,
      options,
    );

  return {
    isReady: (routeKey, conditions = {}) => check(routeKey, conditions, false),
    subscribe,
    onReady,
    whenReady: (routeKey, options) =>
      new Promise(resolve => {
        onReady(routeKey, resolve, options);
      }),
    onRouteReady,
    whenRouteReady: (name, options) =>
      new Promise(resolve => {
        onRouteReady(name, resolve, options);
      }),
  };
};
