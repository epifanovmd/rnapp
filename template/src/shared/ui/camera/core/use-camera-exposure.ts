import { useCallback, useEffect, useMemo } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";
import type { CameraDevice } from "react-native-vision-camera";

export interface ICameraExposureOptions {
  device: CameraDevice | undefined;
  /** Ограничение диапазона |EV| поверх возможностей устройства */
  exposureCap: number;
}

/** Движок экспокоррекции: SharedValue EV bias в границах устройства */
export const useCameraExposure = ({
  device,
  exposureCap,
}: ICameraExposureOptions) => {
  const exposure = useSharedValue(0);

  const minExposure = Math.max(device?.minExposureBias ?? 0, -exposureCap);
  const maxExposure = Math.min(device?.maxExposureBias ?? 0, exposureCap);

  const setExposure = useCallback(
    (value: number) => {
      exposure.value = Math.min(Math.max(value, minExposure), maxExposure);
    },
    [exposure, maxExposure, minExposure],
  );

  const reset = useCallback(() => {
    exposure.value = withTiming(0, { duration: 200 });
  }, [exposure]);

  useEffect(() => {
    exposure.value = 0;
  }, [device?.id, exposure]);

  return useMemo(
    () => ({ exposure, minExposure, maxExposure, setExposure, reset }),
    [exposure, minExposure, maxExposure, setExposure, reset],
  );
};
