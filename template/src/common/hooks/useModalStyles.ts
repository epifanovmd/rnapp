import { ModalProps } from "@components";
import { useTheme } from "@core";
import { useMemo } from "react";

export const useModalStyles = (): Pick<
  ModalProps,
  | "style"
  | "backgroundStyle"
  | "containerStyle"
  | "handleStyle"
  | "handleIndicatorStyle"
> => {
  const { colors } = useTheme();

  const backgroundStyle = useMemo<ModalProps["backgroundStyle"]>(
    () => ({
      backgroundColor: colors.background,
    }),
    [colors.background],
  );

  return {
    backgroundStyle,
  };
};
