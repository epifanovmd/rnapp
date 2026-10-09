import { Col, Row, Text } from "@shared/ui";
import React, { FC, ReactNode } from "react";

import { monoStyles } from "./mono-style";

interface IManifestItem {
  key: string;
  name: string;
  description?: string;
  extra?: ReactNode;
  footer?: ReactNode;
}

interface IWorkerManifestSectionProps {
  title: string;
  items: IManifestItem[];
}

/** Раздел манифеста воркера: имена с описаниями; пустой — не показывается. */
export const WorkerManifestSection: FC<IWorkerManifestSectionProps> = ({
  title,
  items,
}) =>
  items.length === 0 ? null : (
    <Col gap={6}>
      <Text textStyle={"Caption_M2"} color={"textSecondary"}>
        {title}
      </Text>
      {items.map(item => (
        <Col key={item.key} gap={2}>
          <Row wrap alignItems={"center"} gap={6}>
            <Text textStyle={"Body_S2"} style={monoStyles.mono}>
              {item.name}
            </Text>
            {item.extra}
          </Row>
          {!!item.description && (
            <Text textStyle={"Caption_M3"} color={"textSecondary"}>
              {item.description}
            </Text>
          )}
          {item.footer}
        </Col>
      ))}
    </Col>
  );
