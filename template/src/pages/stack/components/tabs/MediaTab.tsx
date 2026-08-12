import { useTheme } from "@shared/lib/theme";
import { Image, ImageViewing, Row, Text, Touchable } from "@shared/ui";
import React, { FC, memo, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Carousel, { Pagination } from "react-native-reanimated-carousel";

import { DemoScreen, DemoSection } from "./DemoScreen";

const GALLERY = [1, 12, 25, 33, 41].map(
  seed => `https://picsum.photos/id/${seed}/600/400`,
);

const VIEWER_IMAGES = GALLERY.map(uri => ({ uri }));

export const MediaTab: FC = memo(() => {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
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
          "Тап по превью — полноэкранный просмотр со свайпом и зумом"
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
        <Pagination.Basic
          progress={carouselProgress}
          data={GALLERY}
          dotStyle={StyleSheet.flatten([
            styles.dot,
            { backgroundColor: colors.textTertiary },
          ])}
          activeDotStyle={{ backgroundColor: colors.primary }}
          containerStyle={styles.pagination}
        />
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
  pagination: {
    gap: 6,
  },
});
