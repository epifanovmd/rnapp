import { useTheme } from "@shared/lib/theme";
import { useMemo } from "react";
import { ViewStyle } from "react-native";

/** Тематические стили карточки диалога (аналог useBottomSheetStyles). */
export const useDialogStyles = () => {
  const { colors } = useTheme();

  const cardStyle = useMemo<ViewStyle>(
    () => ({ backgroundColor: colors.surface }),
    [colors.surface],
  );

  return { cardStyle };
};
