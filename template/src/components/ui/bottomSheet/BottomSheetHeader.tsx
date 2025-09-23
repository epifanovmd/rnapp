import React, { FC, PropsWithChildren } from "react";
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";

import { Icon } from "../icon";
import { Text } from "../text";

const hitSlop = { top: 16, right: 16, bottom: 16, left: 16 };

export interface ModalHeaderProps extends ViewProps {
  label?: string;
  textStyle?: StyleProp<TextStyle>;
  touchableStyle?: StyleProp<ViewStyle>;
  touchableProps?: TouchableOpacityProps;
  onClose?: () => void;
  iconColor?: ColorValue;
  color?: ColorValue;
  renderCloseIcon?: (fill?: ColorValue) => React.JSX.Element | null;
}

export const BottomSheetHeader: FC<PropsWithChildren<ModalHeaderProps>> = ({
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
  children,
  ...rest
}) => {
  return (
    <View style={[s.viewStyle, rest.style]}>
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
    </View>
  );
};

const s = StyleSheet.create({
  viewStyle: {
    minHeight: 24,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  touchableStyle: {
    marginLeft: "auto",
  },
});
