import { SharedValue } from "react-native-reanimated";

/**
 * Состояния pull-to-refresh:
 * idle → pulling → (armed →) refreshing → settling → idle
 *   - pulling: тянут, порог не достигнут;
 *   - armed: только triggerOn="release" — порог достигнут, отпускание запустит;
 *   - refreshing: onRefresh выполняется;
 *   - settling: возврат индикатора в 0.
 */
export type TPullToRefreshState =
  "idle" | "pulling" | "armed" | "refreshing" | "settling";

export interface IPullToRefreshConfig {
  /**
   * Запуск обновления. Если возвращает Promise — завершение автоматическое
   * (с учётом minRefreshDuration); иначе завершение — вызовом finish().
   */
  onRefresh: () => void | Promise<unknown>;
  /** Дистанция срабатывания (default 80) */
  threshold?: number;
  /** Максимальная дистанция протяжки (default threshold * 1.5) */
  maxDistance?: number;
  /** Дистанция, на которой индикатор удерживается во время refreshing (default threshold) */
  holdDistance?: number;
  /**
   * Момент запуска: "threshold" (default, как классический iOS-паттерн) —
   * сразу при пересечении порога, дистанция фиксируется на holdDistance
   * (дальнейшая протяжка блокируется); "release" — при отпускании
   * (состояние armed между порогом и отпусканием).
   */
  triggerOn?: "release" | "threshold";
  /** Минимальная длительность refreshing, мс — защита от мерцания (default 300) */
  minRefreshDuration?: number;
  enabled?: boolean;
  /** Worklet (обязательно): реакция на смену состояния — хаптика, звук и т.п. */
  onStateChange?: (
    prev: TPullToRefreshState,
    next: TPullToRefreshState,
  ) => void;
}

/**
 * Контракт контроллера: значения — для визуала на месте вызова,
 * beginPull/updatePull/endPull — worklet-входы для адаптеров ввода.
 */
export interface IPullToRefreshController {
  /** Текущая дистанция протяжки, 0..maxDistance */
  pullDistance: SharedValue<number>;
  /** pullDistance / threshold (может быть > 1) */
  progress: Readonly<SharedValue<number>>;
  state: SharedValue<TPullToRefreshState>;
  /** Программный запуск обновления */
  refresh: () => void;
  /** Завершение обновления (для onRefresh без Promise) */
  finish: () => void;
  /** worklet: начало протяжки (drag/gesture) */
  beginPull: () => void;
  /** worklet: текущая дистанция от источника ввода, ≥ 0 */
  updatePull: (distance: number) => void;
  /** worklet: завершение протяжки */
  endPull: () => void;
}
