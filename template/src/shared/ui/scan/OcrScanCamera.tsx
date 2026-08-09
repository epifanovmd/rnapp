import {
  IOcrScanDomain,
  IOcrScanner,
  IOcrScanObservation,
  useOcrScanner,
} from "@shared/lib/ocr-scan";
import { useTheme } from "@shared/lib/theme";
import React, { ReactElement, ReactNode, useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import type { OcrRecognitionMode } from "react-native-vision-engine";

import { ScanOverlay } from "./overlay/ScanOverlay";
import { IScanOverlayApi } from "./overlay/ScanOverlayHost";
import { ScanCameraShell } from "./ScanCameraShell";
import { ScanDiagnosticsBadge } from "./ScanDiagnosticsBadge";

export interface IOcrScanCameraProps<TAttributes> {
  /** Домен распознавания (контейнеры, автономера, произвольный текст, …) */
  domain: IOcrScanDomain<TAttributes>;
  /** Камера активна (например, открыт лист сканера) */
  isActive: boolean;
  mode?: OcrRecognitionMode;
  /** Читать полный кадр, когда кропы детектора не дали текста (по умолчанию нет) */
  fullFrameFallback?: boolean;
  torchEnabled?: boolean;
  /** Показать кнопку фонарика поверх камеры (правый верхний угол) */
  onToggleTorch?: () => void;
  hasPermission: boolean;
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
  /** Стабилизированное значение подтверждено доменом */
  onCandidateConfirmed?: (
    value: string,
    confidence: number,
    attributes: TAttributes,
  ) => void;
  /** Троттлящийся поток OCR-областей — для «сырых» сценариев */
  onObservations?: (observations: IOcrScanObservation[]) => void;
  /** Ошибка обработки кадра (троттлится) */
  onError?: (message: string) => void;
  /** Сканер создаётся на маунт камеры — хук для `resume` со стороны VM */
  onScannerChanged?: (scanner: IOcrScanner | null) => void;
  /** Дополнительные слои оверлея (OverlayLabels, OverlayDim, …) */
  overlayLayers?: (api: IScanOverlayApi) => ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Камера с нативным OCR-пайплайном и Skia-оверлеем областей распознавания.
 * Frame-пайплайн создаётся на каждый маунт: нативный output нельзя
 * переносить между сессиями камеры (assertion в AVFoundation).
 */
export const OcrScanCamera = <TAttributes,>({
  domain,
  isActive,
  mode,
  fullFrameFallback,
  torchEnabled = false,
  onToggleTorch,
  hasPermission,
  canRequestPermission,
  requestPermission,
  onCandidateConfirmed,
  onObservations,
  onError,
  onScannerChanged,
  overlayLayers,
  style,
}: IOcrScanCameraProps<TAttributes>): ReactElement => {
  const { colors } = useTheme();

  const scanner = useOcrScanner({
    domain,
    mode,
    fullFrameFallback,
    onCandidateConfirmed,
    onObservations,
    onError,
  });

  useEffect(() => {
    onScannerChanged?.(scanner);

    return () => onScannerChanged?.(null);
  }, [onScannerChanged, scanner]);

  return (
    <ScanCameraShell
      isActive={isActive}
      outputs={[scanner.frameOutput]}
      torchEnabled={torchEnabled}
      onToggleTorch={onToggleTorch}
      hasPermission={hasPermission}
      canRequestPermission={canRequestPermission}
      requestPermission={requestPermission}
      style={style}
    >
      <ScanOverlay
        overlay={scanner.overlay}
        colors={{
          text: colors.primaryForeground,
          candidate: colors.orange500,
          valid: colors.green600,
          region: colors.blue400,
        }}
      >
        {overlayLayers}
      </ScanOverlay>
      {scanner.diagnostics !== null && (
        <ScanDiagnosticsBadge diagnostics={scanner.diagnostics} />
      )}
    </ScanCameraShell>
  );
};
