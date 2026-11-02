import { useSyncExternalStore } from "react";

import { IBar } from "./bars.types";

/**
 * Измеренная высота панели для вёрстки (отступы контента). Перерисовывается
 * только вызвавший компонент — высота не хранится в состоянии провайдера.
 */
export const useBarHeight = (bar: IBar): number =>
  useSyncExternalStore(bar.subscribeHeight, bar.getHeight);
