interface INavigationStateLike {
  type: string;
  key: string;
  routes: { key: string; state?: { key?: string } }[];
}

/** Минимум навигации, нужный для поиска: состояние и родитель. */
export interface INavigationLike {
  getState: () => INavigationStateLike | undefined;
  getParent: () => INavigationLike | undefined;
}

/**
 * Ключ экрана ближайшего стека, внутри которого находится экран `routeKey`:
 * сам экран, если он в стеке, иначе экран стека, держащий его навигатор.
 * `null` — стека над экраном нет (анимации открытия ждать нечего).
 */
export const findStackRouteKey = (
  navigation: INavigationLike,
  routeKey: string,
): string | null => {
  let current: INavigationLike | undefined = navigation;
  let key: string | undefined = routeKey;

  while (current && key) {
    const state = current.getState();

    if (!state) return null;
    if (state.type === "stack") return key;

    const parent = current.getParent();
    const parentState = parent?.getState();

    key = parentState?.routes.find(route => route.state?.key === state.key)
      ?.key;
    current = parent;
  }

  return null;
};
