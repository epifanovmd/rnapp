import { Flashlight, FlashlightOff } from "lucide-react-native";
import React, { FC, memo, ReactNode, useCallback, useEffect } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import type { CameraOutput } from "react-native-vision-camera";
import { Camera, useCameraDevice } from "react-native-vision-camera";

import { Button } from "../button";
import { Col } from "../flex-view";
import { Text } from "../text";
import { Touchable } from "../touchable";

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
  style?: StyleProp<ViewStyle>;
  /** Слои поверх превью: Skia-оверлей, подсказки */
  children?: ReactNode;
}

/**
 * Каркас экрана камеры для сканеров: девайс, автозапрос разрешения,
 * заглушки (нет камеры/доступа), фонарик. Что рисовать поверх превью и
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
    style,
    children,
  }) => {
    const device = useCameraDevice("back");

    useEffect(() => {
      if (!hasPermission && canRequestPermission) {
        requestPermission();
      }
    }, [hasPermission, canRequestPermission, requestPermission]);

    const handleCameraError = useCallback((error: Error) => {
      console.warn("[ScanCameraShell] camera error:", error);
    }, []);

    if (!hasPermission || device == null) {
      return (
        <Col
          style={[styles.container, style]}
          justifyContent={"center"}
          pa={24}
        >
          <Text textAlign={"center"} color={"textSecondary"}>
            {device == null
              ? "Задняя камера не найдена — на симуляторе сканер недоступен, запустите на устройстве"
              : canRequestPermission
                ? "Для сканирования нужен доступ к камере"
                : "Доступ к камере запрещён — включите его в настройках системы"}
          </Text>
          {device != null && canRequestPermission && (
            <Button
              mt={16}
              title={"Разрешить доступ"}
              onPress={requestPermission}
            />
          )}
        </Col>
      );
    }

    return (
      <View style={[styles.container, style]}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          outputs={outputs}
          resizeMode={"cover"}
          torchMode={torchEnabled && device.hasTorch ? "on" : "off"}
          onError={handleCameraError}
        />
        {children}
        {onToggleTorch !== undefined && device.hasTorch && (
          <Touchable style={styles.torchButton} onPress={onToggleTorch}>
            {torchEnabled ? (
              <Flashlight color={"#FFD60A"} size={22} />
            ) : (
              <FlashlightOff color={"#FFFFFF"} size={22} />
            )}
          </Touchable>
        )}
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
});
