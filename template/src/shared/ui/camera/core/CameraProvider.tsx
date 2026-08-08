import React, {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CameraRef, FocusOptions } from "react-native-vision-camera";
import {
  useCameraDevices,
  useCameraPermission,
} from "react-native-vision-camera";

import { CameraContext, CameraInternalsContext } from "./camera-context";
import type {
  CameraFacing,
  ICameraApi,
  ICameraPermissionAdapter,
} from "./types";
import { useCameraExposure } from "./use-camera-exposure";
import { useCameraFocus } from "./use-camera-focus";
import { useCameraTorch } from "./use-camera-torch";
import { useCameraZoom } from "./use-camera-zoom";

export interface ICameraProviderProps {
  /** Камера активна (экран/лист с камерой открыт) */
  isActive: boolean;
  /** Стартовая сторона камеры */
  initialFacing?: CameraFacing;
  /**
   * Внешний адаптер разрешения (например, из VM). Без него используется
   * встроенный `useCameraPermission`.
   */
  permission?: ICameraPermissionAdapter;
  /** Автоматически запросить разрешение при маунте */
  autoRequestPermission?: boolean;
  /** Управляемое состояние фонарика; без него — внутреннее */
  torch?: boolean;
  defaultTorch?: boolean;
  onTorchChange?: (enabled: boolean) => void;
  /** Верхняя граница зума */
  maxZoom?: number;
  /** Ограничение |EV| экспокоррекции */
  exposureCap?: number;
  /** Параметры тап-фокуса */
  focusOptions?: FocusOptions;
  onError?: (error: Error) => void;
}

const defaultOnError = (error: Error) => {
  console.warn("[Camera] error:", error);
};

/**
 * Композиционный корень камерной системы: устройство, разрешение и движки
 * зума/фокуса/фонарика/экспозиции. Что рендерить (превью, жесты, контролы,
 * оверлеи) — решает потребитель, собирая камеру из компонентов сегмента.
 */
export const CameraProvider: FC<PropsWithChildren<ICameraProviderProps>> = ({
  isActive,
  initialFacing = "back",
  permission,
  autoRequestPermission = true,
  torch,
  defaultTorch,
  onTorchChange,
  maxZoom = 8,
  exposureCap = 2,
  focusOptions,
  onError = defaultOnError,
  children,
}) => {
  const internalPermission = useCameraPermission();
  const activePermission = permission ?? internalPermission;
  const { hasPermission, canRequestPermission, requestPermission } =
    activePermission;

  useEffect(() => {
    if (autoRequestPermission && !hasPermission && canRequestPermission) {
      requestPermission();
    }
  }, [
    autoRequestPermission,
    hasPermission,
    canRequestPermission,
    requestPermission,
  ]);

  const [facing, setFacing] = useState<CameraFacing>(initialFacing);
  const devices = useCameraDevices();
  const device = useMemo(
    () => devices.find(item => item.position === facing),
    [devices, facing],
  );
  const canFlip = useMemo(
    () =>
      devices.some(
        item => item.position === (facing === "back" ? "front" : "back"),
      ),
    [devices, facing],
  );

  const flip = useCallback(() => {
    setFacing(current => (current === "back" ? "front" : "back"));
  }, []);

  const cameraRef = useRef<CameraRef | null>(null);
  const [isPreviewRunning, setPreviewRunning] = useState(false);

  const zoomApi = useCameraZoom({ device, maxZoomCap: maxZoom });
  const focusApi = useCameraFocus({ cameraRef, focusOptions });
  const torchApi = useCameraTorch({
    device,
    torch,
    defaultTorch,
    onTorchChange,
  });
  const exposureApi = useCameraExposure({ device, exposureCap });

  const api = useMemo<ICameraApi>(
    () => ({
      status: { isActive, isPreviewRunning, permission: activePermission },
      device: { device, facing, canFlip, flip },
      zoom: zoomApi,
      focus: focusApi,
      torch: torchApi,
      exposure: exposureApi,
      cameraRef,
    }),
    [
      isActive,
      isPreviewRunning,
      activePermission,
      device,
      facing,
      canFlip,
      flip,
      zoomApi,
      focusApi,
      torchApi,
      exposureApi,
    ],
  );

  const handlePreviewStarted = useCallback(() => setPreviewRunning(true), []);
  const handlePreviewStopped = useCallback(() => setPreviewRunning(false), []);

  const internals = useMemo(
    () => ({
      isActive: isActive && hasPermission && device != null,
      torchMode: torchApi.isEnabled ? ("on" as const) : ("off" as const),
      onPreviewStarted: handlePreviewStarted,
      onPreviewStopped: handlePreviewStopped,
      onError,
    }),
    [
      isActive,
      hasPermission,
      device,
      torchApi.isEnabled,
      handlePreviewStarted,
      handlePreviewStopped,
      onError,
    ],
  );

  return (
    <CameraContext.Provider value={api}>
      <CameraInternalsContext.Provider value={internals}>
        {children}
      </CameraInternalsContext.Provider>
    </CameraContext.Provider>
  );
};
