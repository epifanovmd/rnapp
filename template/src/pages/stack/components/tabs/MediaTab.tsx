import { useTheme } from "@shared/lib/theme";
import { Image, ImageViewing, Row, Text, Touchable } from "@shared/ui";
import React, { FC, memo, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";

import { DemoScreen, DemoSection } from "./DemoScreen";

const GALLERY = [1, 12, 25, 33, 41].map(
  seed => `https://picsum.photos/id/${seed}/600/400`,
);

interface ICarouselDotProps {
  index: number;
  count: number;
  progress: SharedValue<number>;
}

/**
 * Точка пагинации карусели: активность — worklet по progress.
 * Pagination.Basic из reanimated-carousel читает progress.value в рендере
 * (strict-warning Reanimated) — поэтому свои точки.
 */
const CarouselDot: FC<ICarouselDotProps> = ({ index, count, progress }) => {
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const raw = Math.abs(progress.value - index);
    // loop-карусель: расстояние с учётом перехода через край.
    const distance = Math.min(raw, count - raw);

    return {
      opacity: interpolate(distance, [0, 1], [1, 0.35], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(distance, [0, 1], [1.25, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: colors.primary }, animatedStyle]}
    />
  );
};

const VIEWER_IMAGES = GALLERY.map(uri => ({ uri }));

export const MediaTab: FC = memo(() => {
  const { width } = useWindowDimensions();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const carouselProgress = useSharedValue(0);

  const slideWidth = width - 32;

  return (
    <DemoScreen>
      <DemoSection
        title={"Image"}
        description={"FastImage c FlexProps: размеры, radius, resizeMode"}
      >
        <Row gap={12}>
          <Image url={GALLERY[0]} width={96} height={96} radius={12} />
          <Image url={GALLERY[1]} width={96} height={96} radius={48} />
          <Image
            url={GALLERY[2]}
            width={96}
            height={96}
            radius={12}
            resizeMode={"contain"}
          />
        </Row>
      </DemoSection>

      <DemoSection
        title={"ImageViewing"}
        description={
          "Полноэкранный просмотр: pinch/double-tap-зум, свайп-закрытие, " +
          "тап скрывает бары, кастомный футер"
        }
      >
        <Row gap={8}>
          {GALLERY.map((url, index) => (
            <Touchable key={url} onPress={() => setViewerIndex(index)}>
              <Image url={url} width={56} height={56} radius={8} />
            </Touchable>
          ))}
        </Row>
        <ImageViewing
          images={VIEWER_IMAGES}
          imageIndex={viewerIndex ?? 0}
          visible={viewerIndex !== null}
          onRequestClose={() => setViewerIndex(null)}
          onLongPress={(_image, index) =>
            console.log("ImageViewing long press:", index)
          }
          renderFooter={({ index, count }) => (
            <Text
              color={"white"}
              textAlign={"center"}
              pv={24}
            >{`Подпись к изображению ${index + 1} из ${count}`}</Text>
          )}
        />
      </DemoSection>

      <DemoSection
        title={"Carousel"}
        description={
          "react-native-reanimated-carousel: parallax-режим + Pagination"
        }
      >
        <View style={styles.carousel}>
          <Carousel
            width={slideWidth}
            height={180}
            data={GALLERY}
            loop
            mode={"parallax"}
            modeConfig={{
              parallaxScrollingScale: 0.9,
              parallaxScrollingOffset: 40,
            }}
            onProgressChange={carouselProgress}
            renderItem={({ item }) => (
              <Image url={item} width={"100%"} height={180} radius={16} />
            )}
          />
        </View>
        <Row alignSelf={"center"} gap={6}>
          {GALLERY.map((url, index) => (
            <CarouselDot
              key={url}
              index={index}
              count={GALLERY.length}
              progress={carouselProgress}
            />
          ))}
        </Row>
        <Text color={"textSecondary"} textStyle={"Caption_M3"}>
          Свайпайте слайды — соседние карточки уменьшены parallax-режимом
        </Text>
      </DemoSection>
    </DemoScreen>
  );
});

const styles = StyleSheet.create({
  carousel: {
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
