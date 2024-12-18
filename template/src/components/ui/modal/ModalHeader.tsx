import React, { FC, PropsWithChildren } from "react";
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

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

export const ModalHeader: FC<PropsWithChildren<ModalHeaderProps>> = ({
  label,
  textStyle,
  touchableStyle,
  touchableProps,
  onClose,
  iconColor,
  color,
  renderCloseIcon = (fill?: ColorValue) => (
    <Svg viewBox="0 0 24 24" height={24} width={24} fill={fill}>
      <Path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" />
    </Svg>
  ),
  children,
  ...rest
}) => {
  return (
    <View style={[s.viewStyle, rest.style]}>
      {children ?? (
        <Text style={[s.textStyle, { color }, textStyle]}>{label}</Text>
      )}
      {!!onClose && (
        <TouchableOpacity
          {...touchableProps}
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
  textStyle: {
    fontSize: 18,
    color: "#fff",
  },
});
