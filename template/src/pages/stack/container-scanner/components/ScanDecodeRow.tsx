import { Col, Row, Text } from "@shared/ui";
import React, { FC, memo } from "react";

interface IScanDecodeRowProps {
  fragment: string;
  meaning: string;
  detail: string;
}

export const ScanDecodeRow: FC<IScanDecodeRowProps> = memo(
  ({ fragment, meaning, detail }) => (
    <Row mt={10} alignItems={"flex-start"}>
      <Col
        minWidth={64}
        pv={2}
        ph={8}
        radius={6}
        bg={"onSurface"}
        alignItems={"center"}
      >
        <Text textStyle={"Body_S1"}>{fragment}</Text>
      </Col>
      <Col ml={12} flex={1}>
        <Text>{meaning}</Text>
        <Text mt={2} color={"textSecondary"} textStyle={"Caption_M2"}>
          {detail}
        </Text>
      </Col>
    </Row>
  ),
);
