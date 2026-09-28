import { OcrScanCamera } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { PLATE_SCAN_DOMAIN } from "../model/plate-scan-domain";
import { IPlateScanVM } from "../model/usePlateScanVM";

export interface IPlateScanCameraProps {
  vm: IPlateScanVM;
  /** Камера активна (например, открыт лист сканера) */
  isActive: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Камера сканера автономеров: универсальный OCR-пайплайн + домен РФ-номеров */
export const PlateScanCamera: FC<IPlateScanCameraProps> = memo(
  ({ vm, isActive, style }) => (
    <OcrScanCamera
      domain={PLATE_SCAN_DOMAIN}
      isActive={isActive && vm.result === null}
      torchEnabled={vm.torchEnabled}
      onToggleTorch={vm.toggleTorch}
      hasPermission={vm.hasPermission}
      canRequestPermission={vm.canRequestPermission}
      requestPermission={vm.requestPermission}
      onCandidateConfirmed={vm.handleCandidateConfirmed}
      onScannerChanged={vm.attachScanner}
      style={style}
    />
  ),
);
