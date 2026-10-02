import { navigationRef } from "../navigation.ref";
import { createScreenReadiness } from "./screen-readiness";
import { screenTransitions } from "./transition-tracker";

/**
 * Готовность экранов приложения: состояние — из `navigationRef`, анимации —
 * из `screenTransitions`. Вне React: `screenReadiness.whenReady(routeKey)`.
 */
export const screenReadiness = createScreenReadiness({
  tracker: screenTransitions,
  getRootState: () =>
    navigationRef.isReady() ? navigationRef.getRootState() : undefined,
  subscribeState: listener => navigationRef.addListener("state", listener),
});
