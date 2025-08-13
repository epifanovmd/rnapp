import { AnimatedRefreshing, Container, Navbar } from "@components";
import { StackProps } from "@core";
import React, { FC, memo, useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView as RNWebView } from "react-native-webview";

export const WebView: FC<StackProps<"WebView">> = memo(({ route }) => {
  const params = route.params;

  const { bottom } = useSafeAreaInsets();
  const percentage = useSharedValue(0);

  useEffect(() => {
    percentage.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.url]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${percentage.value * 100}%`,
    opacity: withTiming(percentage.value === 1 ? 0 : 1),
  }));

  return (
    <Container edges={[]}>
      <Navbar title={params.title} />

      <Animated.View style={[styles.progressBar, animatedStyle]} />
      <RNWebView
        onLoadStart={() => {
          percentage.value = 0;
        }}
        onLoadEnd={() => (percentage.value = 1)}
        onLoadProgress={event => {
          percentage.value = event.nativeEvent.progress;
        }}
        renderLoading={() => <AnimatedRefreshing percentage={percentage} />}
        source={{ uri: params.url }}
        style={{ paddingBottom: bottom }}
        allowsBackForwardNavigationGestures={true}
      />
    </Container>
  );
});

const styles = StyleSheet.create({
  progressBar: {
    height: 2,
    backgroundColor: "red",
  },
});
