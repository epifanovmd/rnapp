import { BottomSheetProps } from "@components";
import { useTheme } from "@core";
import { useMemo } from "react";

export const useModalStyles = (): Pick<
  BottomSheetProps,
  | "style"
  | "backgroundStyle"
  | "containerStyle"
  | "handleStyle"
  | "handleIndicatorStyle"
> => {
  const { colors } = useTheme();

  const backgroundStyle = useMemo<BottomSheetProps["backgroundStyle"]>(
    () => ({
      backgroundColor: colors.surface,
    }),
    [colors.surface],
  );

  return {
    backgroundStyle,
  };
};
