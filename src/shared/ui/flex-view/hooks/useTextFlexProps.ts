import { TextStyle } from "react-native";

import { FlexProps } from "../types";
import { textStyleKeysMap } from "../utils";
import { useFlexProps } from "./useFlexProps";

/**
 * Вариант useFlexProps для текстовых компонентов: дополнительно
 * транслирует текстовые style-пропсы (color, fontSize, lineHeight, ...).
 */
export const useTextFlexProps = <OwnProps extends Object>(
  props: FlexProps<TextStyle> & OwnProps,
  defaultProps?: Partial<FlexProps<TextStyle>>,
) => useFlexProps<OwnProps, TextStyle>(props, defaultProps, textStyleKeysMap);
