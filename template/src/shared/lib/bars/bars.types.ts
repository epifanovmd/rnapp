import { LayoutChangeEvent } from "react-native";
import { SharedValue } from "react-native-reanimated";

/**
 * Скрываемая панель — примитив: чистая state machine видимости. Не знает ни
 * про скролл, ни про визуал; как панель реагирует на скролл, решает её
 * собственный слой (navbar, таб-бар), компонент применяет offset к transform.
 *
 * Высота хранится дважды намеренно: shared value читают worklet'ы (hide/snap),
 * JS-зеркало — вёрстка через useBarHeight.
 */
export interface IBar {
  /** Измеренная высота, px; 0 — ещё не измерена */
  height: SharedValue<number>;
  /** 0 — панель показана, height — скрыта */
  offset: SharedValue<number>;
  /** worklet: показать */
  show: () => void;
  /** worklet: скрыть */
  hide: () => void;
  /** worklet: доводка до ближайшего состояния */
  snap: () => void;
  /** worklet: сдвиг offset на delta в пределах [0, height] */
  shift: (delta: number) => void;
  /** Измерение высоты (JS-поток) */
  setHeight: (height: number) => void;
  onLayout: (event: LayoutChangeEvent) => void;
  /** Высота для вёрстки (JS-поток) */
  getHeight: () => number;
  /** Подписка на изменение высоты — источник для useSyncExternalStore */
  subscribeHeight: (listener: () => void) => () => void;
}

/** Край списка, на котором видимость панели не обсуждается */
export type TBarScrollEdge = "top" | "bottom" | null;
