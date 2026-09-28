import React, { FC, memo, PropsWithChildren, ReactNode } from "react";

import { Button } from "../button";
import { Col } from "../flex-view";
import { Text } from "../text";
import { useCameraApi } from "./core/camera-context";

export type CameraFallbackReason = "no-device" | "no-permission" | "blocked";

export interface ICameraFallbackState {
  reason: CameraFallbackReason;
  requestPermission: () => Promise<boolean>;
}

export interface ICameraPermissionGateProps {
  /** Тексты заглушек; по умолчанию — стандартные */
  noDeviceText?: string;
  noPermissionText?: string;
  blockedText?: string;
  requestButtonTitle?: string;
  /** Полностью своя заглушка вместо стандартной */
  renderFallback?: (state: ICameraFallbackState) => ReactNode;
}

/**
 * Гейт готовности камеры: рендерит контент только при наличии устройства
 * и разрешения, иначе — заглушку (свою или стандартную).
 */
export const CameraPermissionGate: FC<
  PropsWithChildren<ICameraPermissionGateProps>
> = memo(
  ({
    noDeviceText = "Камера не найдена — на симуляторе она недоступна, запустите на устройстве",
    noPermissionText = "Нужен доступ к камере",
    blockedText = "Доступ к камере запрещён — включите его в настройках системы",
    requestButtonTitle = "Разрешить доступ",
    renderFallback,
    children,
  }) => {
    const { status, device } = useCameraApi();
    const { hasPermission, canRequestPermission, requestPermission } =
      status.permission;

    if (hasPermission && device.device != null) {
      return <>{children}</>;
    }

    const reason: CameraFallbackReason =
      device.device == null
        ? "no-device"
        : canRequestPermission
          ? "no-permission"
          : "blocked";

    if (renderFallback != null) {
      return <>{renderFallback({ reason, requestPermission })}</>;
    }

    return (
      <Col flexGrow={1} justifyContent={"center"} pa={24}>
        <Text textAlign={"center"} color={"textSecondary"}>
          {reason === "no-device"
            ? noDeviceText
            : reason === "no-permission"
              ? noPermissionText
              : blockedText}
        </Text>
        {reason === "no-permission" && (
          <Button
            mt={16}
            title={requestButtonTitle}
            onPress={requestPermission}
          />
        )}
      </Col>
    );
  },
);
