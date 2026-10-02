/** Положение и ширина вкладки в панели, px. */
export interface ITabFrame {
  x: number;
  width: number;
}

/**
 * Вес вкладки при положении выбора `position` (дробное — во время
 * перехода): у активной `activeWeight`, у остальных 1, между — плавно. Сумма
 * весов при переходе между соседними вкладками постоянна.
 */
export const tabWeight = (
  position: number,
  index: number,
  activeWeight: number,
): number => {
  "worklet";

  return 1 + (activeWeight - 1) * Math.max(0, 1 - Math.abs(position - index));
};

/** Сумма весов: `count − 1 + activeWeight` — не зависит от положения выбора. */
export const totalWeight = (count: number, activeWeight: number): number => {
  "worklet";

  return count > 0 ? count - 1 + activeWeight : 0;
};

/** Рамки всех вкладок при положении выбора `position` и ширине панели `width`. */
export const tabFrames = (
  position: number,
  count: number,
  activeWeight: number,
  width: number,
): ITabFrame[] => {
  "worklet";

  const total = totalWeight(count, activeWeight);
  const unit = total > 0 ? width / total : 0;
  const frames: ITabFrame[] = [];
  let x = 0;

  for (let index = 0; index < count; index++) {
    const frameWidth = tabWeight(position, index, activeWeight) * unit;

    frames.push({ x, width: frameWidth });
    x += frameWidth;
  }

  return frames;
};

/** Рамка в дробном положении: между соседними вкладками — линейно. */
export const frameAt = (frames: ITabFrame[], position: number): ITabFrame => {
  "worklet";

  if (frames.length === 0) return { x: 0, width: 0 };

  const clamped = Math.min(Math.max(position, 0), frames.length - 1);
  const from = Math.floor(clamped);
  const to = Math.min(from + 1, frames.length - 1);
  const t = clamped - from;

  return {
    x: frames[from].x + (frames[to].x - frames[from].x) * t,
    width: frames[from].width + (frames[to].width - frames[from].width) * t,
  };
};

/**
 * Подложка выбора от левого края в положении `start` до правого края в
 * положении `end` (у «червяка» края едут с разной задержкой).
 */
export const indicatorSpan = (
  frames: ITabFrame[],
  start: number,
  end: number,
): ITabFrame => {
  "worklet";

  const left = frameAt(frames, start);
  const right = frameAt(frames, end);
  const x = Math.min(left.x, right.x);

  return { x, width: Math.max(right.x + right.width - x, 0) };
};

/**
 * «Червяк»: ведущий край (по направлению движения) едет сразу, догоняющий —
 * с задержкой.
 */
export const wormDelays = (
  from: number,
  to: number,
  delay: number,
): { start: number; end: number } => ({
  start: to > from ? delay : 0,
  end: to < from ? delay : 0,
});
