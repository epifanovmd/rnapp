import { useTheme } from "@shared/lib/theme";
import { Col, Row, Text, Touchable } from "@shared/ui";
import React, { FC, useState } from "react";

import type { IMeshPairView } from "../model/mesh";

interface INodeMeshPairProps {
  pair: IMeshPairView;
}

/**
 * Пара узлов: точка состояния, имена и задержка. По нажатию — оба
 * направления с подробностями; без свежих данных пара приглушена.
 */
export const NodeMeshPair: FC<INodeMeshPairProps> = ({ pair }) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const tone = pair.stale
    ? colors.textTertiary
    : pair.status === "down"
      ? colors.danger
      : pair.status === "loss"
        ? colors.warning
        : colors.success;
  const value = pair.stale
    ? "нет свежих данных"
    : pair.status === "down"
      ? "нет ответа"
      : pair.status === "loss"
        ? `${pair.rttLabel ?? ""} · ${pair.lossPct}%`
        : pair.rttLabel;

  return (
    <Touchable
      onPress={() => setExpanded(current => !current)}
      bg={"onSurface"}
      radius={10}
      ph={10}
      pv={6}
      gap={4}
      maxWidth={"100%"}
    >
      <Row alignItems={"center"} gap={6}>
        <Col circle={6} bg={tone} />
        <Text
          textStyle={"Caption_M2"}
          numberOfLines={1}
          flexShrink={1}
          color={pair.stale ? "textSecondary" : undefined}
        >{`${pair.aName} ⇄ ${pair.bName}`}</Text>
        {!!value && (
          <Text textStyle={"Caption_M2"} style={{ color: tone }}>
            {value}
          </Text>
        )}
      </Row>
      {expanded &&
        pair.directions.map(direction => (
          <Text
            key={direction.key}
            textStyle={"Caption_M3"}
            color={"textSecondary"}
          >
            {`${direction.fromName} → ${direction.toName}: ${direction.details}`}
          </Text>
        ))}
    </Touchable>
  );
};
