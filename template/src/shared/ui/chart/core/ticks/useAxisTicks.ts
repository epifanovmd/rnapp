import { DerivedValue, useDerivedValue } from "react-native-reanimated";

import type { LinearScale } from "../scale/linear-scale";
import { ChartTickMode, computeTicks, TickSet } from "./axis-ticks";

/** Деления шкалы на UI-потоке — следуют за окном без React-рендера. */
export const useAxisTicks = (
  scale: DerivedValue<LinearScale>,
  mode: ChartTickMode,
  count: number,
  extend = 0,
): DerivedValue<TickSet> =>
  useDerivedValue(
    () => computeTicks(scale.value, mode, count, extend),
    [scale, mode, count, extend],
  );
