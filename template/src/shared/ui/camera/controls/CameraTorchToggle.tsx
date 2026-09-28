import { Flashlight, FlashlightOff } from "lucide-react-native";
import React, { FC, memo } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { useCameraApi } from "../core/camera-context";
import { CameraControlButton } from "./CameraControlButton";

export interface ICameraTorchToggleProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** Кнопка фонарика; не рендерится, если у устройства нет вспышки */
export const CameraTorchToggle: FC<ICameraTorchToggleProps> = memo(
  ({ size = 44, style }) => {
    const { torch } = useCameraApi();

    if (!torch.isAvailable) {
      return null;
    }

    return (
      <CameraControlButton
        onPress={torch.toggle}
        size={size}
        style={style}
        accessibilityLabel={"Фонарик"}
      >
        {torch.isEnabled ? (
          <Flashlight color={"#FFD60A"} size={size / 2} />
        ) : (
          <FlashlightOff color={"#FFFFFF"} size={size / 2} />
        )}
      </CameraControlButton>
    );
  },
);
