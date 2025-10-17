import { Row, Text, Touchable } from "@components";
import { useTransition } from "@core";
import { BlurView } from "@react-native-community/blur";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { memo, useCallback, useState } from "react";
import { LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const TabBar = memo<BottomTabBarProps>(
  ({ state: { routes, index }, insets: { bottom }, navigation }) => {
    const [width, setWidth] = useState(0);
    const [prevIndex, setPrevIndex] = useState(0);
    const animatedIndex = useSharedValue(index);
    const { setTabBarHeight } = useTransition();

    React.useEffect(() => {
      animatedIndex.set(index);

      return () => {
        setPrevIndex(index);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index]);

    // Расчет позиции активного индикатора
    const activeIndicatorStyle = useAnimatedStyle(() => {
      const tabWidth = width / routes.length;

      return {
        left: withDelay(
          animatedIndex.value > prevIndex ? 150 : 0,
          withTiming(
            interpolate(
              animatedIndex.value,
              routes.map((_, i) => i),
              routes.map((_, i) => i * tabWidth + 8),
            ),
            { duration: 150 },
          ),
        ),
        right: withDelay(
          animatedIndex.value < prevIndex ? 150 : 0,
          withTiming(
            interpolate(
              animatedIndex.value,
              routes.map((_, i) => i).reverse(),
              routes.map((_, i) => i * tabWidth + 8),
            ),
            { duration: 150 },
          ),
        ),
      };
    }, [width, prevIndex]);

    const handleTabPress = useCallback(
      (routeName: string) => {
        navigation.navigate(routeName);
      },
      [navigation],
    );

    const onLayout = useCallback(
      ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
        setTabBarHeight(layout.height + bottom);
        setWidth(layout.width - 16);
      },
      [bottom, setTabBarHeight],
    );

    return (
      <Row style={[SS.container, { bottom }]} onLayout={onLayout}>
        <BlurView
          style={StyleSheet.absoluteFillObject}
          blurType={"dark"}
          blurAmount={1}
        />
        <AnimatedBlurView
          style={[SS.active, activeIndicatorStyle]}
          blurType={"light"}
          blurAmount={1}
        />
        {routes.map(route => {
          return (
            <Touchable
              ctx={route.name}
              key={route.key}
              style={SS.tabTouchable}
              onPress={handleTabPress}
            >
              <Text
                color={"white"}
                textStyle={"Caption_M1"}
                numberOfLines={1}
                text={route.name}
              />
            </Touchable>
          );
        })}
      </Row>
    );
  },
);

const SS = StyleSheet.create({
  container: {
    position: "absolute",
    left: 32,
    right: 32,
    borderRadius: 32,
    overflow: "hidden",
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
  },
  tabTouchable: {
    flex: 1,
    flexBasis: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 36,
  },
  active: {
    borderRadius: 32,
    position: "absolute",
    left: 8,
    top: 8,
    bottom: 8,
  },
});
