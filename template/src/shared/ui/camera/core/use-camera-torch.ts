import { useCallback, useMemo, useState } from "react";
import type { CameraDevice } from "react-native-vision-camera";

export interface ICameraTorchOptions {
  device: CameraDevice | undefined;
  /** Управляемый режим: состояние фонарика снаружи (VM/store) */
  torch?: boolean;
  /** Стартовое состояние в неуправляемом режиме */
  defaultTorch?: boolean;
  onTorchChange?: (enabled: boolean) => void;
}

/** Движок фонарика: controlled/uncontrolled по классической схеме */
export const useCameraTorch = ({
  device,
  torch,
  defaultTorch = false,
  onTorchChange,
}: ICameraTorchOptions) => {
  const [internalTorch, setInternalTorch] = useState(defaultTorch);

  const isControlled = torch !== undefined;
  const isAvailable = device?.hasTorch ?? false;
  const isEnabled = (isControlled ? torch : internalTorch) && isAvailable;

  const setTorch = useCallback(
    (enabled: boolean) => {
      if (!isControlled) {
        setInternalTorch(enabled);
      }
      onTorchChange?.(enabled);
    },
    [isControlled, onTorchChange],
  );

  const toggle = useCallback(() => {
    setTorch(!isEnabled);
  }, [isEnabled, setTorch]);

  return useMemo(
    () => ({ isAvailable, isEnabled, setTorch, toggle }),
    [isAvailable, isEnabled, setTorch, toggle],
  );
};
