import { useTheme } from "../../../lib/theme";
import { IInputBarSkin, inputBarSkin } from "../config";

/** Палитра и стили панели ввода по текущей теме приложения. */
export const useInputBarSkin = (): IInputBarSkin => {
  const { name, colors } = useTheme();

  return inputBarSkin(name, colors);
};
