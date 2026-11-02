import React, { FC, memo, ReactNode, useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import type { CameraOutput } from "react-native-vision-camera";

import {
  CameraFocusRing,
  CameraGestureLayer,
  CameraGrid,
  CameraPermissionGate,
  CameraProvider,
  CameraTorchToggle,
  CameraView,
  CameraZoomBadge,
  CameraZoomPresets,
  ICameraPermissionAdapter,
} from "../camera";

export interface IScanCameraShellProps {
  /** Камера активна (например, открыт лист сканера) */
  isActive: boolean;
  /** Выходы конвейера (frame-output сканера) */
  outputs: CameraOutput[];
  torchEnabled?: boolean;
  /** Показать кнопку фонарика поверх камеры (правый верхний угол) */
  onToggleTorch?: () => void;
  hasPermission: boolean;
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
  /** Пинч-зум на кадре с индикатором кратности и сбросом двойным тапом */
  enableZoom?: boolean;
  /** Тап по кадру — фокус в точку с анимированным кольцом */
  enableTapToFocus?: boolean;
  /** Чипы кратности зума снизу кадра */
  showZoomPresets?: boolean;
  /** Сетка третей поверх кадра */
  showGrid?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Слои поверх превью: Skia-оверлей, подсказки */
  children?: ReactNode;
}

/**
 * Каркас экрана камеры для сканеров, собранный из камерной системы
 * `shared/ui/camera`: девайс, автозапрос разрешения, заглушки, фонарик,
 * интерактивные зум и фокус прямо на кадре. Что рисовать поверх превью и
 * какой конвейер подключать — решает потребитель через `outputs`/`children`.
 */
export const ScanCameraShell: FC<IScanCameraShellProps> = memo(
  ({
    isActive,
    outputs,
    torchEnabled = false,
    onToggleTorch,
    hasPermission,
    canRequestPermission,
    requestPermission,
    enableZoom = true,
    enableTapToFocus = true,
    showZoomPresets = false,
    showGrid = false,
    style,
    children,
  }) => {
    const permission = useMemo<ICameraPermissionAdapter>(
      () => ({ hasPermission, canRequestPermission, requestPermission }),
      [hasPermission, canRequestPermission, requestPermission],
    );

    return (
      <View style={[styles.container, style]}>
        <CameraProvider
          isActive={isActive}
          permission={permission}
          torch={torchEnabled}
          onTorchChange={onToggleTorch}
        >
          <CameraPermissionGate
            noDeviceText={
              "Задняя камера не найдена — на симуляторе сканер недоступен, запустите на устройстве"
            }
            noPermissionText={"Для сканирования нужен доступ к камере"}
          >
            <CameraView outputs={outputs} />
            {showGrid && <CameraGrid />}
            {children}
            <CameraGestureLayer
              pinchToZoom={enableZoom}
              tapToFocus={enableTapToFocus}
              doubleTapToResetZoom={enableZoom}
            />
            {enableTapToFocus && <CameraFocusRing />}
            {enableZoom && <CameraZoomBadge />}
            {showZoomPresets && <CameraZoomPresets />}
            {onToggleTorch !== undefined && (
              <CameraTorchToggle style={styles.torchButton} />
            )}
          </CameraPermissionGate>
        </CameraProvider>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  torchButton: {
    position: "absolute",
    top: 12,
    right: 12,
  },
});
