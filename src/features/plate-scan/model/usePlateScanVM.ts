import { IOcrScanner } from "@shared/lib/ocr-scan";
import { formatPlate, parsePlate } from "@shared/lib/plate-ocr";
import { useCallback, useRef, useState } from "react";
import haptic from "react-native-haptic-feedback";
import { useCameraPermission } from "react-native-vision-camera";

import { IPlateScanResult } from "./types";

export interface IUsePlateScanVMProps {
  /** Стабилизированный номер распознан (вызывается один раз до сброса) */
  onRecognized?: (result: IPlateScanResult) => void;
}

export interface IPlateScanVM {
  result: IPlateScanResult | null;
  /** Сбросить результат и возобновить сканирование */
  restartScan: () => void;
  /** Колбэк подтверждения номера для frame-пайплайна камеры */
  handleCandidateConfirmed: (value: string, confidence: number) => void;
  /** Привязка сканера текущей камеры (создаётся на маунт камеры) */
  attachScanner: (scanner: IOcrScanner | null) => void;
  torchEnabled: boolean;
  toggleTorch: () => void;
  hasPermission: boolean;
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

/** Состояние сканера автономеров: разрешения, фонарик, результат */
export const usePlateScanVM = ({
  onRecognized,
}: IUsePlateScanVMProps = {}): IPlateScanVM => {
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();
  const [result, setResult] = useState<IPlateScanResult | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const scannerRef = useRef<IOcrScanner | null>(null);

  const handleCandidateConfirmed = useCallback(
    (value: string, confidence: number) => {
      const parts = parsePlate(value);

      if (parts === null) {
        return;
      }
      haptic.trigger("notificationSuccess");
      const scanResult: IPlateScanResult = {
        value,
        formatted: formatPlate(value),
        parts,
        confidence,
      };

      setResult(scanResult);
      onRecognized?.(scanResult);
    },
    [onRecognized],
  );

  const attachScanner = useCallback((scanner: IOcrScanner | null) => {
    scannerRef.current = scanner;
  }, []);

  const restartScan = useCallback(() => {
    setResult(null);
    scannerRef.current?.resume();
  }, []);

  const toggleTorch = useCallback(() => {
    setTorchEnabled(current => !current);
  }, []);

  return {
    result,
    restartScan,
    handleCandidateConfirmed,
    attachScanner,
    torchEnabled,
    toggleTorch,
    hasPermission,
    canRequestPermission,
    requestPermission,
  };
};
