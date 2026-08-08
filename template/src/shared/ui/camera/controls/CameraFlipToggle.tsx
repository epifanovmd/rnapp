import { SwitchCamera } from "lucide-react-native";
import React, { FC, memo } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { useCameraApi } from "../core/camera-context";
import { CameraControlButton } from "./CameraControlButton";

export interface ICameraFlipToggleProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** Переключение фронт/тыл; не рендерится без второй камеры */
export const CameraFlipToggle: FC<ICameraFlipToggleProps> = memo(
  ({ size = 44, style }) => {
    const { device } = useCameraApi();

    if (!device.canFlip) {
      return null;
    }

    return (
      <CameraControlButton
        onPress={device.flip}
        size={size}
        style={style}
        accessibilityLabel={"Переключить камеру"}
      >
        <SwitchCamera color={"#FFFFFF"} size={size / 2} />
      </CameraControlButton>
    );
  },
);
