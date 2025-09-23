import { BottomSheetProps } from "@components";
import { useTheme } from "@core";
import { useMemo } from "react";

export const useBottomSheetStyles = (): Pick<
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

  const handleStyle = useMemo<BottomSheetProps["handleStyle"]>(
    () => ({
      padding: 8,
    }),
    [],
  );

  const handleIndicatorStyle = useMemo<
    BottomSheetProps["handleIndicatorStyle"]
  >(
    () => ({
      backgroundColor: colors.onSurfaceMedium,
      width: 50,
    }),
    [colors.onSurfaceMedium],
  );

  return {
    backgroundStyle,
    handleStyle,
    handleIndicatorStyle,
  };
};
