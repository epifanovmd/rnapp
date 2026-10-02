import { Col, Text } from "@shared/ui";
import React, { FC } from "react";

interface IPagerDemoPageProps {
  route: { name: string };
}

/** Страница демо-пейджера: заголовок по имени вкладки. */
export const PagerDemoPage: FC<IPagerDemoPageProps> = ({ route }) => (
  <Col flex={1} centerContent bg={"surface"} radius={16} mt={8}>
    <Text textStyle={"Title_S2"}>{route.name}</Text>
    <Text textStyle={"Caption_M3"} color={"textSecondary"}>
      {"Свайпните или нажмите сегмент"}
    </Text>
  </Col>
);
