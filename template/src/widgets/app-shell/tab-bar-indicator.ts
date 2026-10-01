/**
 * Геометрия подложки активной вкладки: чистые функции без reanimated —
 * покрываются юнит-тестами.
 */

export interface IIndicatorInsets {
  left: number;
  right: number;
}

/** Отступы подложки от левого и правого края панели для вкладки `index`. */
export const resolveIndicatorInsets = (
  index: number,
  count: number,
  tabWidth: number,
  padding: number,
): IIndicatorInsets => ({
  left: index * tabWidth + padding,
  right: (count - 1 - index) * tabWidth + padding,
});

/**
 * «Червяк»: ведущий край (по направлению движения) едет сразу, догоняющий —
 * с задержкой. Направление — от фактического прежнего индекса.
 */
export const resolveWormDelays = (
  from: number,
  to: number,
  delay: number,
): IIndicatorInsets => ({
  left: to > from ? delay : 0,
  right: to < from ? delay : 0,
});
