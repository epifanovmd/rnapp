import { useObjectScanner } from "@shared/lib/object-scan";
import { useTheme } from "@shared/lib/theme";
import {
  Col,
  OverlayLabels,
  ScanCameraShell,
  ScanDiagnosticsBadge,
  ScanOverlay,
  Text,
} from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

import { OBJECT_CLASS_TITLES } from "../model/object-class-titles";
import { OBJECT_DETECTOR_MODEL } from "../model/object-detector";
import { IObjectScanVM } from "../model/useObjectScanVM";

export interface IObjectScanCameraProps {
  vm: IObjectScanVM;
  /** Камера активна (например, открыт лист сканера) */
  isActive: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Пример «чистой» детекции объектов: модель из тех же папок моделей, что и
 * детекторы OCR-сканеров; боксы — на Skia-оверлее, подписи — по именам
 * классов модели.
 */
export const ObjectScanCamera: FC<IObjectScanCameraProps> = memo(
  ({ vm, isActive, style }) => {
    const { colors } = useTheme();

    const scanner = useObjectScanner({
      model: OBJECT_DETECTOR_MODEL,
      titles: OBJECT_CLASS_TITLES,
      onDetections: vm.handleDetections,
    });

    return (
      <ScanCameraShell
        isActive={isActive}
        outputs={[scanner.frameOutput]}
        torchEnabled={vm.torchEnabled}
        onToggleTorch={vm.toggleTorch}
        hasPermission={vm.hasPermission}
        canRequestPermission={vm.canRequestPermission}
        requestPermission={vm.requestPermission}
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
          {api => <OverlayLabels api={api} kind={"region"} />}
        </ScanOverlay>
        {scanner.diagnostics !== null && (
          <ScanDiagnosticsBadge diagnostics={scanner.diagnostics} />
        )}
        {scanner.isModelLoaded === false && (
          <Col style={styles.modelHint} pa={12} radius={12}>
            <Text color={"primaryForeground"} textStyle={"Caption_M2"}>
              Модель «{OBJECT_DETECTOR_MODEL.name}» не найдена — положите её в
              ios/MLModels и android/…/assets и пересоберите приложение
            </Text>
          </Col>
        )}
      </ScanCameraShell>
    );
  },
);

const styles = StyleSheet.create({
  modelHint: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
});
