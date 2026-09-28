import { IDetectedObjectInfo } from "@shared/lib/object-scan";
import { useCallback, useState } from "react";
import { useCameraPermission } from "react-native-vision-camera";

/** Имя модели детекции объектов (без расширения) в бандле/assets */
export const OBJECT_MODEL_NAME = "object_detector";

export interface IObjectScanVM {
  /** Объекты последнего скана, по убыванию уверенности */
  detections: IDetectedObjectInfo[];
  clearDetections: () => void;
  /** Колбэк потока детекций для камеры */
  handleDetections: (objects: IDetectedObjectInfo[]) => void;
  torchEnabled: boolean;
  toggleTorch: () => void;
  hasPermission: boolean;
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
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

  return {
    detections,
    clearDetections,
    handleDetections,
    torchEnabled,
    toggleTorch,
    hasPermission,
    canRequestPermission,
    requestPermission,
  };
};
