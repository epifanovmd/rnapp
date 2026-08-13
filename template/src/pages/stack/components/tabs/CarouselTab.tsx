import { useTheme } from "@shared/lib/theme";
import {
  Button,
  Carousel,
  Col,
  Icon,
  Image,
  Row,
  Text,
  TIconName,
  useCarousel,
} from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";
import { Easing } from "react-native-reanimated";

import { DemoScreen, DemoSection } from "./DemoScreen";

const GALLERY = [1, 12, 25, 33, 41].map(
  seed => `https://picsum.photos/id/${seed}/600/400`,
);

interface ITickerCard {
  icon: TIconName;
  title: string;
  value: string;
}

const TICKER_CARDS: ITickerCard[] = [
  { icon: "image", title: "Медиа", value: "1 284 файла" },
  { icon: "document", title: "Документы", value: "312 шт." },
  { icon: "camera", title: "Камера", value: "4K • 60fps" },
  { icon: "save", title: "Хранилище", value: "128 ГБ" },
  { icon: "search", title: "Индекс", value: "обновлён" },
  { icon: "settings", title: "Синхронизация", value: "вкл." },
];

const TICKER_CARD_WIDTH = 150;
const TICKER_CARD_GAP = 8;

/** Маленькая инфо-карточка бегущей строки. */
const TickerCard: FC<ITickerCard> = ({ icon, title, value }) => {
  const { colors } = useTheme();

  return (
    <Row
      alignItems={"center"}
      gap={8}
      mr={TICKER_CARD_GAP}
      ph={10}
      pv={8}
      radius={12}
      bg={"onSurface"}
      flex={1}
    >
      <Icon name={icon} size={18} color={colors.primary} />
      <Col flexShrink={1}>
        <Text color={"textSecondary"} textStyle={"Caption_M3"}>
          {title}
        </Text>
        <Text textStyle={"Caption_M2"}>{value}</Text>
      </Col>
    </Row>
  );
};

/** Пример собственного контрола на useCarousel(). */
const RandomSlideButton: FC = () => {
  const { count, scrollTo } = useCarousel();

  return (
    <Button
      mt={8}
      size={"small"}
      appearance={"outline"}
      title={"К случайному слайду"}
      onPress={() => scrollTo(Math.floor(Math.random() * count))}
    />
  );
};

const renderPhoto = ({ item }: { item: string }) => (
  <Image url={item} width={"100%"} height={"100%"} radius={16} ph={4} />
);

export const CarouselTab: FC = memo(() => {
  return (
    <DemoScreen>
      <DemoSection
        title={"Бегущая строка"}
        description={
          "autoplay с нулевым интервалом и линейным таймингом — " +
          "непрерывный тикер; свайп работает"
        }
      >
        <Carousel
          itemSize={TICKER_CARD_WIDTH + TICKER_CARD_GAP}
          style={styles.ticker}
          data={TICKER_CARDS}
          autoplay
          autoplayInterval={0}
          stopAutoplayOnInteraction={false}
          animation={{
            type: "timing",
            duration: 5000,
            easing: Easing.linear,
          }}
          renderItem={({ item }) => <TickerCard {...item} />}
        />
      </DemoSection>

      <DemoSection
        title={"Без настроек"}
        description={
          "<Carousel data renderItem /> — ширина от контейнера, loop; " +
          "Dots — слот-компонент"
        }
      >
        <Carousel data={GALLERY} renderItem={renderPhoto}>
          <Carousel.Dots position={"bottom"} placement={"outside"} />
        </Carousel>
      </DemoSection>

      <DemoSection
        title={"Progress bars"}
        description={
          "ProgressBars в timer-режиме: активная полоска заполняется по " +
          "таймеру автопрокрутки (2.5с) + Counter"
        }
      >
        <Carousel
          data={GALLERY}
          renderItem={renderPhoto}
          autoplay
          autoplayInterval={2500}
          loop={false}
          style={styles.gallery}
        >
          <Carousel.ProgressBars mode={"timer"} />
          <Carousel.Arrows />
          <Carousel.Counter />
        </Carousel>
      </DemoSection>

      <DemoSection
        title={"Progress bars без автоплея"}
        description={
          "ProgressBars в timer-режиме как пагинация: idleVariant=fill — " +
          "пройденные заполнены; move — активная переезжает по свайпу"
        }
      >
        <Carousel
          data={GALLERY}
          renderItem={renderPhoto}
          loop={false}
          style={styles.gallery}
        >
          <Carousel.ProgressBars mode={"timer"} />
        </Carousel>
      </DemoSection>

      <DemoSection
        title={"Parallax + стрелки"}
        description={"mode=parallax, Arrows и свой контрол через useCarousel"}
      >
        <Carousel
          data={GALLERY}
          renderItem={renderPhoto}
          layout={{
            type: "parallax",
            scale: 0.9,
            offset: 40,
          }}
        >
          <Carousel.Arrows />
          <Carousel.Dots position={"bottom"} placement={"outside"} />
          <RandomSlideButton />
        </Carousel>
      </DemoSection>
    </DemoScreen>
  );
});

const styles = StyleSheet.create({
  ticker: {
    height: 52,
  },
  gallery: {
    height: 220,
  },
  secondBars: {
    top: 18,
  },
});
