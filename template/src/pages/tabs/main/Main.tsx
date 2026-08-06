import { AppScreenProps } from "@shared/lib/navigation";
import { usePullToRefreshScroll } from "@shared/lib/pull-to-refresh";
import { ScrollProvider, useScrollTelemetry } from "@shared/lib/scroll";
import { useTheme } from "@shared/lib/theme";
import { useBarsScrollSync, useTransition } from "@shared/lib/transition";
import { Col, Content, Navbar, Text, Touchable } from "@shared/ui";
import { ImageBar } from "@shared/ui/navbar/ImageBar";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback } from "react";
import { GestureDetector } from "react-native-gesture-handler";
import { trigger } from "react-native-haptic-feedback";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { RefreshIndicator } from "./RefreshIndicator";

const armedHaptic = () => trigger("impactMedium");

export const Main: FC<AppScreenProps> = observer(({ route: { name } }) => {
  const { navbar, tabBar } = useTransition();
  const { colors } = useTheme();

  const telemetry = useScrollTelemetry();

  useBarsScrollSync(telemetry);

  const onRefresh = useCallback(
    () => new Promise(resolve => setTimeout(resolve, 1500)),
    [],
  );

  const ptr = usePullToRefreshScroll({
    telemetry,
    onRefresh,
    onStateChange: (_prev, next) => {
      "worklet";
      if (next === "armed") {
        scheduleOnRN(armedHaptic);
      }
    },
  });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ptr.contentTranslateY.value }],
  }));

  return (
    <ScrollProvider telemetry={telemetry}>
      <Col flex={1}>
        <ImageBar height={300} safeArea uri={"https://picsum.photos/275/300"}>
          <Navbar transparent title={name}>
            <Navbar.Title color={"white"} />
          </Navbar>
        </ImageBar>

        <Content>
          <RefreshIndicator controller={ptr} topOffset={navbar.height} />

          <GestureDetector gesture={ptr.gesture}>
            <Animated.FlatList
              style={contentStyle}
              data={new Array(50).fill(0)}
              onScroll={telemetry.scrollHandler}
              scrollEventThrottle={16}
              contentContainerStyle={{
                paddingTop: 316,
                paddingBottom: tabBar.height,
              }}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <Col height={8} />}
              renderItem={({ index }) => (
                <Touchable
                  bg={colors.onSurface}
                  radius={16}
                  pa={8}
                  height={120}
                  key={index}
                >
                  <Text textStyle={"Title_L"}>{`Карточка ${index + 1}`}</Text>
                  <Text textStyle={"Body_M1"} color={"textSecondary"}>
                    {"Текст"}
                  </Text>
                  <Text textStyle={"Body_M1"} color={"textSecondary"}>
                    {"Текст"}
                  </Text>
                </Touchable>
              )}
            />
          </GestureDetector>
        </Content>
      </Col>
    </ScrollProvider>
  );
});
