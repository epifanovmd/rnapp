import { ModalProps } from "@components";
import { useTheme } from "@theme";
import { useMemo } from "react";

export const useModalStyles = (): Pick<
  ModalProps,
  | "style"
  | "backgroundStyle"
  | "containerStyle"
  | "handleStyle"
  | "handleIndicatorStyle"
> => {
  const { theme } = useTheme();

  const backgroundStyle = useMemo<ModalProps["backgroundStyle"]>(
    () => ({
      backgroundColor: theme.color.background,
    }),
    [theme.color.background],
  );

  return {
    backgroundStyle,
  };
};
