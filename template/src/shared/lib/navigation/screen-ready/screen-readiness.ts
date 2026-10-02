import {
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

  const onReady: IScreenReadiness["onReady"] = (
    routeKey,
    callback,
    { delay = 0, timeout = DEFAULT_TIMEOUT, ...conditions } = {},
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

    const finish = () => {
      if (done) return;
      cancel();
      callback();
    };

    const evaluate = () => {
      if (done || delayTimer !== undefined) return;
      if (!check(routeKey, conditions, timedOut)) return;

      if (delay > 0) {
        delayTimer = setTimeout(finish, delay);
      } else {
        finish();
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

  return {
    isReady: (routeKey, conditions = {}) => check(routeKey, conditions, false),
    subscribe,
    onReady,
    whenReady: (routeKey, options) =>
      new Promise(resolve => {
        onReady(routeKey, resolve, options);
      }),
  };
};
