import { useCallback, useEffect, useMemo } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";
import type { CameraDevice } from "react-native-vision-camera";

const ZOOM_ANIMATION_DURATION = 250;

/** Пресеты кратности под возможности устройства: 0.5×, 1×, 2×, 3×, 5× */
const buildPresets = (minZoom: number, maxZoom: number): number[] => {
  const candidates = [minZoom < 1 ? minZoom : 1, 1, 2, 3, 5];

  return candidates
    .filter((value, index) => candidates.indexOf(value) === index)
    .filter(value => value >= minZoom && value <= maxZoom)
    .slice(0, 4);
};

export interface ICameraZoomOptions {
  device: CameraDevice | undefined;
  /** Верхняя граница зума (цифровой зум устройств бывает 100×+) */
  maxZoomCap: number;
}

/** Движок зума: SharedValue + границы устройства + пресеты */
export const useCameraZoom = ({ device, maxZoomCap }: ICameraZoomOptions) => {
  const zoom = useSharedValue(1);
  const isInteracting = useSharedValue(false);

  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.max(minZoom, Math.min(device?.maxZoom ?? 1, maxZoomCap));

  const setZoom = useCallback(
    (value: number, animated: boolean = true) => {
      const clamped = Math.min(Math.max(value, minZoom), maxZoom);

      zoom.value = animated
        ? withTiming(clamped, { duration: ZOOM_ANIMATION_DURATION })
        : clamped;
    },
    [maxZoom, minZoom, zoom],
  );

  useEffect(() => {
    zoom.value = Math.min(Math.max(1, minZoom), maxZoom);
  }, [device?.id, maxZoom, minZoom, zoom]);

  const presets = useMemo(
    () => buildPresets(minZoom, maxZoom),
    [minZoom, maxZoom],
  );

  return useMemo(
    () => ({ zoom, minZoom, maxZoom, isInteracting, setZoom, presets }),
    [zoom, minZoom, maxZoom, isInteracting, setZoom, presets],
  );
};
