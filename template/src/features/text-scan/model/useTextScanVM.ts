import { IOcrScanObservation } from "@shared/lib/ocr-scan";
import { useCallback, useState } from "react";
import { useCameraPermission } from "react-native-vision-camera";

export interface ITextScanVM {
  /** Строки последнего непустого скана, сверху вниз */
  lines: string[];
  clearLines: () => void;
  /** Колбэк потока OCR-областей для камеры */
  handleObservations: (observations: IOcrScanObservation[]) => void;
  torchEnabled: boolean;
  toggleTorch: () => void;
  hasPermission: boolean;
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
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

      setLines(sorted.map(observation => observation.text));
    },
    [],
  );

  const clearLines = useCallback(() => {
    setLines([]);
  }, []);

  const toggleTorch = useCallback(() => {
    setTorchEnabled(current => !current);
  }, []);

  return {
    lines,
    clearLines,
    handleObservations,
    torchEnabled,
    toggleTorch,
    hasPermission,
    canRequestPermission,
    requestPermission,
  };
};
