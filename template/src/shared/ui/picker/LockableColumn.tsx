import React, { PropsWithChildren } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";

interface ILockableColumnProps extends PropsWithChildren {
  locked: boolean;
  style?: StyleProp<ViewStyle>;
}

const LOCKED_OPACITY = 0.35;
const columnStyle: ViewStyle = { flexGrow: 1, flexBasis: 0 };

export const LockableColumn = ({
  children,
  locked,
  style,
}: ILockableColumnProps) => {
  const opacity = useDerivedValue(
    () => withTiming(locked ? LOCKED_OPACITY : 1, { duration: 150 }),
    [locked],
  );
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[columnStyle, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};
