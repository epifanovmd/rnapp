import { Container, Content, Header, Text, useTransition } from "@components";
import { RefreshingContainer } from "@components/layouts/RefreshingContainer";
import { Col } from "@force-dev/react-mobile";
import { observer } from "mobx-react-lite";
import React, { FC, useEffect } from "react";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppScreenProps } from "../../../navigation";

export const Main: FC<AppScreenProps> = observer(() => {
  const { onScroll, transitionY } = useTransition();
  const { top } = useSafeAreaInsets();

  const styles = useAnimatedStyle(() => {
    return {
      height: interpolate(transitionY.value, [0, 205, 300], [300, 95, 95]),
      opacity: interpolate(
        transitionY.value,
        [0, 200, 250, 300],
        [1, 1, 0.4, 0.4],
      ),
    };
  });

  return (
    <Container
      safeAreBottom={false}
      safeAreTop={false}
      style={{ paddingTop: top }}
    >
      <Header animatedValue={transitionY} />
      <Animated.Image
        style={[
          styles,
          {
            backgroundColor: "#00000030",
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          },
        ]}
        source={{ uri: "https://picsum.photos/275/300" }}
      />

      <Content>
        <RefreshingContainer.ScrollView onScroll={onScroll}>
          {new Array(20).fill(0).map((_, i) => (
            <Col height={60} key={i}>
              <Text>{`Item ${i + 1}`}</Text>
            </Col>
          ))}
        </RefreshingContainer.ScrollView>
      </Content>
    </Container>
  );
});
