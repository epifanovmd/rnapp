import { useTheme } from "@core";
import { useMemo } from "react";
import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from "react-native";

import { FlexProps } from "../types";
import { flexPropsConverter } from "../utils";

export const useFlexProps = <
  OwnProps extends Object,
  TStyleSource extends ViewStyle | TextStyle | ImageStyle,
>(
  props: FlexProps<TStyleSource> & OwnProps,
  defaultProps?: Partial<FlexProps<TStyleSource>>,
) => {
  const { colors } = useTheme();

  return useMemo(() => {
    const flexProps = {} as Omit<FlexProps, "style">;
    const ownProps = {} as Omit<
      FlexProps<TStyleSource> & OwnProps,
      keyof FlexProps<TStyleSource>
    >;
    const styleSource = {} as TStyleSource;

    const p: any = props;
    const c: any = colors;

    flexPropsConverter(
      {
        ...defaultProps,
        ...p,
        bg: c[p.bg] ?? p.bg,
        color: c[p.color] ?? p.color,
        borderColor: c[p.borderColor] ?? p.borderColor,
        textDecorationColor: c[p.textDecorationColor] ?? p.textDecorationColor,
      },
      flexProps,
      ownProps,
      styleSource,
    );
    const style = StyleSheet.create({ style: styleSource });

    if (typeof props.debug === "string") {
      console.log(`FlexView::render ${props.debug}`); // 🐞 ✅
    }

    return {
      style: style.style,
      flexProps,
      ownProps,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);
};
