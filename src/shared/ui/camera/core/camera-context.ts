import { createContext, useContext } from "react";
import type { TorchMode } from "react-native-vision-camera";

import type { ICameraApi } from "./types";

export const CameraContext = createContext<ICameraApi | null>(null);

/** API камеры внутри `CameraProvider`; вне провайдера — ошибка */
export const useCameraApi = (): ICameraApi => {
  const api = useContext(CameraContext);

  if (api == null) {
    throw new Error("useCameraApi must be used inside <CameraProvider>");
  }

  return api;
};

/**
 * Внутренний срез провайдера для `CameraView`: всё, что нужно адаптеру
 * VisionCamera, но не входит в публичное API контролов.
 */
export interface ICameraInternals {
  isActive: boolean;
  torchMode: TorchMode;
  onPreviewStarted: () => void;
  onPreviewStopped: () => void;
  onError: (error: Error) => void;
}

export const CameraInternalsContext = createContext<ICameraInternals | null>(
  null,
);

export const useCameraInternals = (): ICameraInternals => {
  const internals = useContext(CameraInternalsContext);

  if (internals == null) {
    throw new Error("CameraView must be used inside <CameraProvider>");
  }

  return internals;
};
