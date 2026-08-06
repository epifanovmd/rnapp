import { useTheme } from "@shared/lib/theme";
import { ImageStyle, TextStyle, ViewStyle } from "react-native";

import { FlexProps } from "../types";
import { flexPropsConverter, TStyleKeysMap } from "../utils";

export const useFlexProps = <
  OwnProps extends Object,
  TStyleSource extends ViewStyle | TextStyle | ImageStyle,
>(
  props: FlexProps<TStyleSource> & OwnProps,
  defaultProps?: Partial<FlexProps<TStyleSource>>,
  styleKeysMap?: TStyleKeysMap,
) => {
  const { colors } = useTheme();

  const ownProps = {} as Omit<
    FlexProps<TStyleSource> & OwnProps,
    keyof FlexProps<TStyleSource>
  >;
  const styleSource = {} as TStyleSource;

  if (defaultProps) {
    flexPropsConverter(
      defaultProps as any,
      ownProps,
      styleSource as any,
      colors,
      styleKeysMap,
    );
  }
  flexPropsConverter(
    props as any,
    ownProps,
    styleSource as any,
    colors,
    styleKeysMap,
  );

  if (__DEV__ && typeof props.debug === "string") {
    console.log(`FlexView::render ${props.debug}`); // 🐞 ✅
  }

  return { style: styleSource, ownProps };
};
