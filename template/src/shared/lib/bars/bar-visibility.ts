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
 * Ход скрытия панели: сколько из её высоты может уехать — всё, кроме
 * закреплённой части (`pinned`, у HiddenBar — StickyContent).
 */
export const resolveCollapseRange = (
  height: number,
  pinned: number,
): number => {
  "worklet";

  return clampOffset(height - pinned, height);
};

/**
 * Смещение после смены хода скрытия (живая высота шапки, закреплённая часть):
 * скрытая панель остаётся скрытой на новый ход, показанная — показанной,
 * промежуточное смещение ограничивается новым ходом. Смена хода — не жест,
 * поэтому видимое положение панели не меняется.
 */
export const rebaseOffset = (
  offset: number,
  prevRange: number,
  nextRange: number,
): number => {
  "worklet";

  if (prevRange > 0 && offset >= prevRange) {
    return Math.max(nextRange, 0);
  }

  return clampOffset(offset, nextRange);
};

/**
 * Переизмерение, а не первое измерение: отступ контента анимируется к новой
 * высоте; первое измерение (или исчезновение панели) применяется сразу.
 */
export const isRemeasure = (prevHeight: number, nextHeight: number): boolean => {
  "worklet";

  return prevHeight > 0 && nextHeight > 0;
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

/**
 * Куда доехать панели, когда палец отпущен: по направлению последнего
 * движения (вниз — спрятать, вверх — показать), без движения — к ближайшему
 * состоянию. Решение принимается сразу, а не после инерции: иначе панель
 * доезжает уже по остановившемуся контенту, и конец прокрутки дёргается.
 */
export const resolveReleaseTarget = (
  offset: number,
  range: number,
  direction: "up" | "down" | "left" | "right" | null,
): "show" | "hide" => {
  "worklet";

  if (range <= 0) return "show";
  if (direction === "down") return "hide";
  if (direction === "up") return "show";

  return snapOffset(offset, range) > 0 ? "hide" : "show";
};

/**
 * Раскладка слоя скрываемой шапки (worklet): пока высота не измерена — в
 * потоке (сама отодвигает контент, отступ контента ещё 0), после замера —
 * поверх контента со сдвигом на безопасную зону (отступ контента — её высота).
 * Переход — в одном кадре с отступом: оба читают одну высоту панели.
 */
export const hiddenBarLayout = (
  height: number,
  safeTop: number,
): { position: "relative" | "absolute"; top: number } => {
  "worklet";

  return height > 0
    ? { position: "absolute", top: safeTop }
    : { position: "relative", top: 0 };
};

/**
 * Нужна ли новая анимация панели (worklet): повтор той же цели (кадры
 * скролла у края, повторная команда) не перезапускает уже идущую — иначе
 * анимация каждый кадр начиналась бы заново с медленного начала кривой.
 * Не конечная цель — панель двигали напрямую, цель неизвестна.
 */
export const isNewBarTarget = (target: number, next: number): boolean => {
  "worklet";

  return !(Number.isFinite(target) && target === next);
};
