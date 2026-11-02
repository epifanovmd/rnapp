import { Col, Text } from "@shared/ui";
import React, { FC } from "react";

export interface IPagerDemoPageParams {
  title: string;
}

interface IPagerDemoPageProps {
  route: { params: IPagerDemoPageParams };
}

/** Страница демо-пейджера: заголовок вкладки из параметров. */
export const PagerDemoPage: FC<IPagerDemoPageProps> = ({ route }) => (
  <Col flex={1} centerContent bg={"surface"} radius={16} mt={8}>
    <Text textStyle={"Title_S2"}>{route.params.title}</Text>
    <Text textStyle={"Caption_M3"} color={"textSecondary"}>
      {"Свайпните или нажмите сегмент"}
    </Text>
  </Col>
);
