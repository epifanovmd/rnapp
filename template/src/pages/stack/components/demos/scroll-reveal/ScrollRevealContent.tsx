import { useScrollReveal } from "@shared/lib/scroll-reveal";
import {
  Avatar,
  Col,
  ListItem,
  Notice,
  RevealView,
  Row,
  Segmented,
  Tag,
  Text,
  TRevealPreset,
  useNavbarReveal,
} from "@shared/ui";
import React, { FC, useState } from "react";
import { View } from "react-native";

const PRESETS: { value: TRevealPreset; label: string }[] = [
  { value: "slide-up", label: "Slide up" },
  { value: "fade", label: "Fade" },
  { value: "scale", label: "Scale" },
];

const ROWS = Array.from({ length: 24 }, (_, index) => index + 1);

const NAME = "Анна Смирнова";
const DETAILS = "10.0.0.26 · wg0 · Альфа";

/** Карточка-якорь и список; компактная версия карточки появляется в шапке. */
export const ScrollRevealContent: FC = () => {
  const [preset, setPreset] = useState<TRevealPreset>("slide-up");
  const reveal = useScrollReveal();
  const { progress, scrollToTop } = reveal;

  useNavbarReveal({
    progress,
    title: NAME,
    subtitle: DETAILS,
    fallbackTitle: "Scroll reveal",
    preset,
    onPress: scrollToTop,
  });

  return (
    <>
      <View ref={reveal.anchorRef} onLayout={reveal.onLayout}>
        <RevealView progress={progress} preset={"fade"} inverse>
          <Row alignItems={"center"} gap={12}>
            <Avatar name={NAME} size={56} online />
            <Col flex={1} gap={4}>
              <Row alignItems={"center"} gap={8}>
                <Text textStyle={"Title_L"} flexShrink={1} numberOfLines={1}>
                  {NAME}
                </Text>
                <Tag variant={"success"}>{"онлайн"}</Tag>
              </Row>
              <Text textStyle={"Body_S2"} color={"textSecondary"}>
                {DETAILS}
              </Text>
            </Col>
          </Row>
        </RevealView>
      </View>

      <Notice
        title={"Прокрутите вниз"}
        description={
          "Карточка уходит под шапку — её компактная версия выезжает в шапке. Тап по шапке — наверх."
        }
      />
      <Segmented options={PRESETS} value={preset} onValueChange={setPreset} />

      {ROWS.map(row => (
        <ListItem key={row} title={`Строка ${row}`} subtitle={"Содержимое"} />
      ))}
    </>
  );
};
