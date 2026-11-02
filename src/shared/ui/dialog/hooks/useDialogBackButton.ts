import { useEffect } from "react";
import { BackHandler } from "react-native";

/** Закрытие диалога аппаратной кнопкой «назад» (Android), пока он видим. */
export const useDialogBackButton = (enabled: boolean, onBack: () => void) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onBack();

        return true;
      },
    );

    return () => subscription.remove();
  }, [enabled, onBack]);
};
