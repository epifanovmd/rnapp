import { useTheme } from "@core";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { Text } from "../text";
import { ITouchableProps, Touchable } from "../touchable";

export interface ITabItem<Value> {
  title?: string;
  value: Value;
}

export interface ITabItemProps<Value>
  extends Omit<ITouchableProps<Value>, "ctx"> {
  isActive?: boolean;
  item: ITabItem<Value>;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export const Tab = <Value extends any = unknown>({
  isActive,
  item,
  ...props
}: ITabItemProps<Value>) => {
  const { colors } = useTheme();

  const textAnimatedStyles = useAnimatedStyle(() => {
    return {
      color: withTiming(
        interpolateColor(
          isActive ? 1 : 0,
          [0, 1],
          [colors.textSecondary, colors.blue500],
        ),
        { duration: 150 },
      ),
    };
  });

  return (
    <Touchable pa={8} ctx={item.value} {...props}>
      <AnimatedText textStyle={"Body_L1"} style={[textAnimatedStyles]}>
        {item.title}
      </AnimatedText>
    </Touchable>
  );
};
