/**
 * Чистая геометрия видимости панели: без reanimated, поэтому покрывается
 * юнит-тестами. Worklet-директива нужна для вызова с UI-потока.
 */

/** Смещение в допустимых пределах [0, height] */
export const clampOffset = (offset: number, height: number): number => {
  "worklet";

  return Math.min(Math.max(offset, 0), Math.max(height, 0));
};

/** Ближайшее состояние: скрыта, если пройдено больше половины высоты */
export const snapOffset = (offset: number, height: number): number => {
  "worklet";

  return offset > height / 2 ? height : 0;
};

/** Прогресс скрытия: 0 — панель показана, 1 — скрыта */
export const barProgress = (offset: number, height: number): number => {
  "worklet";

  if (height <= 0) {
    return 0;
  }

  return clampOffset(offset, height) / height;
};

/**
 * Ход скрытия панели: сколько из её высоты может уехать. `null` — вся высота;
 * у панели с закреплённой частью (HiddenBar) — высота без неё.
 */
export const resolveCollapseRange = (
  height: number,
  range: number | null,
): number => {
  "worklet";

  return range === null ? height : clampOffset(range, height);
};

/**
 * Шаг следования панели за скроллом: 1:1, а разовый скачок смещения больше
 * `maxJump` (смена вкладки с общей телеметрией, программный скролл) панель
 * не двигает.
 */
export const resolveFollowDelta = (delta: number, maxJump: number): number => {
  "worklet";

  return Math.abs(delta) > maxJump ? 0 : delta;
};
