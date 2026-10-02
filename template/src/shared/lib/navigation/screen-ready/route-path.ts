/** Состояние навигатора в объёме, нужном для поиска: тип, индекс, маршруты. */
export interface INavigationStateLike {
  type?: string;
  index?: number;
  routes: readonly IRouteLike[];
}

export interface IRouteLike {
  /** У частичного (ещё не инициализированного) состояния ключа может не быть. */
  key?: string;
  /** Вложенный навигатор; у ещё не открытого бывает частичным или пустым. */
  state?: Partial<INavigationStateLike>;
}

/** Шаг пути от корня до экрана: навигатор, маршрут в нём, активен ли он там. */
export interface IRoutePathEntry {
  navigatorType: string | undefined;
  routeKey: string;
  focused: boolean;
}

const focusedIndex = (state: Partial<INavigationStateLike>) =>
  state.index ??
  (state.type === "stack" ? (state.routes?.length ?? 1) - 1 : 0);

/**
 * Путь от корня дерева навигации до экрана `routeKey`; `null` — экрана в
 * дереве нет.
 */
export const findRoutePath = (
  state: Partial<INavigationStateLike> | undefined,
  routeKey: string,
): IRoutePathEntry[] | null => {
  if (!state?.routes) return null;

  const active = focusedIndex(state);

  for (let index = 0; index < state.routes.length; index++) {
    const route = state.routes[index];

    if (!route.key) continue;

    const entry: IRoutePathEntry = {
      navigatorType: state.type,
      routeKey: route.key,
      focused: index === active,
    };

    if (route.key === routeKey) return [entry];

    const nested = findRoutePath(route.state, routeKey);

    if (nested) return [entry, ...nested];
  }

  return null;
};

/**
 * Ключ ближайшего экрана стека на пути: сам экран, если он в стеке, иначе
 * экран стека, внутри которого лежит его навигатор. `null` — стека нет.
 */
export const resolveStackRouteKey = (path: IRoutePathEntry[]) => {
  for (let index = path.length - 1; index >= 0; index--) {
    if (path[index].navigatorType === "stack") return path[index].routeKey;
  }

  return null;
};

/** Экран активен: активен на каждом уровне пути от корня. */
export const isPathFocused = (path: IRoutePathEntry[]) =>
  path.every(entry => entry.focused);
