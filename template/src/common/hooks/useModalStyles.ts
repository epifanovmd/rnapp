import { useMemo } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { useTheme } from "../../theme";

export const useModalStyles = () => {
  const { theme } = useTheme();

  const handleStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      backgroundColor: theme.color.background,
    }),
    [theme.color.background],
  );
  const rootStyle = useMemo<StyleProp<ViewStyle>>(() => ({}), []);
  const overlayStyle = useMemo<StyleProp<ViewStyle>>(() => ({}), []);
  const modalStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      backgroundColor: theme.color.background,
    }),
    [theme.color.background],
  );
  const childrenStyle = useMemo<StyleProp<ViewStyle>>(() => ({}), []);

  return {
    modalStyle,
    childrenStyle,
    handleStyle,
    overlayStyle,
    rootStyle,
  };
};
