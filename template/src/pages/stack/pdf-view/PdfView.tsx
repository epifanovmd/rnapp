import { ScreenProps } from "@shared/lib/navigation";
import { Button, Container, EmptyState, Navbar } from "@shared/ui";
import React, { FC, memo, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Pdf from "react-native-pdf";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type TPdfViewParams = {
  title?: string;
  url: string;
};

export const PdfView: FC<ScreenProps<TPdfViewParams>> = memo(({ route }) => {
  const params = route.params;

  const { bottom } = useSafeAreaInsets();
  const percentage = useSharedValue(0);

  /** Ошибка загрузки документа; `attempt` — ключ повторной загрузки. */
  const [failed, setFailed] = useState<{ url: string; attempt: number }>({
    url: "",
    attempt: 0,
  });
  const isFailed = failed.url === params.url;

  useEffect(() => {
    percentage.value = 0;
  }, [params.url, percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${percentage.value * 100}%`,
    opacity: withTiming(percentage.value === 1 ? 0 : 1),
  }));

  return (
    <Container edges={[]}>
      <Navbar title={params.title}>
        <Navbar.BackButton />
      </Navbar>

      <Animated.View style={[styles.progressBar, animatedStyle]} />

      {isFailed ? (
        <EmptyState
          flex={1}
          icon={"circleAlert"}
          title={"Не удалось открыть документ"}
          action={
            <Button
              size={"small"}
              appearance={"outline"}
              title={"Повторить"}
              onPress={() => {
                percentage.value = 0;
                setFailed(prev => ({ url: "", attempt: prev.attempt + 1 }));
              }}
            />
          }
        />
      ) : (
        <Pdf
          key={failed.attempt}
          source={{
            uri: params.url,
          }}
          enableDoubleTapZoom={false}
          onLoadComplete={() => {
            percentage.value = 1;
          }}
          enableAnnotationRendering={true}
          renderActivityIndicator={() => <></>}
          onError={() => {
            percentage.value = 1;
            setFailed(prev => ({ ...prev, url: params.url }));
          }}
          onLoadProgress={progress => {
            percentage.value = progress;
          }}
          style={[styles.pdf, styles.background, { paddingBottom: bottom }]}
        />
      )}
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
  background: {
    backgroundColor: "#fff",
  },
});
