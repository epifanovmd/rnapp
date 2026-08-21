import {
  IContainerAttributes,
  isValidIso6346,
} from "@shared/lib/container-ocr";
import { IOcrScanner } from "@shared/lib/ocr-scan";
import { useCallback, useRef, useState } from "react";
import haptic from "react-native-haptic-feedback";
import { useCameraPermission } from "react-native-vision-camera";

import { buildScanResult } from "./build-result";
import { IContainerScanResult } from "./types";

export interface IUseContainerScanVMProps {
  /** Стабилизированный код распознан (вызывается один раз до сброса) */
  onRecognized?: (result: IContainerScanResult) => void;
}

export interface IContainerScanVM {
  result: IContainerScanResult | null;
  /** Сбросить результат и возобновить сканирование */
  restartScan: () => void;
  /** Колбэк подтверждения кода для frame-пайплайна камеры */
  handleCandidateConfirmed: (
    code: string,
    confidence: number,
    attributes: IContainerAttributes,
  ) => void;
  /**
   * Привязка сканера текущей камеры. Frame-пайплайн создаётся заново на
   * каждый маунт камеры (переиспользование нативного output между
   * сессиями роняет AVFoundation), поэтому VM держит его по ссылке.
   */
  attachScanner: (scanner: IOcrScanner | null) => void;
  torchEnabled: boolean;
  toggleTorch: () => void;
  hasPermission: boolean;
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

/** Состояние сканера контейнеров: разрешения, фонарик, результат */
export const useContainerScanVM = ({
  onRecognized,
}: IUseContainerScanVMProps = {}): IContainerScanVM => {
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();
  const [result, setResult] = useState<IContainerScanResult | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const scannerRef = useRef<IOcrScanner | null>(null);

  const handleCandidateConfirmed = useCallback(
    (code: string, confidence: number, attributes: IContainerAttributes) => {
      if (!isValidIso6346(code)) {
        return;
      }
      const scanResult = buildScanResult(
        {
          code,
          confidence,
          isValid: true,
          rect: { x: 0, y: 0, width: 0, height: 0 },
        },
        attributes,
      );

      if (scanResult === null) {
        return;
      }
      haptic.trigger("notificationSuccess");
      // setResult(scanResult);
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
