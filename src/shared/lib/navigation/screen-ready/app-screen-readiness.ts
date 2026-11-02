import { navigationRef } from "../navigation.ref";
import type { RouteName } from "../navigation.types";
import { createScreenReadiness } from "./screen-readiness";
import { screenTransitions } from "./transition-tracker";

/**
 * Готовность экранов приложения: состояние — из `navigationRef`, анимации —
 * из `screenTransitions`. Вне React: `screenReadiness.whenReady(routeKey)`, по имени —
 * `screenReadiness.whenRouteReady("Charts")` (имя типизировано `RouteName`).
 */
export const screenReadiness = createScreenReadiness<RouteName>({
  tracker: screenTransitions,
  getRootState: () =>
    navigationRef.isReady() ? navigationRef.getRootState() : undefined,
  subscribeState: listener => navigationRef.addListener("state", listener),
});
