import { Container, Header, Text } from "@components";
import { Col } from "@force-dev/react-mobile";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { ImageStyle, StyleProp } from "react-native";
import { useDimensions } from "react-native-modalize/lib/utils/use-dimensions";
import { useSharedValue } from "react-native-reanimated";
import {
  CarouselRenderItem,
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
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
  const { width, height } = useDimensions();
  const ref = React.useRef<ICarouselInstance>(null);

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      /**
       * Calculate the difference between the current index and the target index
       * to ensure that the carousel scrolls to the nearest index
       */
      count: index - progress.value,
      animated: true,
    });
  };

  return (
    <Container>
      <Header backAction={true} />
      <Carousel
        ref={ref}
        vertical={false}
        data={defaultDataWith6Colors}
        height={height - 200}
        loop={false}
        pagingEnabled={true}
        snapEnabled={true}
        width={width}
        style={{
          width,
        }}
        onProgressChange={progress}
        renderItem={renderItem({ rounded: true })}
      />
      <Pagination.Basic
        progress={progress}
        data={defaultDataWith6Colors}
        dotStyle={{
          backgroundColor: "rgba(0,0,0,0.2)",
          height: 3,
          borderRadius: 8,
          width: width / defaultDataWith6Colors.length - 4,
        }}
        containerStyle={{ gap: 2, marginHorizontal: 8 }}
        onPress={onPressPagination}
      />
    </Container>
  );
});
