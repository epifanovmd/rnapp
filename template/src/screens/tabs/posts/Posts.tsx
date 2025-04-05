import {
  Container,
  Content,
  Header,
  PostList,
  useTransition,
} from "@components";
import { observer } from "mobx-react-lite";
import React, { FC, useEffect } from "react";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppScreenProps } from "../../../navigation";
import { usePostsVM } from "./hooks";

export const Posts: FC<AppScreenProps> = observer(() => {
  const { loading, list, onRefresh, onLoadMore } = usePostsVM();
  const { onScroll, transitionY } = useTransition();
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            backgroundColor: "red",
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
        <PostList
          data={list}
          onRefresh={onRefresh}
          onLoadMore={onLoadMore}
          refreshing={loading}
          onScroll={onScroll}
        />
      </Content>
    </Container>
  );
});
