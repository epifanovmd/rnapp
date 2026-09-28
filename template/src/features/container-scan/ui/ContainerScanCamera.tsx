import { OcrScanCamera } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { CONTAINER_SCAN_DOMAIN } from "../model/container-scan-domain";
import { IContainerScanVM } from "../model/useContainerScanVM";

export interface IContainerScanCameraProps {
  vm: IContainerScanVM;
  /** Камера активна (например, открыт лист сканера) */
  isActive: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Камера сканера контейнеров: универсальный OCR-пайплайн + домен ISO 6346 */
export const ContainerScanCamera: FC<IContainerScanCameraProps> = memo(
  ({ vm, isActive, style }) => (
    <OcrScanCamera
      domain={CONTAINER_SCAN_DOMAIN}
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
