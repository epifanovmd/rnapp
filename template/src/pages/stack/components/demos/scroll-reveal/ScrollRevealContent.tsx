import type { IScrollReveal } from "@shared/lib/scroll-reveal";
import {
  Avatar,
  Col,
  ListItem,
  Notice,
  Row,
  ScrollRevealAnchor,
  Segmented,
  Tag,
  Text,
  TRevealPreset,
} from "@shared/ui";
import React, { FC } from "react";

import { REVEAL_DEMO_DETAILS, REVEAL_DEMO_NAME } from "./reveal-demo-data";

const PRESETS: { value: TRevealPreset; label: string }[] = [
  { value: "slide-up", label: "Slide up" },
  { value: "fade", label: "Fade" },
  { value: "scale", label: "Scale" },
];

const ROWS = Array.from({ length: 24 }, (_, index) => index + 1);

interface IScrollRevealContentProps {
  reveal: IScrollReveal;
  preset: TRevealPreset;
  onPresetChange: (preset: TRevealPreset) => void;
}

/** Карточка-якорь и список; компактная версия карточки появляется в шапке. */
export const ScrollRevealContent: FC<IScrollRevealContentProps> = ({
  reveal,
  preset,
  onPresetChange,
}) => (
  <>
    <ScrollRevealAnchor reveal={reveal}>
      <Row alignItems={"center"} gap={12}>
        <Avatar name={REVEAL_DEMO_NAME} size={56} online />
        <Col flex={1} gap={4}>
          <Row alignItems={"center"} gap={8}>
            <Text textStyle={"Title_L"} flexShrink={1} numberOfLines={1}>
              {REVEAL_DEMO_NAME}
            </Text>
            <Tag variant={"success"}>{"онлайн"}</Tag>
          </Row>
          <Text textStyle={"Body_S2"} color={"textSecondary"}>
            {REVEAL_DEMO_DETAILS}
          </Text>
        </Col>
      </Row>
    </ScrollRevealAnchor>

    <Notice
      title={"Прокрутите вниз"}
      description={
        "Карточка уходит под шапку — её компактная версия выезжает в шапке. Тап по шапке — наверх."
      }
    />
    <Segmented options={PRESETS} value={preset} onValueChange={onPresetChange} />

    {ROWS.map(row => (
      <ListItem key={row} title={`Строка ${row}`} subtitle={"Содержимое"} />
    ))}
  </>
);
