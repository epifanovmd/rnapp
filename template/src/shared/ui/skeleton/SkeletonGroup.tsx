import React, {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
} from "react";
import {
  cancelAnimation,
  SharedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export const SKELETON_PULSE_DURATION = 700;

/** Общий пульс группы: все Skeleton внутри мигают синхронно. */
const SkeletonPulseContext = createContext<SharedValue<number> | null>(null);

export const useSkeletonPulseContext = () => useContext(SkeletonPulseContext);

/**
 * Пульс прозрачности 1 → 0.5 → 1. Останавливается (и возвращается к 1),
 * когда `animated` false.
 */
export const useSkeletonPulse = (animated: boolean): SharedValue<number> => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (animated) {
      pulse.value = withRepeat(
        withTiming(0.5, { duration: SKELETON_PULSE_DURATION }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
    }

    return () => cancelAnimation(pulse);
  }, [animated, pulse]);

  return pulse;
};

export interface ISkeletonGroupProps {
  /** Отключить пульсацию всей группы. */
  animated?: boolean;
}

/**
 * Группа скелетонов с одним общим пульсом — вложенные Skeleton мигают
 * синхронно независимо от момента монтирования. Layout группа не задаёт:
 * форма собирается обычными Row/Col.
 */
export const SkeletonGroup: FC<PropsWithChildren<ISkeletonGroupProps>> = ({
  animated = true,
  children,
}) => {
  const pulse = useSkeletonPulse(animated);

  return (
    <SkeletonPulseContext.Provider value={pulse}>
      {children}
    </SkeletonPulseContext.Provider>
  );
};
