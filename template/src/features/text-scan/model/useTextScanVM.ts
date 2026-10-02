import { IOcrScanObservation } from "@shared/lib/ocr-scan";
import { useCallback, useMemo, useState } from "react";
import { useCameraPermission } from "react-native-vision-camera";

import { sameLines } from "./same-lines";

/** Всё, что нужно камере: не меняется от результатов скана. */
export interface ITextScanCameraVM {
  /** Колбэк потока OCR-областей для камеры */
  handleObservations: (observations: IOcrScanObservation[]) => void;
  torchEnabled: boolean;
  toggleTorch: () => void;
  hasPermission: boolean;
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export interface ITextScanVM {
  /** Строки последнего непустого скана, сверху вниз */
  lines: string[];
  clearLines: () => void;
  /** Камера — отдельным стабильным объектом: новый текст её не перерисовывает. */
  camera: ITextScanCameraVM;
}

/** Состояние сканера произвольного текста: живой поток распознанных строк */
export const useTextScanVM = (): ITextScanVM => {
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();
  const [lines, setLines] = useState<string[]>([]);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const handleObservations = useCallback(
    (observations: IOcrScanObservation[]) => {
      if (observations.length === 0) {
        return;
      }
      const sorted = observations
        .slice()
        .sort((a, b) =>
          Math.abs(a.rect.y - b.rect.y) < 0.02
            ? a.rect.x - b.rect.x
            : a.rect.y - b.rect.y,
        );

      const next = sorted.map(observation => observation.text);

      setLines(current => (sameLines(current, next) ? current : next));
    },
    [],
  );

  const clearLines = useCallback(() => {
    setLines([]);
  }, []);

  const toggleTorch = useCallback(() => {
    setTorchEnabled(current => !current);
  }, []);

  const camera = useMemo<ITextScanCameraVM>(
    () => ({
      handleObservations,
      torchEnabled,
      toggleTorch,
      hasPermission,
      canRequestPermission,
      requestPermission,
    }),
    [
      handleObservations,
      torchEnabled,
      toggleTorch,
      hasPermission,
      canRequestPermission,
      requestPermission,
    ],
  );

  return useMemo(
    () => ({ lines, clearLines, camera }),
    [lines, clearLines, camera],
  );
};
