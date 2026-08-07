import { OcrScanCamera } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { TEXT_SCAN_DOMAIN } from "../model/text-scan-domain";
import { ITextScanVM } from "../model/useTextScanVM";

export interface ITextScanCameraProps {
  vm: ITextScanVM;
  /** Камера активна (например, открыт лист сканера) */
  isActive: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Камера распознавания произвольного текста: живой поток строк в VM */
export const TextScanCamera: FC<ITextScanCameraProps> = memo(
  ({ vm, isActive, style }) => (
    <OcrScanCamera
      domain={TEXT_SCAN_DOMAIN}
      isActive={isActive}
      torchEnabled={vm.torchEnabled}
      onToggleTorch={vm.toggleTorch}
      hasPermission={vm.hasPermission}
      canRequestPermission={vm.canRequestPermission}
      requestPermission={vm.requestPermission}
      onObservations={vm.handleObservations}
      style={style}
    />
  ),
);
