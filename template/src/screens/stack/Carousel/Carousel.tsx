import { Container, Header } from "@components";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { ImageStyle, StyleProp } from "react-native";
import { useDimensions } from "react-native-modalize/lib/utils/use-dimensions";
import { useSharedValue } from "react-native-reanimated";
import type { CarouselRenderItem } from "react-native-reanimated-carousel";
import Carousel from "react-native-reanimated-carousel";

import { StackProps } from "../../../navigation";
import { SlideItem } from "./SlideItem";

const defaultDataWith6Colors = [
  "#B0604D",
  "#899F9C",
  "#B3C680",
  "#5C6265",
  "#F5D399",
  "#F1F1F1",
];

interface Options {
  rounded?: boolean;
  style?: StyleProp<ImageStyle>;
}

const renderItem =
  ({ rounded = false, style }: Options = {}): CarouselRenderItem<string> =>
  ({ index, item }) =>
    (
      <SlideItem
        key={index}
        index={index}
        rounded={rounded}
        style={[style, { backgroundColor: item }]}
        source={{ uri: "https://picsum.photos/275/300" }}
      />
    );

export const CarouselScreen: FC<StackProps> = observer(() => {
  const progress = useSharedValue<number>(0);
  const { width } = useDimensions();

  return (
    <Container>
      <Header backAction={true} />

      <Carousel
        vertical={false}
        data={defaultDataWith6Colors}
        height={258}
        loop={false}
        pagingEnabled={true}
        snapEnabled={true}
        width={width}
        style={{
          width,
        }}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 50,
        }}
        onProgressChange={progress}
        renderItem={renderItem({ rounded: true })}
      />
    </Container>
  );
});
