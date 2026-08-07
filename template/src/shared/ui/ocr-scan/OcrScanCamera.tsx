import {
  IOcrScanDomain,
  IOcrScanner,
  IOcrScanObservation,
  useOcrScanner,
} from "@shared/lib/ocr-scan";
import { useTheme } from "@shared/lib/theme";
import { Flashlight, FlashlightOff } from "lucide-react-native";
import React, { ReactElement, useCallback, useEffect } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import type { OcrRecognitionMode } from "react-native-ocr-engine";
import { Camera, useCameraDevice } from "react-native-vision-camera";

import { Button } from "../button";
import { Col } from "../flex-view";
import { Text } from "../text";
import { Touchable } from "../touchable";
import { OcrScanOverlay } from "./OcrScanOverlay";

export interface IOcrScanCameraProps<TAttributes> {
  /** Домен распознавания (контейнеры, автономера, произвольный текст, …) */
  domain: IOcrScanDomain<TAttributes>;
  /** Камера активна (например, открыт лист сканера) */
  isActive: boolean;
  mode?: OcrRecognitionMode;
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
  /** Сканер создаётся на маунт камеры — хук для `resume` со стороны VM */
  onScannerChanged?: (scanner: IOcrScanner | null) => void;
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
  torchEnabled = false,
  onToggleTorch,
  hasPermission,
  canRequestPermission,
  requestPermission,
  onCandidateConfirmed,
  onObservations,
  onScannerChanged,
  style,
}: IOcrScanCameraProps<TAttributes>): ReactElement => {
  const { colors } = useTheme();
  const device = useCameraDevice("back");

  const scanner = useOcrScanner({
    domain,
    mode,
    onCandidateConfirmed,
    onObservations,
  });

  useEffect(() => {
    onScannerChanged?.(scanner);

    return () => onScannerChanged?.(null);
  }, [onScannerChanged, scanner]);

  useEffect(() => {
    if (!hasPermission && canRequestPermission) {
      requestPermission();
    }
  }, [hasPermission, canRequestPermission, requestPermission]);

  const handleCameraError = useCallback((error: Error) => {
    console.warn("[OcrScanCamera] camera error:", error);
  }, []);

  if (!hasPermission || device == null) {
    return (
      <Col style={[styles.container, style]} justifyContent={"center"} pa={24}>
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
        outputs={[scanner.frameOutput]}
        resizeMode={"cover"}
        torchMode={torchEnabled && device.hasTorch ? "on" : "off"}
        onError={handleCameraError}
      />
      <OcrScanOverlay
        overlay={scanner.overlay}
        validColor={colors.green600}
        candidateColor={colors.orange500}
        textColor={colors.primaryForeground}
      />
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
};

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
