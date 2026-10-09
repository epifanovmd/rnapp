import type { INodeMeshDto } from "@shared/api/gen/main/model";
import { Col, Row, Text } from "@shared/ui";
import React, { FC, useMemo } from "react";

import { meshPairs } from "../model/mesh";
import { NodeMeshPair } from "./NodeMeshPair";

interface INodeMeshStripProps {
  mesh: INodeMeshDto;
}

/** Связность узлов над списком: пары с задержкой между узлами. */
export const NodeMeshStrip: FC<INodeMeshStripProps> = ({ mesh }) => {
  const pairs = useMemo(() => meshPairs(mesh), [mesh]);

  if (!pairs.length) return null;

  return (
    <Col gap={8}>
      <Text textStyle={"Caption_M1"} color={"textSecondary"} ph={4}>
        {"Связность (проверка сети между узлами)"}
      </Text>
      <Row wrap gap={6}>
        {pairs.map(pair => (
          <NodeMeshPair key={pair.key} pair={pair} />
        ))}
      </Row>
    </Col>
  );
};
