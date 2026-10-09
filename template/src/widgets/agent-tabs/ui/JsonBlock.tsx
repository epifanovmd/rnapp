import { formatJson } from "@entities/agent";
import { Col, Text } from "@shared/ui";
import React, { FC } from "react";
import { ScrollView } from "react-native";

import { monoStyles } from "./mono-style";

interface IJsonBlockProps {
  title: string;
  value: unknown;
}

/** JSON с подписью и горизонтальной прокруткой. */
export const JsonBlock: FC<IJsonBlockProps> = ({ title, value }) => (
  <Col gap={6}>
    <Text textStyle={"Caption_M2"} color={"textSecondary"}>
      {title}
    </Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Text textStyle={"Caption_M3"} style={monoStyles.mono} selectable>
        {formatJson(value)}
      </Text>
    </ScrollView>
  </Col>
);
