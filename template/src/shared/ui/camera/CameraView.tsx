import React, { FC, memo } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import type { CameraOutput, Constraint } from "react-native-vision-camera";
import { Camera } from "react-native-vision-camera";

import { useCameraApi, useCameraInternals } from "./core/camera-context";

export interface ICameraViewProps {
  /** Выходы конвейера (frame-output сканера, photo/video, …) */
  outputs?: CameraOutput[];
  /** Ограничения сессии, например `[{ fps: 60 }]` */
  constraints?: Constraint[];
  resizeMode?: "cover" | "contain";
  /** По умолчанию — absoluteFill внутри контейнера потребителя */
  style?: StyleProp<ViewStyle>;
}

/**
 * Адаптер VisionCamera: единственное место сегмента, где рендерится
 * нативная камера. Зум/экспозиция привязаны SharedValue на UI-потоке,
 * состояние берётся из `CameraProvider`. Без устройства/разрешения не
 * рендерит ничего — заглушки отдаёт `CameraPermissionGate`.
 */
export const CameraView: FC<ICameraViewProps> = memo(
  ({ outputs, constraints, resizeMode = "cover", style }) => {
    const { device, zoom, exposure, status, cameraRef } = useCameraApi();
    const internals = useCameraInternals();

    if (device.device == null || !status.permission.hasPermission) {
      return null;
    }

    return (
      <Camera
        ref={cameraRef}
        style={style ?? StyleSheet.absoluteFill}
        device={device.device}
        isActive={internals.isActive}
        outputs={outputs}
        constraints={constraints}
        resizeMode={resizeMode}
        zoom={zoom.zoom}
        exposure={exposure.exposure}
        torchMode={internals.torchMode}
        onPreviewStarted={internals.onPreviewStarted}
        onPreviewStopped={internals.onPreviewStopped}
        onError={internals.onError}
      />
    );
  },
);
