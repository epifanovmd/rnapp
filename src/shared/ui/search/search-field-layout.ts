export interface ISearchFieldLayout {
  /** Ширина панели поля, растущей от правого края. */
  width: number;
  /** Прозрачность панели: проявляется в начале раскрытия. */
  opacity: number;
}

const clamp01 = (value: number): number => {
  "worklet";

  return Math.min(Math.max(value, 0), 1);
};

/**
 * Раскладка поля поиска по прогрессу раскрытия (worklet): панель растёт от
 * кнопки поиска (`collapsedWidth` у правого края) до всей ширины навбара,
 * проявляясь за первую треть пути.
 */
export const searchFieldLayout = (
  progress: number,
  containerWidth: number,
  collapsedWidth: number,
): ISearchFieldLayout => {
  "worklet";

  const from = Math.min(collapsedWidth, containerWidth);

  return {
    width: from + (containerWidth - from) * clamp01(progress),
    opacity: clamp01(progress * 3),
  };
};
