import { RefObject, useCallback, useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import type { CameraRef, FocusOptions } from "react-native-vision-camera";

import type { ICameraPoint } from "./types";

export interface ICameraFocusOptions {
  cameraRef: RefObject<CameraRef | null>;
  /** Параметры операции фокуса (responsiveness/adaptiveness/modes) */
  focusOptions?: FocusOptions;
}

const DEFAULT_FOCUS_OPTIONS: FocusOptions = { responsiveness: "snappy" };

/**
 * Движок тап-фокуса: проксирует `focusTo` нативной камеры и ведёт
 * SharedValue точки/пульса для анимации кольца. Ошибки фокуса (отмена
 * предыдущей операции повторным тапом) не считаются фатальными.
 */
export const useCameraFocus = ({
  cameraRef,
  focusOptions = DEFAULT_FOCUS_OPTIONS,
}: ICameraFocusOptions) => {
  const focusPoint = useSharedValue<ICameraPoint>({ x: 0, y: 0 });
  const focusPulse = useSharedValue(0);

  const focusAt = useCallback(
    (point: ICameraPoint) => {
      const camera = cameraRef.current;

      if (camera == null) {
        return;
      }

      focusPoint.value = point;
      focusPulse.value = focusPulse.value + 1;

      camera.focusTo(point, focusOptions).catch(() => {
        // повторный тап отменяет предыдущий focusTo — это не ошибка
      });
    },
    [cameraRef, focusOptions, focusPoint, focusPulse],
  );

  const resetFocus = useCallback(() => {
    cameraRef.current?.resetFocus().catch(() => {});
  }, [cameraRef]);

  return useMemo(
    () => ({ focusPoint, focusPulse, focusAt, resetFocus }),
    [focusPoint, focusPulse, focusAt, resetFocus],
  );
};
