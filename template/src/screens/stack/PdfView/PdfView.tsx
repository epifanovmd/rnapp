import { Container, Header } from "@components";
import { StackProps } from "@navigation";
import React, { FC, memo, useEffect } from "react";
import { StyleSheet } from "react-native";
import Pdf from "react-native-pdf";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const PdfView: FC<StackProps<"PdfView">> = memo(({ route }) => {
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
    <Container safeAreTop={false} safeAreBottom={false}>
      <Header backAction={true} title={params.title} />

      <Animated.View style={[styles.progressBar, animatedStyle]} />

      <Pdf
        source={{
          uri: params.url,
        }}
        enableDoubleTapZoom={false}
        onLoadComplete={() => {
          percentage.value = 1;
        }}
        enableAnnotationRendering={true}
        renderActivityIndicator={() => <></>}
        onLoadProgress={progress => {
          percentage.value = progress;
        }}
        style={[styles.pdf, { paddingBottom: bottom, backgroundColor: "#fff" }]}
      />
    </Container>
  );
});

const styles = StyleSheet.create({
  progressBar: {
    height: 2,
    backgroundColor: "red",
  },
  pdf: {
    flex: 1,
  },
});
