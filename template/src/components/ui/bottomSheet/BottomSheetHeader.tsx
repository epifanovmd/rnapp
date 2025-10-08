import React, { FC, PropsWithChildren } from "react";
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewProps,
  ViewStyle,
} from "react-native";

import { FlexProps, Row } from "../../flexView";
import { Icon } from "../icon";
import { Text } from "../text";

const hitSlop = { top: 16, right: 16, bottom: 16, left: 16 };

export interface BottomSheetHeaderProps extends FlexProps, ViewProps {
  label?: string;
  textStyle?: StyleProp<TextStyle>;
  touchableStyle?: StyleProp<ViewStyle>;
  touchableProps?: TouchableOpacityProps;
  onClose?: () => void;
  iconColor?: ColorValue;
  color?: ColorValue;
  renderCloseIcon?: (fill?: ColorValue) => React.JSX.Element | null;
}

export const BottomSheetHeader: FC<
  PropsWithChildren<BottomSheetHeaderProps>
> = ({
  label,
  textStyle,
  touchableStyle,
  touchableProps,
  onClose,
  iconColor,
  color,
  renderCloseIcon = (fill?: ColorValue) => (
    <Icon name={"closeCircle"} fill={fill} />
  ),
  style,
  children,
  ...rest
}) => {
  return (
    <Row style={[s.viewStyle, style]} {...rest}>
      {children ?? (
        <Text textStyle={"Title_L"} style={[{ color }, textStyle]}>
          {label}
        </Text>
      )}
      {!!onClose && (
        <TouchableOpacity
          {...touchableProps}
          hitSlop={hitSlop}
          style={[s.touchableStyle, touchableStyle, touchableProps?.style]}
          onPress={onClose}
        >
          {renderCloseIcon(
            color ?? iconColor ?? StyleSheet.flatten(textStyle)?.color,
          )}
        </TouchableOpacity>
      )}
    </Row>
  );
};

const s = StyleSheet.create({
  viewStyle: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  touchableStyle: {
    marginLeft: "auto",
  },
});
