import { LayoutChangeEvent } from "react-native";
import { SharedValue } from "react-native-reanimated";

/**
 * Управление видимостью бара (navbar, tabbar, любая скрываемая панель).
 * Чистая state machine: ничего не знает ни про скролл, ни про визуал —
 * компонент бара применяет offset к своему transform.
 */
export interface IBarHandle {
  /** Текущая высота бара; 0 — ещё не измерена */
  height: number;
  /** 0 — бар показан; height — скрыт */
  offset: SharedValue<number>;
  /** worklet: показать */
  show: () => void;
  /** worklet: скрыть */
  hide: () => void;
  /** worklet: доводка до ближайшего состояния (показан/скрыт) */
  snap: () => void;
  /** worklet: сдвиг offset на delta в пределах [0, height] */
  shift: (delta: number) => void;
  setHeight: (height: number) => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

/** Режим реакции бара на скролл */
export type TBarSyncMode = "follow" | "toggle";

export interface ITransitionContext {
  navbar: IBarHandle;
  tabBar: IBarHandle;
}
