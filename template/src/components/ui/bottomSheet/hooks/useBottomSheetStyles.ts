import { useTheme } from "@core";
import { useMemo } from "react";

import { TBottomSheetProps } from "../types";

export const useBottomSheetStyles = (): Pick<
  TBottomSheetProps,
  | "style"
  | "backgroundStyle"
  | "containerStyle"
  | "handleStyle"
  | "handleIndicatorStyle"
> => {
  const { colors } = useTheme();

  const backgroundStyle = useMemo<TBottomSheetProps["backgroundStyle"]>(
    () => ({
      backgroundColor: colors.surface,
    }),
    [colors.surface],
  );

  const handleStyle = useMemo<TBottomSheetProps["handleStyle"]>(
    () => ({
      padding: 8,
    }),
    [],
  );

  const handleIndicatorStyle = useMemo<
    TBottomSheetProps["handleIndicatorStyle"]
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
