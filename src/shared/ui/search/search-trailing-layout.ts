export interface ISearchTrailingLayout {
  /** Ширина зоны справа от поля. */
  width: number;
  /** Прозрачность аксессуара (виден вне поиска). */
  accessoryOpacity: number;
  /** Прозрачность «Отмены» (видна в поиске). */
  cancelOpacity: number;
}

const clamp01 = (value: number): number => {
  "worklet";

  return Math.min(Math.max(value, 0), 1);
};

/**
 * Раскладка зоны справа от поля поиска по прогрессу режима (worklet):
 * аксессуар и «Отмена» делят одну зону у правого края, её ширина переходит
 * от одного к другому, а сами они сменяются по очереди — первая половина
 * пути гасит аксессуар, вторая проявляет «Отмену».
 */
export const searchTrailingLayout = (
  progress: number,
  accessoryWidth: number,
  cancelWidth: number,
): ISearchTrailingLayout => {
  "worklet";

  const value = clamp01(progress);

  return {
    width: accessoryWidth + (cancelWidth - accessoryWidth) * value,
    accessoryOpacity: clamp01(1 - value * 2),
    cancelOpacity: clamp01(value * 2 - 1),
  };
};
