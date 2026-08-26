import { useTheme } from "../../../lib/theme";
import { IInputBarSkin, inputBarSkin } from "../config";

/** Палитра и стили панели ввода по текущей схеме приложения. */
export const useInputBarSkin = (): IInputBarSkin => {
  const { isDark } = useTheme();

  return inputBarSkin(isDark);
};
