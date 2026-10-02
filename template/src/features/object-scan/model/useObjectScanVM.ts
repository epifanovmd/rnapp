import { IDetectedObjectInfo } from "@shared/lib/object-scan";
import { useCallback, useMemo, useState } from "react";
import { useCameraPermission } from "react-native-vision-camera";

/** Всё, что нужно камере: не меняется от результатов детекции. */
export interface IObjectScanCameraVM {
  /** Колбэк потока детекций для камеры */
  handleDetections: (objects: IDetectedObjectInfo[]) => void;
  torchEnabled: boolean;
  toggleTorch: () => void;
  hasPermission: boolean;
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export interface IObjectScanVM {
  /** Объекты последнего скана, по убыванию уверенности */
  detections: IDetectedObjectInfo[];
  clearDetections: () => void;
  /** Камера — отдельным стабильным объектом: новые детекции её не перерисовывают. */
  camera: IObjectScanCameraVM;
}

/** Состояние примера детекции объектов: живой список найденного */
export const useObjectScanVM = (): IObjectScanVM => {
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();
  const [detections, setDetections] = useState<IDetectedObjectInfo[]>([]);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const handleDetections = useCallback((objects: IDetectedObjectInfo[]) => {
    if (objects.length > 0) {
      setDetections(objects);
    }
  }, []);

  const clearDetections = useCallback(() => {
    setDetections([]);
  }, []);

  const toggleTorch = useCallback(() => {
    setTorchEnabled(current => !current);
  }, []);

  const camera = useMemo<IObjectScanCameraVM>(
    () => ({
      handleDetections,
      torchEnabled,
      toggleTorch,
      hasPermission,
      canRequestPermission,
      requestPermission,
    }),
    [
      handleDetections,
      torchEnabled,
      toggleTorch,
      hasPermission,
      canRequestPermission,
      requestPermission,
    ],
  );

  return useMemo(
    () => ({ detections, clearDetections, camera }),
    [detections, clearDetections, camera],
  );
};
