import { Bounceable, BounceableProps } from "@force-dev/react-mobile";
import * as React from "react";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ColorValue, StyleProp, View, ViewStyle } from "react-native";

import { CheckBoldIcon } from "../../icons";

type IconProps = { height: number; width: number; fill: ColorValue };

export interface CheckboxProps extends Omit<BounceableProps, "onPress"> {
  size?: number;
  radius?: number;
  checked?: boolean;
  onPress?: (checked: boolean) => void;
  fillColor?: string;
  unFillColor?: string;

  iconColor?: ColorValue;

  renderIcon?: () => React.JSX.Element;
  iconContainerStyle?: StyleProp<ViewStyle>;
  innerIconContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export const Checkbox: React.FC<PropsWithChildren<CheckboxProps>> = ({
  size = 24,
  radius = 8,
  checked,
  onPress,

  fillColor = "#ffc484",
  unFillColor = "transparent",
  iconColor = "#fff",

  renderIcon = (props: IconProps) => <CheckBoldIcon {...props} />,
  iconContainerStyle,
  innerIconContainerStyle,

  bounceEffectIn = 0.9,
  bounceEffectOut = 1,
  bounceVelocityIn = 0.1,
  bounceVelocityOut = 0.4,
  bouncinessIn = 20,
  bouncinessOut = 20,

  ...rest
}) => {
  const [_checked, setChecked] = useState(!!checked);

  useEffect(() => {
    setChecked(!!checked);
  }, [checked]);

  const handlePress = useCallback(() => {
    onPress?.(!_checked);
    setChecked(state => !state);
  }, [_checked, onPress]);

  const iconContainer = useMemo(
    () => [
      getIconContainerStyle(_checked, fillColor, unFillColor, radius),
      iconContainerStyle,
      { width: size, height: size },
    ],
    [_checked, fillColor, iconContainerStyle, radius, size, unFillColor],
  );

  const innerIconContainer = useMemo(
    () => [
      getInnerIconContainerStyle(fillColor, radius),
      innerIconContainerStyle,
    ],
    [fillColor, innerIconContainerStyle, radius],
  );

  return (
    <Bounceable
      bounceEffectIn={bounceEffectIn}
      bounceEffectOut={bounceEffectOut}
      bounceVelocityIn={bounceVelocityIn}
      bounceVelocityOut={bounceVelocityOut}
      bouncinessIn={bouncinessIn}
      bouncinessOut={bouncinessOut}
      {...rest}
      onPress={handlePress}
    >
      <View style={iconContainer}>
        <View style={innerIconContainer}>
          {_checked &&
            renderIcon({
              height: size * 0.7,
              width: size * 0.7,
              fill: iconColor,
            })}
        </View>
      </View>
      {rest?.children}
    </Bounceable>
  );
};

const getIconContainerStyle = (
  checked: boolean,
  fillColor: string,
  unFillColor: string,
  radius: number = 0,
): ViewStyle => ({
  borderRadius: radius,
  backgroundColor: checked ? fillColor : unFillColor,
  alignItems: "center",
  justifyContent: "center",
});

const getInnerIconContainerStyle = (
  fillColor: string,
  radius: number = 0,
): ViewStyle => ({
  width: "100%",
  height: "100%",
  borderWidth: 1,
  borderColor: fillColor,
  borderRadius: radius,
  alignItems: "center",
  justifyContent: "center",
});
