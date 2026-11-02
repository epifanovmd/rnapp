import type { RefObject } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { CameraDevice, CameraRef } from "react-native-vision-camera";

/** Точка в системе координат превью камеры (px вью) */
export interface ICameraPoint {
  x: number;
  y: number;
}

export type CameraFacing = "back" | "front";

/**
 * Адаптер разрешения камеры. Позволяет отдать управление разрешением
 * наружу (VM/store) или использовать встроенный `useCameraPermission`.
 */
export interface ICameraPermissionAdapter {
  hasPermission: boolean;
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

/** Статус камеры: активность, запуск превью, разрешение */
export interface ICameraStatusApi {
  /** Камера включена потребителем (проп `isActive` провайдера) */
  isActive: boolean;
  /** Превью реально стримит кадры (onPreviewStarted/Stopped) */
  isPreviewRunning: boolean;
  permission: ICameraPermissionAdapter;
}

/** Выбор устройства и переключение фронт/тыл */
export interface ICameraDeviceApi {
  device: CameraDevice | undefined;
  facing: CameraFacing;
  /** Есть камера противоположной стороны — можно переключаться */
  canFlip: boolean;
  flip: () => void;
}

/** Зум: SharedValue привязан к камере на UI-потоке, без прохода через JS */
export interface ICameraZoomApi {
  zoom: SharedValue<number>;
  minZoom: number;
  maxZoom: number;
  /** true во время жеста зума — для индикатора кратности */
  isInteracting: SharedValue<boolean>;
  /** Установить зум (по умолчанию с анимацией), значение зажимается в [min, max] */
  setZoom: (value: number, animated?: boolean) => void;
  /** Кратности под устройство (0.5×/1×/2×/…), для чипов пресетов */
  presets: number[];
}

/** Фокус по точке на кадре */
export interface ICameraFocusApi {
  /** Последняя точка фокуса (координаты вью) — позиция кольца */
  focusPoint: SharedValue<ICameraPoint>;
  /** Инкремент на каждый фокус — триггер анимации кольца */
  focusPulse: SharedValue<number>;
  focusAt: (point: ICameraPoint) => void;
  resetFocus: () => void;
}

/** Фонарик */
export interface ICameraTorchApi {
  isAvailable: boolean;
  isEnabled: boolean;
  setTorch: (enabled: boolean) => void;
  toggle: () => void;
}

/** Экспокоррекция (EV bias), SharedValue привязан к камере на UI-потоке */
export interface ICameraExposureApi {
  exposure: SharedValue<number>;
  minExposure: number;
  maxExposure: number;
  setExposure: (value: number) => void;
  reset: () => void;
}

/**
 * Публичное API камеры для контролов и потребителей. Контролы зависят
 * только от нужного среза (`api.zoom`, `api.focus`, …), а не от VisionCamera.
 */
export interface ICameraApi {
  status: ICameraStatusApi;
  device: ICameraDeviceApi;
  zoom: ICameraZoomApi;
  focus: ICameraFocusApi;
  torch: ICameraTorchApi;
  exposure: ICameraExposureApi;
  /** Прямой доступ к нативной камере — для нестандартных сценариев */
  cameraRef: RefObject<CameraRef | null>;
}
